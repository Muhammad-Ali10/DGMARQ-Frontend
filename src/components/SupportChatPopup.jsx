import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { supportAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Loading } from './ui/loading';
import { Send, X, Headphones, Plus, ImagePlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import SafeImage from './ui/safe-image';

const SupportChatPopup = ({ isOpen, onClose, onUnreadCountChange }) => {
  const ensureArray = (value, key) => {
    if (Array.isArray(value)) return value;
    if (key && Array.isArray(value?.[key])) return value[key];
    return [];
  };

  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);

  // Fetch user's support chats
  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['user-support-chats-popup'],
    queryFn: () => supportAPI.getMySupportChats().then(res => res.data.data),
    enabled: isOpen,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Fetch messages for selected chat
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['support-messages-popup', selectedChat],
    queryFn: () => supportAPI.getSupportMessages(selectedChat).then(res => res.data.data),
    enabled: !!selectedChat && isOpen,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const chatsList = ensureArray(chats, 'chats');
  const messages = ensureArray(messagesData, 'messages');

  // Auto-select first chat if available
  useEffect(() => {
    if (chatsList.length > 0 && !selectedChat) {
      const openChat = chatsList.find(c => c.status === 'open') || chatsList[0];
      setSelectedChat(openChat._id);
    }
  }, [chatsList, selectedChat]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !selectedChat) return;

    // Join support chat room when connected
    const joinChat = () => {
      if (socket.connected) {
        socket.emit('join_support_chat', selectedChat);
      }
    };

    // Join immediately if already connected, otherwise wait for connection
    if (isConnected) {
      joinChat();
    }

    // Listen for new messages — append directly instead of refetching
    const handleNewMessage = (incomingMsg) => {
      if (incomingMsg.supportChatId?.toString() === selectedChat) {
        queryClient.setQueryData(['support-messages-popup', selectedChat], (old) => {
          if (!old?.messages) return old;
          // Deduplicate
          if (incomingMsg._id && old.messages.some((m) => m._id === incomingMsg._id)) return old;
          return { ...old, messages: [...old.messages, incomingMsg] };
        });
        // Update chat list lastMessage in-place
        queryClient.setQueryData(['user-support-chats-popup'], (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((chat) =>
            chat._id === selectedChat
              ? { ...chat, lastMessageAt: incomingMsg.sentAt || new Date().toISOString() }
              : chat
          );
        });
      }
    };

    // Listen for errors
    const handleError = (error) => {
    };

    // Handle connection
    const handleConnect = () => {
      joinChat();
    };

    socket.on('support_message', handleNewMessage);
    socket.on('error', handleError);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('support_message', handleNewMessage);
      socket.off('error', handleError);
      socket.off('connect', handleConnect);
      if (selectedChat && socket.connected) {
        socket.emit('leave_support_chat', selectedChat);
      }
    };
  }, [socket, isConnected, selectedChat, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Calculate unread count
  useEffect(() => {
    if (chatsList.length && onUnreadCountChange) {
      const unread = chatsList.reduce((total, chat) => {
        return total + (chat.unreadCountUser || 0);
      }, 0);
      onUnreadCountChange(unread);
    }
  }, [chatsList, onUnreadCountChange]);

  const createChatMutation = useMutation({
    mutationFn: (data) => supportAPI.createSupportChat(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['user-support-chats-popup']);
      const newChat = response.data?.data?.chat;
      if (newChat?._id) {
        setSelectedChat(newChat._id);
      }
      setDialogOpen(false);
      setSubject('');
      setInitialMessage('');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, data }) => supportAPI.sendSupportMessage(chatId, data),
    onSuccess: (response) => {
      setMessage('');
      const sent = response?.data?.data;
      if (sent && selectedChat) {
        queryClient.setQueryData(['support-messages-popup', selectedChat], (old) => {
          if (!old?.messages) return old;
          if (sent._id && old.messages.some((m) => m._id === sent._id)) return old;
          return { ...old, messages: [...old.messages, sent] };
        });
      }
    },
  });

  const sendImageMutation = useMutation({
    mutationFn: ({ chatId, formData }) => supportAPI.sendSupportImageMessage(chatId, formData),
    onSuccess: (response, { preview }) => {
      if (preview) URL.revokeObjectURL(preview);
      setUploadingImage(null);
      const sent = response?.data?.data;
      if (sent && selectedChat) {
        queryClient.setQueryData(['support-messages-popup', selectedChat], (old) => {
          if (!old?.messages) return old;
          if (sent._id && old.messages.some((m) => m._id === sent._id)) return old;
          return { ...old, messages: [...old.messages, sent] };
        });
      }
    },
    onError: (_err, { preview }) => {
      if (preview) URL.revokeObjectURL(preview);
      setUploadingImage(null);
    },
  });

  const handleCreateChat = (e) => {
    e.preventDefault();
    createChatMutation.mutate({
      subject: subject.trim(),
      initialMessage: initialMessage.trim(),
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const messageText = message.trim();

    // Use socket when available (instant delivery), fallback to HTTP
    if (socket && isConnected) {
      socket.emit('send_support_message', {
        chatId: selectedChat,
        messageText,
      });
      setMessage('');
    } else {
      sendMessageMutation.mutate({
        chatId: selectedChat,
        data: { messageText },
      });
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;
    const preview = URL.createObjectURL(file);
    setUploadingImage({ preview });
    const formData = new FormData();
    formData.append('image', file);
    if (message.trim()) formData.append('messageText', message.trim());
    sendImageMutation.mutate({ chatId: selectedChat, formData, preview });
    e.target.value = '';
  };

  const selectedChatData = chatsList.find((c) => c._id === selectedChat);

  const getStatusBadge = (status) => {
    const variants = {
      open: 'default',
      pending: 'secondary',
      closed: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[400px] bg-primary border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-accent" />
          <h3 className="text-white font-semibold">Support Chat</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Chat List / Messages */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-1/3 border-r border-gray-700 bg-gray-900 overflow-y-auto">
          <div className="p-2">
            <Button
              size="sm"
              className="w-full mb-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          {chatsLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
          ) : chatsList.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">No chats</div>
          ) : (
            <div className="space-y-1 p-2">
              {chatsList.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat._id)}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedChat === chat._id
                      ? 'bg-accent text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                    <span className="text-xs font-medium truncate min-w-0">
                      {chat.subject || 'No subject'}
                    </span>
                    {chat.unreadCountUser > 0 && (
                      <span className="shrink-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {chat.unreadCountUser > 9 ? '9+' : chat.unreadCountUser}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{getStatusBadge(chat.status)}</span>
                    <span className="text-xs opacity-70 truncate min-w-0">
                      {new Date(chat.lastMessageAt || chat.updatedAt).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-2 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium text-sm">
                      {selectedChatData?.subject || 'Support Chat'}
                    </h4>
                    <p className="text-gray-400 text-xs">
                      {selectedChatData?.status === 'open' ? 'Open' : 'Closed'}
                    </p>
                  </div>
                  {getStatusBadge(selectedChatData?.status)}
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messagesLoading ? (
                  <Loading message="Loading messages..." />
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.senderType === 'user';
                    const isImage = msg.messageType === 'image' || msg.attachment;
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-2 ${
                            isUser
                              ? 'bg-accent text-white'
                              : 'bg-gray-800 text-gray-200'
                          }`}
                        >
                          {isImage && msg.attachment ? (
                            <a
                              href={msg.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded overflow-hidden max-w-full"
                            >
                              <SafeImage
                                src={msg.attachment}
                                alt={msg.messageText || 'Attachment'}
                                className="max-h-40 w-auto object-contain rounded"
                              />
                            </a>
                          ) : null}
                          {msg.messageText && (msg.messageText !== 'Image' || !isImage) && (
                            <p className="text-sm">{msg.messageText}</p>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.sentAt || msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {uploadingImage && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg p-2 bg-accent text-white relative">
                      <div className="relative inline-block">
                        <SafeImage
                          src={uploadingImage.preview}
                          alt="Uploading"
                          className="max-h-32 w-auto object-contain rounded opacity-80"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded">
                          <Loader2 className="h-6 w-6 animate-spin text-white mb-1" />
                          <span className="text-xs font-medium">Uploading...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {selectedChatData?.status !== 'closed' && (
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-700 bg-gray-800"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={sendImageMutation.isPending}
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach image"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="bg-gray-900 border-gray-700 text-white flex-1"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={sendMessageMutation.isPending || !message.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Headphones className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a chat or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create New Chat Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="md" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new support ticket to get help
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChat} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-gray-300">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What do you need help with?"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-300">Message</Label>
              <Textarea
                id="message"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Describe your issue..."
                required
                rows={4}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createChatMutation.isPending || !subject.trim() || !initialMessage.trim()}
              >
                {createChatMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportChatPopup;

