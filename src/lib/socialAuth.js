import { API_ORIGIN } from '@lib/config';

export const SOCIAL_PROVIDER_IDS = ['google', 'facebook', 'discord', 'steam', 'paypal'];

export const startSocialAuth = (providerId) => {
  window.location.href = `${API_ORIGIN}/api/v1/user/auth/${providerId}`;
};

export const PROVIDER_LABELS = {
  google: 'Google',
  facebook: 'Facebook',
  discord: 'Discord',
  steam: 'Steam',
  paypal: 'PayPal',
};

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
  if (code === 'account_suspended') {
    return 'This account has been suspended. Please contact support.';
  }
  if (code === 'email_unverified') {
    const name = PROVIDER_LABELS[searchParams.get('provider')] || 'That provider';
    return `Your ${name} email is not verified, so it cannot sign in to an existing account. Sign in with your password, then link ${name} from your profile.`;
  }
  return 'Sign-in failed. Please try again.';
};

export const describeLinkResult = (searchParams) => {
  const linked = searchParams?.get('linked');
  if (linked) {
    return { ok: true, message: `${PROVIDER_LABELS[linked] || 'Provider'} account linked` };
  }
  const code = searchParams?.get('link_error');
  if (!code) return null;
  const name = PROVIDER_LABELS[searchParams.get('provider')] || 'That provider';
  if (code === 'provider_taken') {
    return { ok: false, message: `That ${name} account is already connected to another DG-Marq account.` };
  }
  return { ok: false, message: `We could not link ${name}. Please try again.` };
};
