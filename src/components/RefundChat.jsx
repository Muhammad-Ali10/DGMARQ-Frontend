import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '../services/api';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Refund-specific internal chat.
 * - Customer and Admin can always send.
 * - Seller can only send when refund.adminRequestedSellerInput is true (pass canSend accordingly).
 */
export default function RefundChat({ refundId, canSend }) {
  const queryClient = useQueryClient();
  const [localMessage, setLocalMessage] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['refund-messages', refundId],
    queryFn: () => returnRefundAPI.getRefundMessages(refundId).then((res) => res.data.data?.messages || []),
    enabled: !!refundId,
  });

  const addMessageMutation = useMutation({
    mutationFn: ({ message }) => returnRefundAPI.addRefundMessage(refundId, message),
    onSuccess: () => {
      queryClient.invalidateQueries(['refund-messages', refundId]);
      queryClient.invalidateQueries(['admin-refunds']);
      queryClient.invalidateQueries(['seller-refunds']);
      queryClient.invalidateQueries(['user-refunds']);
      setLocalMessage('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send message'),
  });

  const messages = Array.isArray(data) ? data : [];

  function handleSend(e) {
    e?.preventDefault();
    const msg = (localMessage || '').trim();
    if (!msg || !canSend) return;
    addMessageMutation.mutate({ message: msg });
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-secondary/50 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-accent" />
        <Label className="text-gray-300">Refund chat</Label>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No messages yet.</p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {messages.map((m) => (
            <li key={m._id} className="text-sm">
              <span className="text-gray-500 font-medium capitalize">{m.senderRole}:</span>{' '}
              <span className="text-white">{m.message}</span>
              <span className="text-gray-500 text-xs ml-2">
                {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canSend && (
        <form onSubmit={handleSend} className="flex gap-2">
          <Textarea
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="flex-1 bg-primary border-gray-700 text-white placeholder:text-gray-500 resize-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={addMessageMutation.isPending || !localMessage.trim()}
            className="self-end bg-accent hover:bg-accent/90"
          >
            {addMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      )}
      {!canSend && (
        <p className="text-xs text-gray-500">You can only reply when admin requests your input.</p>
      )}
    </div>
  );
}

