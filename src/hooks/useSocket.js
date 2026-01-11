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
  const DEBUG_SOCKET = import.meta.env.DEV; // Enable debug logging in development

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

    // Use VITE_SOCKET_URL explicitly
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
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
        transports: ['websocket'], // Use websocket only for production
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
        if (DEBUG_SOCKET) console.log('✅ Socket connected successfully');
        setIsConnected(true);
      });

      globalSocket.on('disconnect', (reason) => {
        if (DEBUG_SOCKET) console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a manual disconnect
        if (reason === 'io server disconnect') {
          globalSocket.connect();
        }
      });

      globalSocket.on('error', () => {
        if (DEBUG_SOCKET) console.error('⚠️ Socket error');
        setIsConnected(false);
      });

      globalSocket.on('connect_error', (error) => {
        if (DEBUG_SOCKET) {
          console.error('❌ Socket connection error:', error.message);
          console.error('Socket URL:', socketUrl);
          console.error('Error details:', error);
        }
        setIsConnected(false);
      });

      globalSocket.on('reconnect', (attemptNumber) => {
        if (DEBUG_SOCKET) console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
      });

      globalSocket.on('reconnect_attempt', (attemptNumber) => {
        if (DEBUG_SOCKET) console.log('🔄 Reconnection attempt', attemptNumber);
      });

      globalSocket.on('reconnect_error', (error) => {
        if (DEBUG_SOCKET) console.error('❌ Reconnection error:', error.message);
      });

      globalSocket.on('reconnect_failed', () => {
        if (DEBUG_SOCKET) console.error('❌ Socket reconnection failed after all attempts');
        setIsConnected(false);
      });

      // Optional: onAny logging for debugging (only in dev)
      if (DEBUG_SOCKET && globalSocket.onAny) {
        globalSocket.onAny((event, ...args) => {
          console.log('📡 Socket event:', event, args);
        });
      }
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

