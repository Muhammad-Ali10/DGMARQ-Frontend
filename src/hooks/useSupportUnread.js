import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { supportAPI } from '../services/api';
import { useSocket } from './useSocket';

/**
 * Total unread support replies for the current customer (sum of unreadCountUser
 * across their tickets). Drives the sidebar "Support" badge. Refreshes on a
 * light interval and immediately whenever a support message arrives over the
 * socket.
 */
export const useSupportUnread = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['support-unread-total'],
    queryFn: async () => {
      const res = await supportAPI.getMySupportChats();
      const list = res?.data?.data?.chats || res?.data?.data || [];
      const chats = Array.isArray(list) ? list : [];
      return chats.reduce((sum, c) => sum + (c.unreadCountUser || 0), 0);
    },
    enabled: !!isAuthenticated,
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!socket) return undefined;
    const bump = () => queryClient.invalidateQueries({ queryKey: ['support-unread-total'] });
    socket.on('support_message', bump);
    return () => socket.off('support_message', bump);
  }, [socket, queryClient]);

  return data || 0;
};
