import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCheckoutStatus = vi.fn();
vi.mock('@services/api', () => ({ checkoutAPI: { getCheckoutStatus: (...args) => getCheckoutStatus(...args) } }));

const { settlePayment, interpretPaymentResponse, STILL_CONFIRMING } = await import('./settlePayment');

const fast = { pollMs: 0, attempts: 3 };

describe('interpretPaymentResponse', () => {
  it('reads a completed capture as paid', () => {
    expect(interpretPaymentResponse({ ok: true, status: 'COMPLETED', order: { _id: 'o1' } }).status).toBe('paid');
  });

  it('reads a PayPal review as pending, not failed', () => {
    expect(interpretPaymentResponse({ ok: false, pending: true, message: 'review' })).toEqual({ status: 'pending', message: 'review' });
  });

  it('reads a refused capture as failed with the server message', () => {
    expect(interpretPaymentResponse({ ok: false, message: 'Declined' })).toEqual({ status: 'failed', message: 'Declined' });
  });
});

describe('settlePayment', () => {
  beforeEach(() => getCheckoutStatus.mockReset());

  it('waits for the order instead of failing when the request times out', async () => {
    getCheckoutStatus
      .mockResolvedValueOnce({ data: { data: { status: 'processing' } } })
      .mockResolvedValueOnce({ data: { data: { status: 'paid', orderId: 'order-9' } } });
    const send = () => Promise.reject(Object.assign(new Error('timeout'), { response: { status: 503 } }));
    const outcome = await settlePayment(send, 'chk', { ...fast, guestEmail: 'g@x.test' });
    expect(outcome).toEqual({ status: 'paid', payload: { order: { _id: 'order-9' } } });
    expect(getCheckoutStatus).toHaveBeenCalledWith('chk', 'g@x.test');
  });

  it('polls when the server says the payment is still processing', async () => {
    getCheckoutStatus.mockResolvedValue({ data: { data: { status: 'pending', capturePendingAt: '2026-10-07' } } });
    const outcome = await settlePayment(() => Promise.resolve({ data: { ok: false, processing: true } }), 'chk', fast);
    expect(outcome).toEqual({ status: 'pending', message: STILL_CONFIRMING });
  });

  it('never invites a second payment when the outcome stays unknown', async () => {
    getCheckoutStatus.mockResolvedValue({ data: { data: { status: 'processing' } } });
    const outcome = await settlePayment(() => Promise.reject(new Error('Network Error')), 'chk', fast);
    expect(outcome.status).toBe('pending');
  });

  it('reports a real refusal straight away without polling', async () => {
    const send = () => Promise.reject(Object.assign(new Error('bad'), { response: { status: 400, data: { message: 'Insufficient wallet balance' } } }));
    expect(await settlePayment(send, 'chk', fast)).toEqual({ status: 'failed', message: 'Insufficient wallet balance' });
    expect(getCheckoutStatus).not.toHaveBeenCalled();
  });
});
