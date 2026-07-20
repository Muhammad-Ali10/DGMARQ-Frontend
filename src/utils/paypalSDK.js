/**
 * PayPal SDK loader. Prevents double-loading across components.
 */
import { loadScript } from '@paypal/paypal-js';

let paypalSDKPromise = null;
let paypalSDKInstance = null;

export const getPayPalSDK = async () => {
  if (paypalSDKInstance) {
    return paypalSDKInstance;
  }
  if (paypalSDKPromise) {
    return paypalSDKPromise;
  }
  paypalSDKPromise = (async () => {
    try {
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('VITE_PAYPAL_CLIENT_ID is not configured in environment variables');
      }
      const sdk = await loadScript({
        clientId,
        // `googlepay` powers paypal.Googlepay() (config/confirmOrder) — Google Pay
        // is a PayPal COMPONENT, not a Buttons funding source.
        components: 'buttons,card-fields,googlepay',
        currency: 'USD',
        intent: 'capture',
        // Apple Pay is intentionally OFF (product decision: PayPal + Google Pay + card only).
        'disable-funding': 'paylater,applepay',
        'data-namespace': 'paypal_sdk',
      });
      paypalSDKInstance = sdk;
      paypalSDKPromise = null;
      return sdk;
    } catch (error) {
      paypalSDKPromise = null;
      throw error;
    }
  })();

  return paypalSDKPromise;
};

