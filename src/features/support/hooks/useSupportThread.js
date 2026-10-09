import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supportAPI } from '@services/api';
import { useSocket } from '@hooks/useSocket';
import { genClientId, isMineForSide } from '../utils/supportChat';

const PAGE = 30;

export const useSupportThread = ({ chatId, side = 'customer', enabled = true, extraSendFields = null, onStatusChange = null }) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [otherTyping, setOtherTyping] = useState(false);

  const nextBeforeRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const extraRef = useRef(extraSendFields);
  extraRef.current = extraSendFields;
  const statusChangeRef = useRef(onStatusChange);
  statusChangeRef.current = onStatusChange;
  const lastTypingEmitRef = useRef(0);
  const typingClearRef = useRef(null);

  const sideKey = side === 'admin' ? 'admin' : 'customer';

  const optimisticSenderType = side === 'admin' ? 'admin' : 'user';

  useEffect(() => {
    if (!chatId || !enabled) {
      setMessages([]);
      return undefined;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setMessages([]);
    nextBeforeRef.current = null;
    supportAPI
      .getSupportMessages(chatId, { limit: PAGE })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data || {};
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setHasMore(!!data.hasMore);
        nextBeforeRef.current = data.nextBefore || null;
        if (side !== 'admin') queryClient.invalidateQueries({ queryKey: ['support-unread-total'] });
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chatId, enabled, side, queryClient]);

  const loadOlder = useCallback(async () => {
    if (!chatId || !hasMore || loadingOlderRef.current || !nextBeforeRef.current) return 0;
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);
    try {
      const res = await supportAPI.getSupportMessages(chatId, {
        before: nextBeforeRef.current,
        limit: PAGE,
      });
      const data = res?.data?.data || {};
      const older = Array.isArray(data.messages) ? data.messages : [];
      if (older.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m._id).filter(Boolean));
          const fresh = older.filter((m) => !seen.has(m._id));
          return [...fresh, ...prev];
        });
      }
      setHasMore(!!data.hasMore);
      nextBeforeRef.current = data.nextBefore || null;
      return older.length;
    } catch {
      return 0;
    } finally {
      loadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }, [chatId, hasMore]);

  const mergeIncoming = useCallback((prev, incoming) => {
    if (incoming.clientId) {
      const idx = prev.findIndex((m) => m.clientId && m.clientId === incoming.clientId);
      if (idx !== -1) {
        const copy = prev.slice();
        copy[idx] = { ...incoming, __status: undefined };
        return copy;
      }
    }
    if (incoming._id && prev.some((m) => m._id === incoming._id)) return prev;
    return [...prev, { ...incoming, __status: undefined }];
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !chatId || !enabled) return undefined;
    socket.emit('join_support_chat', chatId);

    const onMessage = (incoming) => {
      if (!incoming || incoming.supportChatId?.toString() !== chatId.toString()) return;
      setMessages((prev) => mergeIncoming(prev, incoming));
      if (!isMineForSide(incoming, sideKey)) socket.emit('mark_support_read', chatId);
    };

    const onRead = (payload) => {
      if (!payload || payload.chatId?.toString() !== chatId.toString()) return;
      const readerIsAdmin = payload.isAdmin ?? payload.by === 'admin';
      if (readerIsAdmin === (sideKey === 'admin')) return;
      setMessages((prev) =>
        prev.map((m) => (isMineForSide(m, sideKey) && !m.isRead ? { ...m, isRead: true } : m))
      );
    };

    const onTyping = (payload) => {
      setOtherTyping(!!payload?.isTyping);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setOtherTyping(false), 3000);
    };

    const onStatus = (payload) => {
      if (payload?.chatId?.toString() !== chatId.toString()) return;
      statusChangeRef.current?.(payload.status);
    };

    socket.on('support_message', onMessage);
    socket.on('support_messages_read', onRead);
    socket.on('support_user_typing', onTyping);
    socket.on('support_status_changed', onStatus);
    return () => {
      socket.off('support_message', onMessage);
      socket.off('support_messages_read', onRead);
      socket.off('support_user_typing', onTyping);
      socket.off('support_status_changed', onStatus);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      if (socket.connected) socket.emit('leave_support_chat', chatId);
    };
  }, [socket, isConnected, chatId, enabled, mergeIncoming, sideKey]);

  const refreshLatest = useCallback(async () => {
    if (!chatId) return;
    try {
      const res = await supportAPI.getSupportMessages(chatId, { limit: PAGE });
      const data = res?.data?.data || {};
      const latest = Array.isArray(data.messages) ? data.messages : [];
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m._id).filter(Boolean));
        const missing = latest.filter((m) => m._id && !known.has(m._id));
        if (!missing.length) return prev;
        const merged = [...prev, ...missing];
        merged.sort((a, b) => new Date(a.sentAt || a.createdAt) - new Date(b.sentAt || b.createdAt));
        return merged;
      });
    } catch {
      /* best-effort recovery */
    }
  }, [chatId]);

  const prevConnectedRef = useRef(isConnected);
  useEffect(() => {
    if (enabled && chatId && isConnected && !prevConnectedRef.current) {
      refreshLatest();
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, enabled, chatId, refreshLatest]);

  const notifyTyping = useCallback(() => {
    if (!socket || !isConnected || !chatId) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 2000) return;
    lastTypingEmitRef.current = now;
    socket.emit('support_typing', { chatId, isTyping: true });
  }, [socket, isConnected, chatId]);

  const reconcile = useCallback((clientId, saved) => {
    setMessages((prev) => {
      const savedId = saved?._id;
      const alreadyReal = savedId && prev.some((m) => m._id === savedId && m.clientId !== clientId);
      const idx = prev.findIndex((m) => m.clientId === clientId);
      if (idx === -1) return prev;
      if (alreadyReal) return prev.filter((m) => m.clientId !== clientId);
      const copy = prev.slice();
      copy[idx] = { ...saved, __status: undefined };
      return copy;
    });
  }, []);

  const markFailed = useCallback((clientId) => {
    setMessages((prev) =>
      prev.map((m) => (m.clientId === clientId ? { ...m, __status: 'failed' } : m))
    );
  }, []);

  const sendText = useCallback(
    (text, opts = {}) => {
      const messageText = (text || '').trim();
      if (!messageText || !chatId) return;
      const internal = !!opts.internal;
      const clientId = genClientId();
      const temp = {
        _id: clientId,
        clientId,
        __status: 'sending',
        supportChatId: chatId,
        senderType: optimisticSenderType,
        messageText,
        messageType: 'text',
        isInternal: internal,
        isRead: false,
        sentAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, temp]);
      supportAPI
        .sendSupportMessage(chatId, {
          messageText,
          clientId,
          ...(internal ? { isInternal: true } : {}),
          ...(extraRef.current || {}),
        })
        .then((res) => reconcile(clientId, res?.data?.data))
        .catch(() => markFailed(clientId));
    },
    [chatId, optimisticSenderType, reconcile, markFailed]
  );

  const sendImage = useCallback(
    (file, caption = '', opts = {}) => {
      if (!file || !chatId) return;
      const internal = !!opts.internal;
      const clientId = genClientId();
      const preview = URL.createObjectURL(file);
      const temp = {
        _id: clientId,
        clientId,
        __status: 'sending',
        __file: file,
        __caption: caption,
        supportChatId: chatId,
        senderType: optimisticSenderType,
        messageText: caption || 'Image',
        messageType: 'image',
        attachment: preview,
        isInternal: internal,
        isRead: false,
        sentAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, temp]);
      const formData = new FormData();
      formData.append('image', file);
      if (caption) formData.append('messageText', caption);
      formData.append('clientId', clientId);
      if (internal) formData.append('isInternal', 'true');
      if (extraRef.current) {
        Object.entries(extraRef.current).forEach(([k, v]) => v != null && formData.append(k, v));
      }
      supportAPI
        .sendSupportImageMessage(chatId, formData)
        .then((res) => {
          URL.revokeObjectURL(preview);
          reconcile(clientId, res?.data?.data);
        })
        .catch(() => {
          URL.revokeObjectURL(preview);
          markFailed(clientId);
        });
    },
    [chatId, optimisticSenderType, reconcile, markFailed]
  );

  const retry = useCallback(
    (msg) => {
      if (!msg?.clientId) return;
      setMessages((prev) => prev.filter((m) => m.clientId !== msg.clientId));
      const opts = { internal: !!msg.isInternal };
      if (msg.messageType === 'image' && msg.__file) sendImage(msg.__file, msg.__caption || '', opts);
      else sendText(msg.messageText, opts);
    },
    [sendText, sendImage]
  );

  return {
    messages,
    isLoading,
    isLoadingOlder,
    hasMore,
    error,
    otherTyping,
    connected: isConnected,
    loadOlder,
    sendText,
    sendImage,
    retry,
    notifyTyping,
  };
};
