import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@services/api';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Button } from '@components/ui/button';
import { SearchInput } from '@components/common/SearchInput';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Headphones, MessageSquare, Clock, CheckCircle2, UserPlus, UserMinus, BookText, Star } from 'lucide-react';
import { showSuccess, showApiError } from '@utils/toast';
import { useSocket } from '@hooks/useSocket';
import { EmptyState } from '@components/common/EmptyState';
import { Pagination } from '@components/common/Pagination';
import {
  MessageList,
  ChatInput,
  PresenceBar,
  CannedResponsesManager,
  PriorityBadge,
  StatusBadge,
  STATUS_FILTERS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  useSupportThread,
} from '@features/support';

const Avatar = ({ user }) => {
  const name = user?.name || 'Customer';
  if (user?.profileImage) {
    return <img src={user.profileImage} alt={name} className="h-7 w-7 rounded-full object-cover" />;
  }
  return (
    <div className="h-7 w-7 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

const SupportManagement = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketFromUrl = searchParams.get('ticket');
  const [pickedChat, setPickedChat] = useState(null);
  const [pickedDialogOpen, setPickedDialogOpen] = useState(false);
  const selectedChat = ticketFromUrl || pickedChat;
  const chatDialogOpen = Boolean(ticketFromUrl) || pickedDialogOpen;
  const setChatDialogOpen = (open) => {
    if (!open && ticketFromUrl) setSearchParams({}, { replace: true });
    setPickedDialogOpen(open);
  };
  const [cannedOpen, setCannedOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('activity');
  const [mine, setMine] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filterKey = `${statusFilter}|${sort}|${search}|${mine}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (next) => setPageState({ key: filterKey, page: next });

  const params = {
    status: statusFilter,
    sort,
    page,
    limit: 20,
    ...(search ? { search } : {}),
    ...(mine ? { mine: 'me' } : {}),
  };

  const thread = useSupportThread({ chatId: selectedChat, side: 'admin', enabled: !!selectedChat && chatDialogOpen });

  const { data: chats, isLoading: isLoadingChats, isError: isErrorChats } = useQuery({
    queryKey: ['admin-support-chats', params],
    queryFn: () => adminAPI.getAllSupportChats(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    retry: 1,
  });

  const { data: stats } = useQuery({
    queryKey: ['support-stats'],
    queryFn: () => adminAPI.getSupportStats().then((r) => r.data.data),
    retry: 1,
  });

  const { data: canned = [] } = useQuery({
    queryKey: ['canned-responses'],
    queryFn: () => adminAPI.getCannedResponses().then((r) => r.data.data),
    enabled: chatDialogOpen,
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-support-chats'] });
    queryClient.invalidateQueries({ queryKey: ['support-stats'] });
  };

  const { socket, isConnected } = useSocket();
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    let timer = null;
    const onInboxChanged = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-support-chats'] });
        queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      }, 500);
    };
    socket.on('support_inbox_changed', onInboxChanged);
    return () => {
      clearTimeout(timer);
      socket.off('support_inbox_changed', onInboxChanged);
    };
  }, [socket, isConnected, queryClient]);

  const assignMutation = useMutation({
    mutationFn: (chatId) => adminAPI.assignAdminToChat(chatId),
    onSuccess: () => { refresh(); showSuccess('Assigned to you'); },
    onError: (e) => showApiError(e, 'Failed to assign'),
  });
  const unassignMutation = useMutation({
    mutationFn: (chatId) => adminAPI.unassignChat(chatId),
    onSuccess: () => { refresh(); showSuccess('Unassigned'); },
    onError: (e) => showApiError(e, 'Failed to unassign'),
  });
  const priorityMutation = useMutation({
    mutationFn: ({ chatId, priority }) => adminAPI.updateChatPriority(chatId, priority),
    onSuccess: refresh,
    onError: (e) => showApiError(e, 'Failed to update priority'),
  });
  const statusMutation = useMutation({
    mutationFn: ({ chatId, status }) => adminAPI.updateChatStatus(chatId, status),
    onSuccess: () => { refresh(); showSuccess('Status updated'); },
    onError: (e) => showApiError(e, 'Failed to update status'),
  });

  const handleViewChat = (chat) => {
    if (ticketFromUrl) setSearchParams({}, { replace: true });
    setPickedChat(chat._id);
    setPickedDialogOpen(true);
  };

  if (isLoadingChats && !chats) return <Loading message="Loading support data..." />;
  if (isErrorChats) return <ErrorMessage message="Error loading support data" />;

  const statsCards = [
    { title: 'Open', value: stats?.open || 0, icon: MessageSquare, color: 'text-blue-500' },
    { title: 'In Progress', value: stats?.inProgress || 0, icon: Clock, color: 'text-indigo-400' },
    { title: 'Waiting', value: stats?.waiting || 0, icon: Clock, color: 'text-amber-400' },
    { title: 'Resolved', value: stats?.resolved || 0, icon: CheckCircle2, color: 'text-green-500' },
  ];

  const rows = chats?.chats || [];
  const selectedChatData = rows.find((c) => c._id === selectedChat);
  const isClosed = selectedChatData?.status === 'closed';

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Support Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage customer support tickets</p>
        </div>
        <Button variant="outline" onClick={() => setCannedOpen(true)}>
          <BookText className="h-4 w-4 mr-2" /> Canned Responses
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} variant="hud">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-gray-300">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
        <Card variant="hud">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-gray-300">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.avgRating != null ? `${stats.avgRating}★` : '—'}
            </div>
            <p className="text-xs text-gray-500">{stats?.ratingCount || 0} ratings</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="hud">
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" /> Support Chats
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === f.value ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search name, email, subject…"
              className="flex-1 min-w-[180px]"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-md px-2 py-2"
            >
              <option value="activity">Last activity</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">Priority</option>
            </select>
            <button
              onClick={() => setMine((v) => !v)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                mine ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              My tickets
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState title="No tickets match these filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table variant="hud">
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800">
                    <TableHead className="text-gray-300">Ticket</TableHead>
                    <TableHead className="text-gray-300">Customer</TableHead>
                    <TableHead className="text-gray-300">Priority</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Assignee</TableHead>
                    <TableHead className="text-gray-300">Activity</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((chat) => (
                    <TableRow key={chat._id} className="border-gray-700 hover:bg-gray-800">
                      <TableCell className="max-w-[220px]">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">{chat.subject || 'No subject'}</span>
                          {chat.unreadCountAdmin > 0 && (
                            <span className="bg-red-500 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                              {chat.unreadCountAdmin > 9 ? '9+' : chat.unreadCountAdmin}
                            </span>
                          )}
                        </div>
                        {chat.lastMessage && <p className="text-gray-400 text-xs truncate">{chat.lastMessage}</p>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar user={chat.userId} />
                          <div className="min-w-0">
                            <p className="text-gray-200 text-sm truncate">{chat.userId?.name || 'Customer'}</p>
                            <p className="text-gray-500 text-xs truncate">{chat.userId?.email || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><PriorityBadge priority={chat.priority} /></TableCell>
                      <TableCell><StatusBadge status={chat.status} /></TableCell>
                      <TableCell className="text-gray-300 text-sm">{chat.assignedTo?.name || <span className="text-gray-500">Unassigned</span>}</TableCell>
                      <TableCell className="text-gray-400 text-xs">{new Date(chat.lastMessageAt || chat.updatedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewChat(chat)}>View</Button>
                          {!chat.assignedTo && (
                            <Button size="sm" onClick={() => assignMutation.mutate(chat._id)} disabled={assignMutation.isPending}>
                              <UserPlus className="w-4 h-4 mr-1" /> Assign
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
          <Pagination
            page={page}
            totalPages={chats?.pagination?.pages || 1}
            onPageChange={setPage}
            total={chats?.pagination?.total}
            totalNoun="tickets"
          />
        </CardContent>
      </Card>

      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent size="lg" className="flex flex-col h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between flex-wrap gap-2">
              <div className="min-w-0">
                <span className="truncate">{selectedChatData?.subject || 'Support Chat'}</span>
                <span className="ml-2 text-sm text-gray-400">
                  - {selectedChatData?.userId?.name || 'Customer'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedChatData && <PriorityBadge priority={selectedChatData.priority} />}
                <select
                  value={selectedChatData?.priority || 'low'}
                  onChange={(e) => selectedChat && priorityMutation.mutate({ chatId: selectedChat, priority: e.target.value })}
                  className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-1.5 py-1"
                  title="Priority"
                >
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  value={STATUS_OPTIONS.includes(selectedChatData?.status) ? selectedChatData?.status : 'in_progress'}
                  onChange={(e) => selectedChat && statusMutation.mutate({ chatId: selectedChat, status: e.target.value })}
                  className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-1.5 py-1"
                  title="Status"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                {selectedChatData?.assignedTo ? (
                  <Button size="sm" variant="outline" onClick={() => unassignMutation.mutate(selectedChat)} disabled={unassignMutation.isPending}>
                    <UserMinus className="w-4 h-4 mr-1" /> Unassign
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => assignMutation.mutate(selectedChat)} disabled={assignMutation.isPending}>
                    <UserPlus className="w-4 h-4 mr-1" /> Assign to Me
                  </Button>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedChatData?.userId?.email || 'No email'}
              {selectedChatData?.category && <span className="ml-2">• {selectedChatData.category}</span>}
              {selectedChatData?.relatedOrderId && (
                <span className="ml-2">
                  •{' '}
                  <Link to={`/admin/orders/${selectedChatData.relatedOrderId}`} className="underline underline-offset-2 hover:text-white">
                    Related order
                  </Link>
                </span>
              )}
              {selectedChatData?.assignedTo?.name && <span className="ml-2">• Assigned to {selectedChatData.assignedTo.name}</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden bg-gray-900 rounded-lg">
            <PresenceBar
              userId={selectedChatData?.userId?._id}
              name={selectedChatData?.userId?.name || 'Customer'}
              connected={thread.connected}
              onlineText="Online now"
              offlineText="Offline"
            />
            {thread.isLoading ? (
              <Loading message="Loading messages..." />
            ) : (
              <MessageList
                messages={thread.messages}
                side="admin"
                hasMore={thread.hasMore}
                isLoadingOlder={thread.isLoadingOlder}
                onLoadOlder={thread.loadOlder}
                onRetry={thread.retry}
                typing={thread.otherTyping}
                typingLabel="Customer"
                emptyText="No messages yet"
              />
            )}
            {!isClosed && (
              <ChatInput
                onSendText={thread.sendText}
                onSendImage={thread.sendImage}
                onType={thread.notifyTyping}
                placeholder="Type your reply…  (type / for canned responses)"
                cannedResponses={canned}
                allowInternal
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CannedResponsesManager open={cannedOpen} onOpenChange={setCannedOpen} />
    </div>
  );
};

export default SupportManagement;
