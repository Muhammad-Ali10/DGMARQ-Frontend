import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { RefreshCw } from 'lucide-react';

// The typed reason lives in here, inside DialogContent, which unmounts when the
// dialog closes. So every open starts empty — however the caller closed it —
// without an effect resetting state.
const ReasonForm = ({
  title,
  description,
  label,
  placeholder,
  confirmText,
  pendingText,
  icon: Icon,
  pending,
  maxLength,
  onCancel,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-white text-xl font-semibold">{title}</DialogTitle>
        {description && <DialogDescription className="text-gray-400">{description}</DialogDescription>}
      </DialogHeader>
      <div className="space-y-4 mt-2">
        <div className="space-y-2">
          <Label htmlFor="reason-dialog-input" className="text-gray-300">{label} *</Label>
          <Textarea
            id="reason-dialog-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className="bg-secondary border-gray-700 text-white min-h-[100px]"
          />
          <p className="text-xs text-gray-500 text-right">{reason.length}/{maxLength}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" className="border-gray-700" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="hover:bg-red-700"
            disabled={!trimmed || pending}
            onClick={() => onConfirm(trimmed)}
          >
            {pending ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />{pendingText}</>
            ) : (
              <>{Icon && <Icon className="w-4 h-4 mr-2" />}{confirmText}</>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

/**
 * A confirmation that cannot be given without a written reason — for moderation
 * actions whose reason is sent to someone else (rejecting or removing a
 * seller's offer). ConfirmationModal covers the reason-less case.
 *
 * It stays open while `pending`: the caller closes it on success, and a failed
 * request leaves the typed reason in place to retry.
 */
export const ReasonDialog = ({
  open,
  onOpenChange,
  label = 'Reason',
  confirmText = 'Confirm',
  pendingText = 'Working…',
  pending = false,
  maxLength = 1000,
  ...formProps
}) => (
  <Dialog
    open={open}
    onOpenChange={(next) => {
      if (!pending) onOpenChange(next); // never drop a request in flight
    }}
  >
    <DialogContent>
      <ReasonForm
        {...formProps}
        label={label}
        confirmText={confirmText}
        pendingText={pendingText}
        pending={pending}
        maxLength={maxLength}
        onCancel={() => onOpenChange(false)}
      />
    </DialogContent>
  </Dialog>
);

export default ReasonDialog;
