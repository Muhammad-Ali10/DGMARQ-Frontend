import { API_ORIGIN } from '@lib/config';

// The five providers the marketplace supports, in the order the v74 mockup shows
// them. Order lives here (not at each call site) so the Register popup, the login
// page and the signup page cannot drift into three different orders.
//
// These ids are the URL segment AND the backend's `oauthProvider` enum value
// (models/user.model.js) — one string, three jobs, so there is nothing to map.
export const SOCIAL_PROVIDER_IDS = ['google', 'facebook', 'discord', 'steam', 'paypal'];

// A full-page navigation, NOT fetch/axios: the provider answers with a 302 to its
// own consent screen, and an XHR cannot follow that across origins. The browser
// has to own the redirect chain.
export const startSocialAuth = (providerId) => {
  window.location.href = `${API_ORIGIN}/api/v1/user/auth/${providerId}`;
};

// Display names. Exported because SocialAuthButtons labels its buttons from the
// same map that describeAuthError names providers in — one spelling of "PayPal".
export const PROVIDER_LABELS = {
  google: 'Google',
  facebook: 'Facebook',
  discord: 'Discord',
  steam: 'Steam',
  paypal: 'PayPal',
};

// Both failure modes the backend can redirect back with:
//   ?error=oauth_failed                        — handshake failed or was declined
//   ?error=provider_unavailable&provider=steam — that provider has no credentials
//                                                configured on this deployment
// Anything else is an error we did not send, so it gets the generic line rather
// than being echoed back into the page.
export const describeAuthError = (searchParams) => {
  const code = searchParams?.get('error');
  if (!code) return null;

  if (code === 'provider_unavailable') {
    const provider = searchParams.get('provider');
    const name = PROVIDER_LABELS[provider] || 'That provider';
    return `${name} sign-in is temporarily unavailable. Please use another method or sign in with your email.`;
  }
  if (code === 'oauth_failed') {
    return 'We could not complete that sign-in. Please try again, or sign in with your email.';
  }
  return 'Sign-in failed. Please try again.';
};
