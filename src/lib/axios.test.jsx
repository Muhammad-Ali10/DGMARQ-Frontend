import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

const authState = { isAuthenticated: false };
const dispatch = vi.fn();

vi.mock('@store/store', () => ({
  store: {
    getState: () => ({ auth: authState }),
    dispatch: (...args) => dispatch(...args),
  },
}));

vi.mock('@utils/toast', () => ({
  showApiError: vi.fn(),
  showError: vi.fn(),
}));

const { default: api } = await import('./axios');

const respondWith = (status, data) => {
  api.defaults.adapter = async (config) => {
    const err = new Error(`Request failed with status code ${status}`);
    err.config = config;
    err.response = { status, data, config, headers: {} };
    throw err;
  };
};

describe('401 handling', () => {
  let refresh;

  beforeEach(() => {
    authState.isAuthenticated = false;
    dispatch.mockClear();
    localStorage.clear();
    refresh = vi.spyOn(axios, 'post').mockRejectedValue(
      Object.assign(new Error('refresh failed'), {
        response: { status: 401, data: { message: 'unauthorize' } },
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete api.defaults.adapter;
  });

  it("keeps the server's message when the caller has no session", async () => {
    const message = '"Zero Hour" is a pre-order — please log in or create an account to pre-order it.';
    respondWith(401, { message });

    await expect(api.post('/checkout/create-session', {})).rejects.toMatchObject({
      response: { data: { message } },
    });
  });

  it('does not try to refresh a session that does not exist', async () => {
    respondWith(401, { message: 'please log in' });

    await api.post('/checkout/create-session', {}).catch(() => {});

    expect(refresh).not.toHaveBeenCalled();
  });

  it('still refreshes and replays for a signed-in user whose token expired', async () => {
    authState.isAuthenticated = true;
    refresh.mockResolvedValue({ data: {} });
    let calls = 0;
    api.defaults.adapter = async (config) => {
      calls += 1;
      if (calls === 1) {
        const err = new Error('expired');
        err.config = config;
        err.response = { status: 401, data: { message: 'jwt expired' }, config, headers: {} };
        throw err;
      }
      return { status: 200, data: { ok: true }, config, headers: {} };
    };

    const res = await api.get('/user/profile');

    expect(refresh).toHaveBeenCalledOnce();
    expect(res.data).toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it('leaves a wrong password to the login form, session or not', async () => {
    authState.isAuthenticated = true;
    respondWith(401, { message: 'Invalid credentials' });

    await expect(api.post('/user/login', {})).rejects.toMatchObject({
      response: { data: { message: 'Invalid credentials' } },
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  const expiredUntilRefreshed = (state) => async (config) => {
    if (!state.refreshed) {
      const err = new Error('expired');
      err.config = config;
      err.response = { status: 401, data: { message: 'jwt expired' }, config, headers: {} };
      throw err;
    }
    return { status: 200, data: { url: config.url }, config, headers: {} };
  };

  it('shares ONE refresh between concurrent 401s instead of racing five', async () => {
    authState.isAuthenticated = true;
    const state = { refreshed: false };
    let release;
    refresh.mockImplementation(() => new Promise((resolve) => {
      release = () => { state.refreshed = true; resolve({ data: {} }); };
    }));
    api.defaults.adapter = expiredUntilRefreshed(state);

    const pending = ['/cart', '/notification', '/notification/unread-count', '/support/unread', '/user/profile']
      .map((url) => api.get(url));
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    release();
    const results = await Promise.all(pending);

    expect(refresh).toHaveBeenCalledOnce();
    expect(results.map((r) => r.data.url)).toEqual(['/cart', '/notification', '/notification/unread-count', '/support/unread', '/user/profile']);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('replays without refreshing when a refresh finished after the request was sent', async () => {
    authState.isAuthenticated = true;
    const state = { refreshed: false };
    api.defaults.adapter = async (config) => {
      if (!state.refreshed) {
        state.refreshed = true;
        localStorage.setItem('dgmarq:session-refreshed-at', String(Date.now() + 1000));
      }
      if (config._retry) return { status: 200, data: { ok: true }, config, headers: {} };
      const err = new Error('expired');
      err.config = config;
      err.response = { status: 401, data: { message: 'jwt expired' }, config, headers: {} };
      throw err;
    };

    const res = await api.get('/cart');

    expect(res.data).toEqual({ ok: true });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('does NOT log the user out when the refresh fails for an outage (503)', async () => {
    authState.isAuthenticated = true;
    refresh.mockRejectedValue(Object.assign(new Error('unavailable'), {
      response: { status: 503, data: { message: 'Sign-in is temporarily unavailable.' } },
    }));
    respondWith(401, { message: 'jwt expired' });

    await expect(api.get('/cart')).rejects.toMatchObject({ response: { status: 401 } });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('logs the user out when the server refuses the session', async () => {
    authState.isAuthenticated = true;
    respondWith(401, { message: 'jwt expired' });

    await api.get('/cart').catch(() => {});

    expect(refresh).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledOnce();
  });
});
