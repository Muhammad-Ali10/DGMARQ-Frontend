import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

let globalSocket = null;

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const accessToken = token || localStorage.getItem('accessToken');

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        globalSocket = null;
        setIsConnected(false);
      }
      return;
    }
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.VITE_API_BASE_URL 
        ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
        : 'http://localhost:8000');
    if (globalSocket && globalSocket.connected) {
      socketRef.current = globalSocket;
      setIsConnected(true);
      return;
    }
    if (globalSocket && !globalSocket.connected) {
      globalSocket.removeAllListeners();
      globalSocket.disconnect();
      globalSocket = null;
    }
    if (!globalSocket) {
      globalSocket = io(socketUrl, {
        auth: {
          token: accessToken,
        },
        transports: ['websocket', 'polling'], // Support both for better compatibility
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 20000,
        forceNew: false,
        withCredentials: true,
      });
      globalSocket.on('connect', () => {
        setIsConnected(true);
      });

      globalSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          globalSocket.connect();
        }
      });

      globalSocket.on('error', (error) => {
        setIsConnected(false);
      });

      globalSocket.on('connect_error', (error) => {
        setIsConnected(false);
      });

      globalSocket.on('reconnect', (attemptNumber) => {
        setIsConnected(true);
      });

      globalSocket.on('reconnect_attempt', (attemptNumber) => {
      });

      globalSocket.on('reconnect_error', (error) => {
      });

      globalSocket.on('reconnect_failed', () => {
        setIsConnected(false);
      });
    }

    socketRef.current = globalSocket;

    return () => {
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);
  return { socket: socketRef.current, isConnected };
};

