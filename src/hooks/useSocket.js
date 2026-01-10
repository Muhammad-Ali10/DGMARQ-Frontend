import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const accessToken = token || localStorage.getItem('accessToken');

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      // Clean up if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    
    // Only create new socket if one doesn't exist or is disconnected
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(socketUrl, {
        auth: {
          token: accessToken,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });
    }

    return () => {
      // Don't disconnect on cleanup - keep connection alive
      // Only disconnect if component unmounts or auth changes
    };
  }, [isAuthenticated, accessToken]);

  return { socket: socketRef.current, isConnected };
};

