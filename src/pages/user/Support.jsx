import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { supportAPI } from '../../services/api';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Headphones, Plus, ChevronLeft } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';
import MessageList from '../../components/support/MessageList';
import ChatInput from '../../components/support/ChatInput';
import RatingPrompt from '../../components/support/RatingPrompt';
import NewTicketDialog from '../../components/support/NewTicketDialog';
import PresenceBar from '../../components/support/PresenceBar';
import { MessageListSkeleton, TicketListSkeleton } from '../../components/support/ChatSkeletons';
import { StatusBadge } from '../../components/support/badges';
import { useSupportThread } from '../../hooks/useSupportThread';

const ensureArray = (value, key) => {
  if (Array.isArray(value)) return value;
  if (key && Array.isArray(value?.[key])) return value[key];
  return [];
};

const UserSupport = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['user-support-chats'],
    queryFn: () => supportAPI.getMySupportChats().then((res) => res.data.data),
  });

  const chatsList = ensureArray(chats, 'chats');
  const selectedChatData = chatsList.find((c) => c._id === selectedChat);
  const isClosed = selectedChatData?.status === 'closed';

  const thread = useSupportThread({
    chatId: selectedChat,
    side: 'customer',
    enabled: !!selectedChat,
  });

  // Auto-open the ticket dialog pre-filled when arriving from an order page,
  // e.g. navigate('/user/support', { state: { supportTicket: { orderId, subject } } }).
  useEffect(() => {
    const seed = location.state?.supportTicket;
    if (seed) {
      // Seed the create dialog from router state, then clear it so a refresh
      // doesn't re-open. Legitimately effectful (reacts to navigation).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefill(seed);
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const closeChatMutation = useMutation({
    mutationFn: (chatId) => supportAPI.closeSupportChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-support-chats'] });
      showSuccess('Support ticket closed successfully');
    },
    onError: (error) => showApiError(error, 'Failed to close support ticket'),
  });

  const handleTicketCreated = (chatId) => {
    queryClient.invalidateQueries({ queryKey: ['user-support-chats'] });
    if (chatId) setSelectedChat(chatId);
  };

  const getStatusBadge = (status) => <StatusBadge status={status} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Support</h1>
          <p className="text-gray-400 mt-1">Get help from our support team</p>
        </div>
        <Button onClick={() => { setPrefill(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Tickets list — hidden on mobile once a ticket is open */}
        <Card className={`bg-primary border-gray-700 ${selectedChat ? 'hidden lg:block' : 'block'}`}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-full">
            {chatsLoading ? (
              <TicketListSkeleton />
            ) : chatsList.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Headphones className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-gray-300">No tickets yet</p>
                <p className="text-sm">Need help? Create one!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chatsList.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => setSelectedChat(chat._id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChat === chat._id ? 'bg-accent' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-white font-medium truncate">{chat.subject || 'No subject'}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {chat.unreadCountUser > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                            {chat.unreadCountUser > 9 ? '9+' : chat.unreadCountUser}
                          </span>
                        )}
                        {getStatusBadge(chat.status)}
                      </div>
                    </div>
                    {chat.lastMessage && (
                      <p className="text-gray-400 text-xs truncate">{chat.lastMessage}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(chat.lastMessageAt || chat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation — full-screen on mobile when a ticket is open */}
        <Card className={`lg:col-span-2 bg-primary border-gray-700 flex-col overflow-hidden ${selectedChat ? 'flex' : 'hidden lg:flex'}`}>
          <CardHeader className="flex flex-row items-center justify-between shrink-0 gap-2">
            <CardTitle className="text-white flex items-center gap-2 min-w-0">
              {selectedChat && (
                <button
                  type="button"
                  onClick={() => setSelectedChat(null)}
                  className="lg:hidden text-gray-300 hover:text-white shrink-0"
                  aria-label="Back to tickets"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <span className="truncate">{selectedChatData ? selectedChatData.subject || 'Support Chat' : 'Select a ticket'}</span>
            </CardTitle>
            {selectedChatData && selectedChatData.status !== 'closed' && (
              <Button variant="destructive" size="sm" onClick={() => closeChatMutation.mutate(selectedChat)}>
                Close Ticket
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
            {!selectedChat ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Headphones className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a support ticket to view messages</p>
                </div>
              </div>
            ) : thread.isLoading ? (
              <MessageListSkeleton />
            ) : (
              <>
                <PresenceBar
                  userId={selectedChatData?.adminId?._id}
                  name={selectedChatData?.adminId?.name || 'Support team'}
                  connected={thread.connected}
                />
                <MessageList
                  messages={thread.messages}
                  side="customer"
                  hasMore={thread.hasMore}
                  isLoadingOlder={thread.isLoadingOlder}
                  onLoadOlder={thread.loadOlder}
                  onRetry={thread.retry}
                  typing={thread.otherTyping}
                  typingLabel="Support"
                  emptyText="Start the conversation — describe your issue"
                />
                {['resolved', 'closed'].includes(selectedChatData?.status) && (
                  <RatingPrompt
                    chatId={selectedChat}
                    alreadyRated={!!selectedChatData?.rating}
                    onRated={() => queryClient.invalidateQueries({ queryKey: ['user-support-chats'] })}
                  />
                )}
                {isClosed ? (
                  <div className="border-t border-gray-700 bg-gray-800 p-2 text-center text-xs text-gray-400">
                    This ticket is closed. Need more help? Open a new one.
                  </div>
                ) : (
                  <ChatInput onSendText={thread.sendText} onSendImage={thread.sendImage} onType={thread.notifyTyping} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <NewTicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        prefill={prefill}
        onCreated={handleTicketCreated}
      />
    </div>
  );
};

export default UserSupport;
