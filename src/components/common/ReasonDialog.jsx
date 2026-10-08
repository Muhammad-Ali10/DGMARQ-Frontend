import { useState } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { RefreshCw } from 'lucide-react';

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
      <DialogBody className="space-y-2">
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
      </DialogBody>
      <DialogFooter className="sm:justify-end">
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
      </DialogFooter>
    </>
  );
};

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
      if (!pending) onOpenChange(next);
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
