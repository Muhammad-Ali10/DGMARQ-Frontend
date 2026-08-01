import { AlertTriangle, RefreshCw, WifiOff, LockKeyhole, SearchX, Timer, ServerCrash } from 'lucide-react';
import { Button } from '@components/ui/button';
import { cn } from '@lib/utils';

/**
 * The error surface for every data view.
 *
 * The rule this exists to enforce: never show a bare code or a bare string like
 * "Error loading seller dashboard". Say what failed, why if we know it, and give
 * the user a next step. A raw status number may appear as secondary detail, but
 * it is never the message.
 *
 * `describeError` maps an axios error onto plain language. It is exported so
 * inline surfaces (a failed cell, a toast) can reuse the same wording rather
 * than inventing their own.
 */
export const describeError = (error, fallbackTitle = 'Something went wrong') => {
  // No response at all — the request never reached the server.
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

  if (status === 401 || status === 403) {
    return {
      title: 'Your session has expired',
      description: 'Sign in again to continue where you left off.',
      Icon: LockKeyhole,
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

/**
 * @param {Error} [error] - the axios/query error; drives the plain-language copy
 * @param {string} [title] - override the derived title
 * @param {string} [description] - override the derived body
 * @param {() => void} [onRetry] - renders a retry button when provided
 * @param {boolean} [compact] - tighter padding for in-card use
 */
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
