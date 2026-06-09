import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

let globalSocket = null;
let globalSocketToken = null;
let globalSocketRefCount = 0;
let globalDestroyTimer = null;
let globalConnectionPending = false;
const SOCKET_DESTROY_GRACE_MS = 1500;

const getSocketUrl = () =>
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:8000');

const destroyGlobalSocket = () => {
  if (globalDestroyTimer) {
    clearTimeout(globalDestroyTimer);
    globalDestroyTimer = null;
  }
  if (globalSocket) {
    globalSocket.removeAllListeners();
    globalSocket.disconnect();
    globalSocket = null;
    globalSocketToken = null;
  }
  globalConnectionPending = false;
};

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  // SECURITY FIX (#5): auth is carried by the httpOnly accessToken cookie
  // (withCredentials below). There is no client-readable token anymore; we gate
  // the socket purely on isAuthenticated and let the cookie authenticate the
  // handshake server-side.
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    let isUnmounted = false;
    const safeSetConnected = (value) => {
      if (!isUnmounted) setIsConnected(value);
    };

    if (globalDestroyTimer) {
      clearTimeout(globalDestroyTimer);
      globalDestroyTimer = null;
    }

    // Cleanup if logged out
    if (!isAuthenticated) {
      destroyGlobalSocket();
      globalSocketRefCount = 0;
      socketRef.current = null;
      safeSetConnected(false);
      return;
    }

    // If auth state changed, recreate socket
    if (globalSocket && globalSocketToken !== 'authenticated') {
      destroyGlobalSocket();
    }

    // Reuse existing connected socket
    if (globalSocket && globalSocket.connected) {
      socketRef.current = globalSocket;
      globalSocketRefCount++;
      safeSetConnected(true);
      return () => {
        isUnmounted = true;
        globalSocketRefCount--;
        socketRef.current = null;
      };
    }

    // If a connection is already in progress, do not create another one.
    if (globalSocket && globalConnectionPending) {
      socketRef.current = globalSocket;
      globalSocketRefCount++;
      safeSetConnected(false);
      return () => {
        isUnmounted = true;
        globalSocketRefCount--;
        socketRef.current = null;
      };
    }

    // Reuse a disconnected socket and let reconnection strategy handle retries.
    if (globalSocket && !globalSocket.connected) {
      socketRef.current = globalSocket;
      globalSocketRefCount++;
      globalSocket.connect();
      return () => {
        isUnmounted = true;
        globalSocketRefCount--;
        socketRef.current = null;
      };
    }

    // Create new socket
    const socketUrl = getSocketUrl();
    globalConnectionPending = true;
    globalSocket = io(socketUrl, {
      // Auth travels via the httpOnly accessToken cookie (withCredentials).
      auth: {},
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      randomizationFactor: 0,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 4000,
      reconnectionAttempts: 3,
      timeout: 20000,
      forceNew: false,
      withCredentials: true,
    });
    globalSocketToken = 'authenticated';
    globalSocketRefCount++;

    globalSocket.on('connect', () => {
      globalConnectionPending = false;
      safeSetConnected(true);
    });
    globalSocket.on('disconnect', (reason) => {
      globalConnectionPending = false;
      safeSetConnected(false);
      if (reason === 'io server disconnect') {
        globalSocket?.connect();
      }
    });
    globalSocket.on('connect_error', () => {
      safeSetConnected(false);
    });
    globalSocket.on('reconnect', () => {
      globalConnectionPending = false;
      safeSetConnected(true);
    });
    globalSocket.on('reconnect_attempt', () => {
      globalConnectionPending = true;
      safeSetConnected(false);
    });
    globalSocket.on('reconnect_failed', () => {
      globalConnectionPending = false;
      safeSetConnected(false);
    });

    socketRef.current = globalSocket;

    return () => {
      isUnmounted = true;
      globalSocketRefCount--;
      socketRef.current = null;
      // Defer disconnect slightly to avoid strict-mode mount/unmount thrash.
      if (globalSocketRefCount <= 0) {
        globalSocketRefCount = 0;
        globalDestroyTimer = setTimeout(() => {
          if (globalSocketRefCount <= 0) {
            destroyGlobalSocket();
            safeSetConnected(false);
          }
        }, SOCKET_DESTROY_GRACE_MS);
      }
    };
  }, [isAuthenticated]);

  return { socket: socketRef.current, isConnected };
};
