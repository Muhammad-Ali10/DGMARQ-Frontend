import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

let globalSocket = null;
let globalSocketToken = null;
let globalSocketRefCount = 0;

const getSocketUrl = () =>
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:8000');

const destroyGlobalSocket = () => {
  if (globalSocket) {
    globalSocket.removeAllListeners();
    globalSocket.disconnect();
    globalSocket = null;
    globalSocketToken = null;
  }
};

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const accessToken = token || localStorage.getItem('accessToken');

  useEffect(() => {
    // Cleanup if logged out
    if (!isAuthenticated || !accessToken) {
      destroyGlobalSocket();
      globalSocketRefCount = 0;
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    // If token changed (e.g. refresh), recreate socket
    if (globalSocket && globalSocketToken !== accessToken) {
      destroyGlobalSocket();
    }

    // Reuse existing connected socket
    if (globalSocket && globalSocket.connected) {
      socketRef.current = globalSocket;
      globalSocketRefCount++;
      setIsConnected(true);
      return () => {
        globalSocketRefCount--;
        socketRef.current = null;
      };
    }

    // Reconnect disconnected socket
    if (globalSocket && !globalSocket.connected) {
      destroyGlobalSocket();
    }

    // Create new socket
    const socketUrl = getSocketUrl();
    globalSocket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      timeout: 20000,
      forceNew: false,
      withCredentials: true,
    });
    globalSocketToken = accessToken;
    globalSocketRefCount++;

    globalSocket.on('connect', () => setIsConnected(true));
    globalSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        globalSocket?.connect();
      }
    });
    globalSocket.on('connect_error', () => setIsConnected(false));
    globalSocket.on('reconnect', () => setIsConnected(true));
    globalSocket.on('reconnect_failed', () => setIsConnected(false));

    socketRef.current = globalSocket;

    return () => {
      globalSocketRefCount--;
      socketRef.current = null;
      // Only destroy socket when no components reference it
      if (globalSocketRefCount <= 0) {
        destroyGlobalSocket();
        globalSocketRefCount = 0;
        setIsConnected(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);

  return { socket: socketRef.current, isConnected };
};
