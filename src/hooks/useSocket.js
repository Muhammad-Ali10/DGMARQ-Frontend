import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

// Singleton socket instance to prevent multiple connections
let globalSocket = null;

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
        globalSocket = null;
        setIsConnected(false);
      }
      return;
    }

    // Use VITE_SOCKET_URL explicitly, fallback to API base URL without /api/v1
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.VITE_API_BASE_URL 
        ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
        : 'http://localhost:8000');
    
    // Use singleton socket if it exists and is connected
    if (globalSocket && globalSocket.connected) {
      socketRef.current = globalSocket;
      setIsConnected(true);
      return;
    }

    // Clean up old socket if it exists but is disconnected
    if (globalSocket && !globalSocket.connected) {
      globalSocket.removeAllListeners();
      globalSocket.disconnect();
      globalSocket = null;
    }
    
    // Create new socket instance (singleton pattern)
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

      // Set up event listeners (only once for singleton)
      globalSocket.on('connect', () => {
        setIsConnected(true);
      });

      globalSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        
        // Attempt to reconnect if not a manual disconnect
        if (reason === 'io server disconnect') {
          globalSocket.connect();
        }
      });

      globalSocket.on('error', (error) => {
        setIsConnected(false);
        // Don't disconnect - let reconnection handle it
      });

      globalSocket.on('connect_error', (error) => {
        setIsConnected(false);
        // Socket.IO will automatically retry based on reconnection settings
      });

      globalSocket.on('reconnect', (attemptNumber) => {
        setIsConnected(true);
      });

      globalSocket.on('reconnect_attempt', (attemptNumber) => {
        // Reconnection in progress
      });

      globalSocket.on('reconnect_error', (error) => {
        // Reconnection error - will retry
      });

      globalSocket.on('reconnect_failed', () => {
        setIsConnected(false);
      });
    }

    socketRef.current = globalSocket;

    return () => {
      // Don't disconnect on cleanup - keep singleton connection alive
      // Only disconnect if component unmounts or auth changes
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);

  // Return socket from ref - this is a common pattern for hooks
  // The ref is updated in the effect, and components can use it safely
  return { socket: socketRef.current, isConnected };
};

