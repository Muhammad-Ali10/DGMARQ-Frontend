import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * The confirmation dialog for anything consequential — replaces window.confirm()
 * across the app, and now also backs the key-reveal confirmation.
 *
 * The description carries real weight here: it is the last thing a user reads
 * before an irreversible action, so call sites should state what will actually
 * happen rather than "Are you sure?".
 *
 * Radix traps focus and restores it on close, and Escape cancels — both come
 * from the Dialog primitive, so every confirm gets them for free.
 */
export const ConfirmationModal = ({
  open,
  onOpenChange,
  title = 'Confirm action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default', // 'default' | 'destructive'
  onConfirm,
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onOpenChange(false);
  };

  const isDestructive = variant === 'destructive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} size="sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl border',
                isDestructive
                  ? 'border-danger/35 bg-danger-soft'
                  : 'border-accent-on-dark/35 bg-accent-soft'
              )}
            >
              {isDestructive ? (
                <AlertTriangle aria-hidden="true" className="size-5 text-danger" />
              ) : (
                <Info aria-hidden="true" className="size-5 text-accent-on-dark" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="order-2 sm:order-1">
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={isDestructive ? 'destructive' : 'default'}
            className="order-1 sm:order-2"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
