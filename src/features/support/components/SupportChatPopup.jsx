import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { X, Headphones, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import PresenceBar from './PresenceBar';
import { StatusBadge } from './badges';
import { useSupportThread } from '../hooks/useSupportThread';

const ensureArray = (value, key) => {
  if (Array.isArray(value)) return value;
  if (key && Array.isArray(value?.[key])) return value[key];
  return [];
};

const SupportChatPopup = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['user-support-chats-popup'],
    queryFn: () => supportAPI.getMySupportChats().then((res) => res.data.data),
    enabled: isOpen,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const chatsList = ensureArray(chats, 'chats');
  const selectedChatData = chatsList.find((c) => c._id === selectedChat);
  const isClosed = selectedChatData?.status === 'closed';

  const thread = useSupportThread({
    chatId: selectedChat,
    side: 'customer',
    enabled: !!selectedChat && isOpen,
  });

  // Auto-select first open chat
  useEffect(() => {
    if (chatsList.length > 0 && !selectedChat) {
      const openChat = chatsList.find((c) => c.status === 'open') || chatsList[0];
      // Initialize the selection once the list arrives from the server.
       
      setSelectedChat(openChat._id);
    }
  }, [chatsList, selectedChat]);

  // Surface unread count to the launcher badge
  useEffect(() => {
    if (chatsList.length && onUnreadCountChange) {
      const unread = chatsList.reduce((total, chat) => total + (chat.unreadCountUser || 0), 0);
      onUnreadCountChange(unread);
    }
  }, [chatsList, onUnreadCountChange]);

  const createChatMutation = useMutation({
    mutationFn: (data) => supportAPI.createSupportChat(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-support-chats-popup'] });
      const newChat = response.data?.data?.chat;
      if (newChat?._id) setSelectedChat(newChat._id);
      setDialogOpen(false);
      setSubject('');
      setInitialMessage('');
    },
  });

  const handleCreateChat = (e) => {
    e.preventDefault();
    createChatMutation.mutate({ subject: subject.trim(), initialMessage: initialMessage.trim() });
  };

  const getStatusBadge = (status) => <StatusBadge status={status} />;

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[440px] bg-primary border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-accent" />
          <h3 className="text-white font-semibold">Support Chat</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close chat">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat list */}
        <div className="w-1/3 border-r border-gray-700 bg-gray-900 overflow-y-auto">
          <div className="p-2">
            <Button size="sm" className="w-full mb-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          {chatsLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
          ) : chatsList.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-xs">No chats yet</div>
          ) : (
            <div className="space-y-1 p-2">
              {chatsList.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat._id)}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedChat === chat._id ? 'bg-accent text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                    <span className="text-xs font-medium truncate min-w-0">{chat.subject || 'No subject'}</span>
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

        {/* Messages */}
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Headphones className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a chat or create a new one</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
                <h4 className="text-white font-medium text-sm truncate">{selectedChatData?.subject || 'Support Chat'}</h4>
                {getStatusBadge(selectedChatData?.status)}
              </div>
              <PresenceBar
                userId={selectedChatData?.adminId?._id}
                name={selectedChatData?.adminId?.name || 'Support team'}
                connected={thread.connected}
              />
              {thread.isLoading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading messages…</div>
              ) : (
                <MessageList
                  messages={thread.messages}
                  side="customer"
                  hasMore={thread.hasMore}
                  isLoadingOlder={thread.isLoadingOlder}
                  onLoadOlder={thread.loadOlder}
                  onRetry={thread.retry}
                  typing={thread.otherTyping}
                  typingLabel="Support"
                  emptyText="No messages yet. Start the conversation!"
                />
              )}
              {!isClosed && (
                <ChatInput onSendText={thread.sendText} onSendImage={thread.sendImage} onType={thread.notifyTyping} />
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="md" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
            <DialogDescription className="text-gray-400">Create a new support ticket to get help</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChat} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="popup-subject" className="text-gray-300">Subject</Label>
              <Input
                id="popup-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What do you need help with?"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="popup-message" className="text-gray-300">Message</Label>
              <Textarea
                id="popup-message"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Describe your issue..."
                required
                rows={4}
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

export default SupportChatPopup;
