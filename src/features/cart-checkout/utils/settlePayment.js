import { checkoutAPI } from '@services/api';

export const STILL_CONFIRMING =
  "We're still confirming your payment. Please don't pay again — check My Orders in a few minutes.";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isAmbiguousFailure = (error) => {
  const status = error?.response?.status;
  return !error?.response || status === 502 || status === 503 || status === 504 || error?.code === 'ECONNABORTED';
};

export const interpretPaymentResponse = (data) => {
  if (data?.pending) return { status: 'pending', message: data.message || STILL_CONFIRMING };
  if (data?.processing) return { status: 'processing' };
  const captureStatus = data?.status || data?.data?.status;
  if (data?.ok === false || (captureStatus && captureStatus !== 'COMPLETED')) {
    return {
      status: 'failed',
      message: data?.message || data?.data?.message || `Payment capture failed. Status: ${captureStatus || 'unknown'}`,
    };
  }
  return { status: 'paid', payload: data };
};

export const waitForCheckoutOutcome = async (checkoutId, { guestEmail, pollMs = 3000, attempts = 40 } = {}) => {
  for (let i = 0; i < attempts; i += 1) {
    await sleep(pollMs);
    try {
      const res = await checkoutAPI.getCheckoutStatus(checkoutId, guestEmail);
      const checkout = res.data?.data;
      if (checkout?.status === 'paid' && checkout.orderId) {
        return { status: 'paid', payload: { order: { _id: checkout.orderId } } };
      }
      if (checkout?.capturePendingAt) return { status: 'pending', message: STILL_CONFIRMING };
      if (checkout && !['pending', 'processing'].includes(checkout.status)) {
        return { status: 'failed', message: 'This payment did not go through. You have not been charged for an order.' };
      }
    } catch {
      continue;
    }
  }
  return { status: 'pending', message: STILL_CONFIRMING };
};

export const settlePayment = async (send, checkoutId, options) => {
  let outcome;
  try {
    const res = await send();
    outcome = interpretPaymentResponse(res?.data ?? res);
  } catch (error) {
    if (!isAmbiguousFailure(error)) {
      return { status: 'failed', message: error?.response?.data?.message || error?.message || 'Payment failed' };
    }
    outcome = { status: 'processing' };
  }
  return outcome.status === 'processing' ? waitForCheckoutOutcome(checkoutId, options) : outcome;
};
