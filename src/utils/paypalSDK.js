/**
 * PayPal SDK Singleton Loader
 * 
 * Prevents double-loading of PayPal SDK across components
 * Uses VITE_PAYPAL_CLIENT_ID from environment
 */
import { loadScript } from '@paypal/paypal-js';

let paypalSDKPromise = null;
let paypalSDKInstance = null;

/**
 * Get or load PayPal SDK (singleton pattern)
 * @returns {Promise<Object>} PayPal SDK instance
 */
export const getPayPalSDK = async () => {
  // Return cached instance if available
  if (paypalSDKInstance) {
    return paypalSDKInstance;
  }

  // Return existing promise if SDK is currently loading
  if (paypalSDKPromise) {
    return paypalSDKPromise;
  }

  // Load SDK (singleton - only one load at a time)
  paypalSDKPromise = (async () => {
    try {
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('VITE_PAYPAL_CLIENT_ID is not configured in environment variables');
      }

      // FIX: Load SDK with CardFields support and disable Pay Later
      // Use "disable-funding" with hyphen as string key (paypal-js format)
      const sdk = await loadScript({
        clientId,
        components: 'buttons,card-fields',
        currency: 'USD',
        intent: 'capture',
        'disable-funding': 'paylater', // FIX: Disable Pay Later button (string key with hyphen)
        // FIX: Ensure SDK loads securely
        'data-namespace': 'paypal_sdk',
      });

      // Cache the instance
      paypalSDKInstance = sdk;
      paypalSDKPromise = null; // Clear promise after success

      return sdk;
    } catch (error) {
      // Clear promise on error so retry is possible
      paypalSDKPromise = null;
      throw error;
    }
  })();

  return paypalSDKPromise;
};

/**
 * Reset SDK instance (for testing or re-initialization)
 */
export const resetPayPalSDK = () => {
  paypalSDKInstance = null;
  paypalSDKPromise = null;
};

