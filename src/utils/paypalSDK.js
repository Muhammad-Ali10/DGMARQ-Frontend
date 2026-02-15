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
        components: 'buttons,card-fields',
        currency: 'USD',
        intent: 'capture',
        'disable-funding': 'paylater',
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

export const resetPayPalSDK = () => {
  paypalSDKInstance = null;
  paypalSDKPromise = null;
};

