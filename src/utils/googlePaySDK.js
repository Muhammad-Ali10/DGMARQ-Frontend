const PAY_JS_SRC = 'https://pay.google.com/gp/p/js/pay.js';

const LOAD_TIMEOUT_MS = 10000;

let googlePayPromise = null;

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
      setTimeout(onLoad, LOAD_TIMEOUT_MS);
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

export const getGooglePayEnvironment = () =>
  import.meta.env.VITE_GOOGLE_PAY_ENV === 'production' ? 'PRODUCTION' : 'TEST';
