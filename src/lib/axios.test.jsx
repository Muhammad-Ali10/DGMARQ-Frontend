// The 401 interceptor. Its job is to renew an EXPIRED session transparently —
// and its failure mode is doing that to someone who never had one, which costs
// the server's actual message.
//
// Driven through the real instance with a fake adapter, so the assertions are
// about the shipped interceptor rather than a re-description of it.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

const authState = { isAuthenticated: false };

vi.mock('@store/store', () => ({
  store: {
    getState: () => ({ auth: authState }),
    dispatch: vi.fn(),
  },
}));

vi.mock('@utils/toast', () => ({
  showApiError: vi.fn(),
  showError: vi.fn(),
}));

const { default: api } = await import('./axios');

/** Answer every request through `api` with this status + body. */
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
    // The refresh call goes through the BARE axios, not this instance. It is
    // mocked as FAILING by default because that is what a guest gets — there is
    // no refresh cookie — and that failure is what used to replace the real
    // message. A test where the refresh succeeds would pass either way.
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
    // The pre-order login gate: the server explains what to do, and the buyer
    // used to be shown "unauthorize" from the refresh endpoint instead.
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
    expect(calls).toBe(2); // original + replay
  });

  it('leaves a wrong password to the login form, session or not', async () => {
    authState.isAuthenticated = true;
    respondWith(401, { message: 'Invalid credentials' });

    await expect(api.post('/user/login', {})).rejects.toMatchObject({
      response: { data: { message: 'Invalid credentials' } },
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
