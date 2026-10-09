import { AlertTriangle, RefreshCw, WifiOff, LockKeyhole, ShieldX, SearchX, Timer, ServerCrash } from 'lucide-react';
import { Button } from '@components/ui/button';
import { cn } from '@lib/utils';

export const describeError = (error, fallbackTitle = 'Something went wrong') => {
  if (error && !error.response) {
    return {
      title: "Can't reach DGMARQ",
      description:
        'Your device appears to be offline, or the connection dropped. Check your internet and try again.',
      Icon: WifiOff,
      canRetry: true,
    };
  }

  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (status === 401) {
    return {
      title: 'Your session has expired',
      description: 'Sign in again to continue where you left off.',
      Icon: LockKeyhole,
      canRetry: false,
    };
  }
  if (status === 403) {
    return {
      title: "You don't have access to this",
      description: serverMessage || 'Your account is not allowed to view or change this.',
      Icon: ShieldX,
      canRetry: false,
    };
  }
  if (status === 404) {
    return {
      title: "We couldn't find that",
      description:
        serverMessage || 'It may have been removed, or the link you followed is out of date.',
      Icon: SearchX,
      canRetry: false,
    };
  }
  if (status === 429) {
    return {
      title: 'Too many requests',
      description: 'You have been rate-limited. Wait about a minute, then try again.',
      Icon: Timer,
      canRetry: true,
    };
  }
  if (status >= 500) {
    return {
      title: 'Our server had a problem',
      description:
        'This one is on us, not you. Nothing you did caused it — try again in a moment.',
      Icon: ServerCrash,
      canRetry: true,
    };
  }

  return {
    title: fallbackTitle,
    description:
      serverMessage || 'We could not load this right now. Trying again usually clears it.',
    Icon: AlertTriangle,
    canRetry: true,
  };
};

export const ErrorState = ({
  error,
  title,
  description,
  onRetry,
  compact = false,
  className,
  children,
}) => {
  const derived = describeError(error, title);
  const Icon = derived.Icon;
  const showRetry = Boolean(onRetry) && derived.canRetry;

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'py-8' : 'py-12',
        className
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-danger/35 bg-danger-soft">
        <Icon aria-hidden="true" className="size-6 text-danger" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-fg">{title || derived.title}</h3>
      <p className="mb-4 max-w-md text-sm text-fg-muted">{description || derived.description}</p>
      {showRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      )}
      {children}
    </div>
  );
};

export default ErrorState;
