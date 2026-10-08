import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@components/ui/button';
import AuthDivider from '@components/common/AuthDivider';
import SocialAuthButtons from '@components/common/SocialAuthButtons';
import { cn } from '@lib/utils';

const RegisterPanel = ({ onNavigate, className }) => (
  <div className={cn('hud-corners hud-corners-lit [--hud-inset:8px]', className)}>
    <h3 className="text-center text-[17px] font-bold tracking-[0.2px] text-fg">
      Create your account
    </h3>
    <p className="mt-1 mb-4 text-center text-xs text-fg-subtle">Join DGMARQ in seconds</p>

    <SocialAuthButtons
      layout="list"
      labelPrefix="Sign up with"
      onNavigate={onNavigate}
      trailing={<AuthDivider className="my-4">or</AuthDivider>}
    />

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
