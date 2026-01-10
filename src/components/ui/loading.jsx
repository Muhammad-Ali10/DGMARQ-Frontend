import { Skeleton } from './skeleton';
import { Spinner } from './spinner';
import { Alert, AlertDescription } from './alert';

export const Loading = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center h-64 gap-4 ${className}`}>
      <Spinner className="size-8" />
      {message && <div className="text-muted-foreground">{message}</div>}
    </div>
  );
};

export const ErrorMessage = ({ message = 'An error occurred', className = '' }) => {
  return (
    <div className={`flex items-center justify-center h-64 ${className}`}>
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
};

export { Skeleton, Spinner };
