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

/**
 * Reusable confirmation modal component
 * Replaces window.confirm() calls throughout the app
 */
export const ConfirmationModal = ({
  open,
  onOpenChange,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default', // 'default' | 'destructive'
  onConfirm,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onOpenChange(false);
  };

  const isDestructive = variant === 'destructive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} size="sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDestructive ? 'bg-red-500/15' : 'bg-accent/15'}`}>
              {isDestructive
                ? <AlertTriangle className="w-5 h-5 text-red-400" />
                : <Info className="w-5 h-5 text-accent" />
              }
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/[0.08] text-gray-300 hover:bg-white/[0.06] hover:text-white order-2 sm:order-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={isDestructive ? 'destructive' : 'default'}
            className={`order-1 sm:order-2 ${!isDestructive ? 'bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20' : 'shadow-lg shadow-red-500/20'}`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
