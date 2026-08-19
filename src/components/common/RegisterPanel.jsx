import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@components/ui/button';
import AuthDivider from '@components/common/AuthDivider';
import SocialAuthButtons from '@components/common/SocialAuthButtons';
import { cn } from '@lib/utils';

// The v74 mockup's "Create your account" popup (line 1298) — the panel the header
// Register button opens. Its own component because the header dropdown and the
// mobile bottom bar both show it, and because keeping ~60 lines of panel out of
// SessionMenu keeps that file about session state.
//
// It renders only the CONTENT: the anchoring, the portal, the open/close state and
// the escape/click-outside behaviour all belong to the Radix primitive wrapping
// it, not to a hand-rolled effect.
const RegisterPanel = ({ onNavigate, className }) => (
  <div className={cn('hud-corners hud-corners-lit [--hud-inset:8px]', className)}>
    <h3 className="text-center text-[17px] font-bold tracking-[0.2px] text-fg">
      Create your account
    </h3>
    <p className="mt-1 mb-4 text-center text-xs text-fg-subtle">Join DGMARQ in seconds</p>

    <SocialAuthButtons layout="list" labelPrefix="Sign up with" onNavigate={onNavigate} />

    <AuthDivider className="my-4">or</AuthDivider>

    {/* The mockup's blue->violet gradient CTA is already the primary Button
        variant (`btn-brand`, the header's DGMARQ Plus ramp), so this reuses it
        rather than restating the gradient — and inherits its measured 5.25:1
        text contrast and the hover lift. */}
    <Button asChild size="lg" className="w-full">
      <Link to="/register" onClick={() => onNavigate?.('email')}>
        <Mail className="size-[18px]" aria-hidden="true" />
        Sign up with email
      </Link>
    </Button>

    <p className="mt-4 mb-2 text-center text-[11px] leading-relaxed text-fg-subtle">
      By creating an account you agree to DGMARQ's{' '}
      <Link to="/terms" onClick={() => onNavigate?.('terms')} className="text-accent-on-dark hover:underline">
        Terms &amp; Conditions
      </Link>{' '}
      and{' '}
      <Link to="/privacy" onClick={() => onNavigate?.('privacy')} className="text-accent-on-dark hover:underline">
        Privacy Policy
      </Link>
      .
    </p>

    <p className="text-center text-[13px] text-fg-muted">
      Already have an account?{' '}
      <Link
        to="/login"
        onClick={() => onNavigate?.('login')}
        className="font-semibold text-accent-on-dark hover:underline"
      >
        Sign in
      </Link>
    </p>
  </div>
);

export default RegisterPanel;
