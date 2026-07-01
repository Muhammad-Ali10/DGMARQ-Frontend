import { useEffect, useState } from 'react';
import { useSocket } from '@hooks/useSocket';

/**
 * Tracks whether a given user is online, using the server's existing presence
 * protocol: emit `check_online` → receive `online_statuses`, and listen to live
 * `user_status` broadcasts. Re-polls every 30s while mounted.
 */
export const useUserPresence = (userId) => {
  const { socket, isConnected } = useSocket();
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!socket || !isConnected || !userId) return undefined;
    const id = userId.toString();

    const check = () => socket.emit('check_online', [id]);
    const onStatuses = (statuses) => {
      if (statuses && Object.prototype.hasOwnProperty.call(statuses, id)) {
        setOnline(!!statuses[id]);
      }
    };
    const onStatus = (payload) => {
      if (payload?.userId?.toString() === id) setOnline(payload.status === 'online');
    };

    socket.on('online_statuses', onStatuses);
    socket.on('user_status', onStatus);
    check();
    const interval = setInterval(check, 30000);

    return () => {
      clearInterval(interval);
      socket.off('online_statuses', onStatuses);
      socket.off('user_status', onStatus);
    };
  }, [socket, isConnected, userId]);

  return online;
};
