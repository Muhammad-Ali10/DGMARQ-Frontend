import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportAPI } from '../../services/api';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Headphones, Send, Plus, ImagePlus, Loader2 } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';
import { useSocket } from '../../hooks/useSocket';
import { useSelector } from 'react-redux';
import SafeImage from '../../components/ui/safe-image';

const SellerSupport = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedChatRef = useRef(selectedChat);
  selectedChatRef.current = selectedChat;
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state) => state.auth);

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['seller-support-chats'],
    queryFn: () => supportAPI.getMySupportChats().then(res => res.data.data),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['support-messages', selectedChat],
    queryFn: () => supportAPI.getSupportMessages(selectedChat).then(res => res.data.data),
    enabled: !!selectedChat,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Socket: join/leave support chat room
  useEffect(() => {
    if (!socket || !selectedChat) return;
    const joinRoom = () => socket.emit('join_support_chat', selectedChat);
    joinRoom();
    socket.on('connect', joinRoom);
    return () => {
      socket.off('connect', joinRoom);
      if (socket.connected) socket.emit('leave_support_chat', selectedChat);
    };
  }, [socket, selectedChat]);

  // Socket: listen for incoming support messages (always-on)
  useEffect(() => {
    if (!socket) return;
    const handleSupportMessage = (msg) => {
      if (!msg) return;
      const currentChat = selectedChatRef.current;
      const chatId = msg.chatId?.toString() || msg.supportChatId?.toString();
      // Update messages if this chat is currently open
      if (currentChat && chatId === currentChat.toString()) {
        queryClient.setQueryData(['support-messages', currentChat], (old) => {
          if (!Array.isArray(old)) return old;
          if (old.some(m => m._id?.toString() === msg._id?.toString())) return old;
          return [...old, msg];
        });
      }
      // Update chat list sidebar
      queryClient.setQueryData(['seller-support-chats'], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((c) =>
          c._id?.toString() === chatId
            ? { ...c, lastMessage: msg.messageText || c.lastMessage, updatedAt: msg.sentAt || msg.createdAt || new Date().toISOString() }
            : c
        );
      });
    };
    socket.on('support_message', handleSupportMessage);
    return () => { socket.off('support_message', handleSupportMessage); };
  }, [socket, queryClient]);

  const createChatMutation = useMutation({
    mutationFn: (data) => supportAPI.createSupportChat(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-support-chats']);
      setDialogOpen(false);
      setSubject('');
      setInitialMessage('');
      showSuccess('Support ticket created successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to create support ticket');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, data }) => supportAPI.sendSupportMessage(chatId, data),
    onSuccess: (response) => {
      const sentMessage = response?.data?.data;
      if (sentMessage && selectedChat) {
        queryClient.setQueryData(['support-messages', selectedChat], (old) => {
          if (!Array.isArray(old)) return old;
          if (old.some(m => m._id?.toString() === sentMessage._id?.toString())) return old;
          return [...old, sentMessage];
        });
      }
      setMessage('');
    },
    onError: (error) => {
      showApiError(error, 'Failed to send message');
    },
  });

  const sendImageMutation = useMutation({
    mutationFn: ({ chatId, formData }) => supportAPI.sendSupportImageMessage(chatId, formData),
    onSuccess: (response, { preview }) => {
      if (preview) URL.revokeObjectURL(preview);
      setUploadingImage(null);
      const sentMessage = response?.data?.data;
      if (sentMessage && selectedChat) {
        queryClient.setQueryData(['support-messages', selectedChat], (old) => {
          if (!Array.isArray(old)) return old;
          if (old.some(m => m._id?.toString() === sentMessage._id?.toString())) return old;
          return [...old, sentMessage];
        });
      }
    },
    onError: (error, { preview }) => {
      if (preview) URL.revokeObjectURL(preview);
      setUploadingImage(null);
      showApiError(error, 'Failed to upload image');
    },
  });

  const closeChatMutation = useMutation({
    mutationFn: (chatId) => supportAPI.closeSupportChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-support-chats']);
      queryClient.invalidateQueries(['support-messages', selectedChat]);
      showSuccess('Support ticket closed successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to close support ticket');
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

    // Socket-first, HTTP fallback
    if (socket && isConnected) {
      socket.emit('send_support_message', { chatId: selectedChat, messageText });
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

  if (chatsLoading) return <Loading message="Loading support chats..." />;

  const selectedChatData = chats?.find((c) => c._id === selectedChat);

  const getStatusBadge = (status) => {
    const variants = {
      open: 'success',
      pending: 'warning',
      closed: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Support</h1>
          <p className="text-gray-400 mt-1">Get help from our support team</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Support Chats List */}
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-full">
            {chats?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No support tickets</div>
            ) : (
              <div className="space-y-2">
                {chats?.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => setSelectedChat(chat._id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChat === chat._id
                        ? 'bg-accent'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium truncate">{chat.subject || 'No subject'}</span>
                      {getStatusBadge(chat.status)}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-2 bg-primary border-gray-700 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">
              {selectedChatData ? selectedChatData.subject || 'Support Chat' : 'Select a ticket'}
            </CardTitle>
            {selectedChatData && selectedChatData.status === 'open' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                    closeChatMutation.mutate(selectedChat);
                }}
              >
                Close Ticket
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {selectedChat ? (
              <>
                {messagesLoading ? (
                  <Loading message="Loading messages..." />
                ) : (
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {messages?.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">No messages yet</div>
                    ) : (
                      messages?.map((msg) => {
                        const isUser = msg.senderType === 'user';
                        const isImage = msg.messageType === 'image' || msg.attachment;
                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                isUser
                                  ? 'bg-accent text-white'
                                  : 'bg-gray-800 text-white'
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
                                    className="max-h-64 w-auto object-contain rounded"
                                  />
                                </a>
                              ) : null}
                              {msg.messageText && (msg.messageText !== 'Image' || !isImage) && (
                                <p>{msg.messageText}</p>
                              )}
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.sentAt || msg.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {uploadingImage && (
                      <div className="flex justify-end">
                        <div className="max-w-[70%] rounded-lg p-3 bg-accent text-white relative">
                          <div className="relative inline-block">
                            <SafeImage
                              src={uploadingImage.preview}
                              alt="Uploading"
                              className="max-h-48 w-auto object-contain rounded opacity-80"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded">
                              <Loader2 className="h-8 w-8 animate-spin text-white mb-1" />
                              <span className="text-xs font-medium">Uploading...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {selectedChatData?.status !== 'closed' && (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
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
                      className="bg-gray-800 border-gray-700 text-white flex-1"
                    />
                    <Button type="submit" disabled={sendMessageMutation.isPending || !message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Headphones className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a support ticket to view messages</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create New Ticket Dialog */}
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
                rows={5}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createChatMutation.isPending || !subject.trim() || !initialMessage.trim()}>
                {createChatMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerSupport;
