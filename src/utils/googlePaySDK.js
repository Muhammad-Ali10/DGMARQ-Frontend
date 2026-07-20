/**
 * Google Pay JS API loader (pay.js). Prevents double-loading across components.
 * Mirrors the PayPal SDK loader's dedupe pattern.
 *
 * Google Pay here is fulfilled THROUGH PayPal (paypal.Googlepay()), so this
 * script is only the button + payment-sheet half; PayPal remains the processor.
 */
const PAY_JS_SRC = 'https://pay.google.com/gp/p/js/pay.js';

let googlePayPromise = null;

/** Resolves with window.google.payments.api, or rejects if pay.js can't load. */
export const getGooglePaySDK = async () => {
  if (window.google?.payments?.api) return window.google.payments.api;
  if (googlePayPromise) return googlePayPromise;

  googlePayPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PAY_JS_SRC}"]`);
    const onLoad = () => {
      if (window.google?.payments?.api) resolve(window.google.payments.api);
      else reject(new Error('pay.js loaded but google.payments.api is unavailable'));
    };
    if (existing) {
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load pay.js')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = PAY_JS_SRC;
    script.async = true;
    script.onload = onLoad;
    script.onerror = () => {
      googlePayPromise = null;
      reject(new Error('Failed to load pay.js'));
    };
    document.head.appendChild(script);
  }).catch((err) => {
    googlePayPromise = null;
    throw err;
  });

  return googlePayPromise;
};

/**
 * Google Pay environment. TEST is the safe default — PRODUCTION requires the
 * merchant to be fully onboarded, and using it too early makes the sheet fail.
 * Set VITE_GOOGLE_PAY_ENV=production once live.
 */
export const getGooglePayEnvironment = () =>
  import.meta.env.VITE_GOOGLE_PAY_ENV === 'production' ? 'PRODUCTION' : 'TEST';
