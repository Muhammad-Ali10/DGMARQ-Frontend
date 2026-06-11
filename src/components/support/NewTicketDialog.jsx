import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supportAPI, userAPI } from '../../services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { showSuccess, showApiError } from '../../utils/toast';
import { SUPPORT_CATEGORIES } from '../../utils/supportChat';

const ensureOrders = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data?.orders)) return data.data.orders;
  return [];
};

const orderLabel = (o) => {
  const id = o.orderNumber || o._id?.slice(-8)?.toUpperCase() || 'Order';
  const when = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '';
  const total = typeof o.totalAmount === 'number' ? ` · $${o.totalAmount.toFixed(2)}` : '';
  return `#${id}${total}${when ? ` · ${when}` : ''}`;
};

/**
 * Shared "create support ticket" dialog: subject (required), category, optional
 * related order (from the user's recent orders), and the first message.
 * `prefill` can pre-set { subject, category, orderId } e.g. when opened from an
 * order page.
 */
const NewTicketDialog = ({ open, onOpenChange, onCreated, prefill = null }) => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Other');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');

  // Apply prefill whenever the dialog opens (reset/seed the form fields).
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubject(prefill?.subject || '');
      setCategory(prefill?.category || 'Other');
      setOrderId(prefill?.orderId || '');
      setMessage(prefill?.message || '');
    }
  }, [open, prefill]);

  const { data: ordersData } = useQuery({
    queryKey: ['my-orders-for-support'],
    queryFn: () => userAPI.getMyOrders({ page: 1, limit: 10 }).then((r) => r.data.data),
    enabled: open,
    staleTime: 60000,
  });
  const orders = ensureOrders(ordersData);

  const createMutation = useMutation({
    mutationFn: (payload) => supportAPI.createSupportChat(payload),
    onSuccess: (response) => {
      const chatId = response?.data?.data?.chat?._id;
      showSuccess('Support ticket created successfully');
      onOpenChange(false);
      onCreated?.(chatId);
    },
    onError: (e) => showApiError(e, 'Failed to create support ticket'),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    createMutation.mutate({
      subject: subject.trim(),
      category,
      relatedOrderId: orderId || undefined,
      initialMessage: message.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="bg-primary border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
          <DialogDescription className="text-gray-400">Tell us what you need help with</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-gray-300">Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-md px-2 py-2"
              >
                {SUPPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Related order (optional)</Label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-md px-2 py-2"
              >
                <option value="">None</option>
                {orders.map((o) => <option key={o._id} value={o._id}>{orderLabel(o)}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue…"
              required
              rows={5}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !subject.trim() || !message.trim()}>
              {createMutation.isPending ? 'Creating…' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketDialog;
