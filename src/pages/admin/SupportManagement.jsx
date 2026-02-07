import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, supportAPI } from '../../services/api';
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Headphones, MessageSquare, Clock, CheckCircle2, UserPlus, Send, X } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';

const SupportManagement = () => {
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { socket, isConnected } = useSocket();

  const assignMutation = useMutation({
    mutationFn: (chatId) => adminAPI.assignAdminToChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-support-chats']);
      queryClient.invalidateQueries(['admin-support-messages', selectedChat]);
      showSuccess('Chat assigned successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to assign chat');
    },
  });

  const closeChatMutation = useMutation({
    mutationFn: (chatId) => supportAPI.closeSupportChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-support-chats']);
      queryClient.invalidateQueries(['admin-support-messages', selectedChat]);
      queryClient.invalidateQueries(['support-stats']);
      showSuccess('Support ticket closed successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to close support ticket');
    },
  });

  const { data: chats, isLoading: isLoadingChats, isError: isErrorChats } = useQuery({
    queryKey: ['admin-support-chats'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAllSupportChats();
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats } = useQuery({
    queryKey: ['support-stats'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getSupportStats();
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  // Fetch messages for selected chat
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-support-messages', selectedChat],
    queryFn: () => supportAPI.getSupportMessages(selectedChat).then(res => res.data.data),
    enabled: !!selectedChat && chatDialogOpen,
  });

  const messages = messagesData?.messages || [];

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !selectedChat) return;

    // Join support chat room
    socket.emit('join_support_chat', selectedChat);

    // Join admin support room for notifications
    socket.emit('join_admin_support');

    // Listen for new messages
    const handleNewMessage = (message) => {
      if (message.supportChatId?.toString() === selectedChat) {
        queryClient.invalidateQueries(['admin-support-messages', selectedChat]);
        queryClient.invalidateQueries(['admin-support-chats']);
      }
    };

    // Listen for errors
    const handleError = (error) => {
    };

    socket.on('support_message', handleNewMessage);
    socket.on('error', handleError);

    return () => {
      socket.off('support_message', handleNewMessage);
      socket.off('error', handleError);
      if (selectedChat) {
        socket.emit('leave_support_chat', selectedChat);
      }
    };
  }, [socket, isConnected, selectedChat, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, data }) => supportAPI.sendSupportMessage(chatId, data),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries(['admin-support-messages', selectedChat]);
      queryClient.invalidateQueries(['admin-support-chats']);
    },
  });

  const handleViewChat = (chat) => {
    setSelectedChat(chat._id);
    setChatDialogOpen(true);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && selectedChat) {
      sendMessageMutation.mutate({
        chatId: selectedChat,
        data: { messageText: message.trim() },
      });
    }
  };

  const isLoading = isLoadingChats || isLoadingStats;
  const isError = isErrorChats || isErrorStats;

  if (isLoading) return <Loading message="Loading support data..." />;
  if (isError) return <ErrorMessage message="Error loading support data" />;

  const statsCards = [
    { title: 'Open Tickets', value: stats?.open || 0, icon: MessageSquare, color: 'text-blue-500' },
    { title: 'Pending Tickets', value: stats?.pending || 0, icon: Clock, color: 'text-yellow-500' },
    { title: 'Closed Tickets', value: stats?.closed || 0, icon: CheckCircle2, color: 'text-green-500' },
  ];

  const selectedChatData = chats?.chats?.find((c) => c._id === selectedChat);

  const getStatusBadge = (status) => {
    const variants = {
      open: 'success',
      pending: 'warning',
      closed: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Support Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Manage customer support tickets</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-primary border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Support Chats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!chats || !chats.chats || chats.chats.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No support chats found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800">
                    <TableHead className="text-gray-300">Subject</TableHead>
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chats.chats.map((chat) => (
                    <TableRow key={chat._id} className="border-gray-700 hover:bg-gray-800">
                      <TableCell className="text-white">{chat.subject || 'No subject'}</TableCell>
                      <TableCell className="text-gray-300">
                        {chat.userId?.name || chat.guestName || 'Guest'}
                      </TableCell>
                      <TableCell>{getStatusBadge(chat.status)}</TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(chat.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewChat(chat)}
                          >
                            View
                          </Button>
                          {!chat.adminId && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                  assignMutation.mutate(chat._id);
                              }}
                              disabled={assignMutation.isPending}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat View Dialog */}
      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent size="lg" className="bg-primary border-gray-700 flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <div>
                <span>{selectedChatData?.subject || 'Support Chat'}</span>
                <span className="ml-2 text-sm text-gray-400">
                  - {selectedChatData?.userId?.name || selectedChatData?.guestName || 'Guest'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedChatData?.status)}
                {!selectedChatData?.adminId && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      assignMutation.mutate(selectedChat);
                    }}
                    disabled={assignMutation.isPending}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Assign to Me
                  </Button>
                )}
                {selectedChatData?.status !== 'closed' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (selectedChat) {
                        closeChatMutation.mutate(selectedChat);
                      }
                    }}
                    disabled={closeChatMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Close Ticket
                  </Button>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedChatData?.userId?.email || selectedChatData?.guestEmail || 'No email'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900 rounded-lg mb-4"
            >
              {messagesLoading ? (
                <Loading message="Loading messages..." />
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No messages yet</div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.senderType === 'admin';
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isAdmin
                            ? 'bg-accent text-white'
                            : 'bg-gray-800 text-gray-200'
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1">
                          {msg.senderName || msg.senderId?.name || (isAdmin ? 'Admin' : 'User')}
                        </div>
                        <p className="text-sm">{msg.messageText}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.sentAt || msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {selectedChatData?.status !== 'closed' && (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending || !message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportManagement;
