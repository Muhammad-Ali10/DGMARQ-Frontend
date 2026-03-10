import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MessageSquare, Send, Loader2, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Refund-specific internal chat.
 * - Customer and Admin can always send.
 * - Seller can only send when refund.adminRequestedSellerInput is true (pass canSend accordingly).
 */
export default function RefundChat({ refundId, canSend }) {
  const queryClient = useQueryClient();
  const [localMessage, setLocalMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const selectedImagesRef = useRef([]);
  const fileInputRef = useRef(null);
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const { socket, isConnected } = useSocket();

  const { data, isLoading } = useQuery({
    queryKey: ['refund-messages', refundId],
    queryFn: () =>
      returnRefundAPI
        .getRefundMessages(refundId)
        .then((res) => res.data.data?.messages || []),
    enabled: !!refundId,
  });

  const addMessageMutation = useMutation({
    mutationFn: (payload) => returnRefundAPI.addRefundMessage(refundId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['refund-messages', refundId]);
      queryClient.invalidateQueries(['admin-refunds']);
      queryClient.invalidateQueries(['seller-refunds']);
      queryClient.invalidateQueries(['user-refunds']);
      setLocalMessage('');
      setSelectedImages((prev) => {
        prev.forEach((item) => URL.revokeObjectURL(item.preview));
        return [];
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send message'),
  });

  const messages = Array.isArray(data) ? data : [];

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket || !refundId) return;

    const handleRefundMessage = (payload) => {
      if (!payload || !payload.refundId) return;
      const incomingId = payload.refundId.toString();
      const currentId = refundId.toString();
      if (incomingId !== currentId) return;

      // Re-fetch messages for this refund so both sides see updates instantly
      queryClient.invalidateQueries(['refund-messages', refundId]);
    };

    socket.on('refund_message', handleRefundMessage);

    return () => {
      socket.off('refund_message', handleRefundMessage);
    };
  }, [socket, isConnected, refundId, queryClient]);

  function handleFileChange(event) {
    const incoming = Array.from(event.target.files || []);
    if (incoming.length === 0) return;

    const next = [...selectedImages];
    for (const file of incoming) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are allowed');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is larger than 5MB`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        toast.error(`You can attach up to ${MAX_FILES} images`);
        break;
      }
      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setSelectedImages(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(imageId) {
    setSelectedImages((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.id !== imageId);
    });
  }

  function handleSend(e) {
    e?.preventDefault();
    const msg = (localMessage || '').trim();
    if ((!msg && selectedImages.length === 0) || !canSend) return;

    if (selectedImages.length > 0) {
      const formData = new FormData();
      if (msg) formData.append('message', msg);
      selectedImages.forEach((item) => formData.append('images', item.file));
      addMessageMutation.mutate(formData);
      return;
    }

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
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {messages.map((m) => (
            <li key={m._id} className="text-sm">
              <span className="text-gray-500 font-medium capitalize">{m.senderRole}:</span>{' '}
              {!!m.message && <span className="text-white">{m.message}</span>}
              {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md">
                  {m.attachments.map((attachment, idx) => (
                    <a
                      key={`${m._id}-attachment-${idx}`}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded border border-gray-600 overflow-hidden hover:border-accent"
                    >
                      <img
                        src={attachment.url}
                        alt={`Refund chat attachment ${idx + 1}`}
                        className="w-full h-24 object-cover"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              )}
              <span className="text-gray-500 text-xs ml-2">
                {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canSend && (
        <form onSubmit={handleSend} className="space-y-2">
          <Textarea
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="w-full bg-primary border-gray-700 text-white placeholder:text-gray-500 resize-none"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedImages.map((item) => (
                <div key={item.id} className="relative rounded border border-gray-600 overflow-hidden">
                  <img src={item.preview} alt={item.file.name} className="w-full h-24 object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                    onClick={() => removeImage(item.id)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={addMessageMutation.isPending || selectedImages.length >= MAX_FILES}
            >
              <ImagePlus className="w-4 h-4 mr-2" />
              Add images
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={addMessageMutation.isPending || (!localMessage.trim() && selectedImages.length === 0)}
              className="ml-auto bg-accent hover:bg-accent/90"
            >
              {addMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500">JPG, PNG, WebP up to 5MB each (max {MAX_FILES}).</p>
        </form>
      )}
      {!canSend && (
        <p className="text-xs text-gray-500">You can only reply when admin requests your input.</p>
      )}
    </div>
  );
}

