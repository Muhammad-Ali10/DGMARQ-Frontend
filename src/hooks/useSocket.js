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

    // Extract socket URL from API base URL
    // Handle both http://domain.com/api/v1 and https://domain.com/api/v1 formats
    let socketUrl = 'http://localhost:8000'; // Default fallback
    
    if (import.meta.env.VITE_API_BASE_URL) {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      // Remove /api/v1 if present
      socketUrl = apiUrl.replace(/\/api\/v1$/, '').replace(/\/api\/v1\/$/, '');
      
      // Ensure we have a protocol
      if (!socketUrl.startsWith('http://') && !socketUrl.startsWith('https://')) {
        // If no protocol, assume same protocol as current page
        socketUrl = window.location.protocol === 'https:' 
          ? `https://${socketUrl}` 
          : `http://${socketUrl}`;
      }
    }
    
    // Only create new socket if one doesn't exist or is disconnected
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(socketUrl, {
        auth: {
          token: accessToken,
        },
        transports: ['polling', 'websocket'], // Prioritize polling first for better compatibility
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 20000,
        forceNew: false,
        withCredentials: true,
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected successfully');
        setIsConnected(true);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a manual disconnect
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect manually
          socketRef.current.connect();
        }
      });

      socketRef.current.on('error', (error) => {
        console.error('⚠️ Socket error:', error);
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        console.error('Socket URL:', socketUrl);
        console.error('Error details:', error);
        setIsConnected(false);
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
      });

      socketRef.current.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Reconnection attempt', attemptNumber);
      });

      socketRef.current.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error.message);
      });

      socketRef.current.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed after all attempts');
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

