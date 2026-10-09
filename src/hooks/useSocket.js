import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

let globalSocket = null;
let globalSocketRefCount = 0;
let globalDestroyTimer = null;
const SOCKET_DESTROY_GRACE_MS = 1500;

const getSocketUrl = () =>
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:5000');

const createGlobalSocket = () =>
  io(getSocketUrl(), {
    auth: {},
    transports: ['websocket'],
    reconnection: true,
    randomizationFactor: 0.5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    forceNew: false,
    withCredentials: true,
  });

const destroyGlobalSocket = () => {
  if (globalDestroyTimer) {
    clearTimeout(globalDestroyTimer);
    globalDestroyTimer = null;
  }
  if (globalSocket) {
    globalSocket.removeAllListeners();
    globalSocket.disconnect();
    globalSocket = null;
  }
};

export const useSocket = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(globalSocket);
  const [isConnected, setIsConnected] = useState(Boolean(globalSocket?.connected));

  useEffect(() => {
    let unmounted = false;
    const safeSetConnected = (v) => { if (!unmounted) setIsConnected(v); };
    const safeSetSocket = (s) => { if (!unmounted) setSocket(s); };

    if (!isAuthenticated) {
      destroyGlobalSocket();
      globalSocketRefCount = 0;
      safeSetSocket(null);
      safeSetConnected(false);
      return;
    }

    if (globalDestroyTimer) {
      clearTimeout(globalDestroyTimer);
      globalDestroyTimer = null;
    }

    if (!globalSocket) {
      globalSocket = createGlobalSocket();
    }
    const s = globalSocket;
    globalSocketRefCount++;

    safeSetSocket(s);
    safeSetConnected(s.connected);

    const onConnect = () => safeSetConnected(true);
    const onDisconnect = (reason) => {
      safeSetConnected(false);
      if (reason === 'io server disconnect') s.connect();
    };
    const onConnectError = () => safeSetConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    if (!s.connected) s.connect();

    return () => {
      unmounted = true;
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      globalSocketRefCount = Math.max(0, globalSocketRefCount - 1);
      if (globalSocketRefCount === 0) {
        globalDestroyTimer = setTimeout(() => {
          if (globalSocketRefCount === 0) destroyGlobalSocket();
        }, SOCKET_DESTROY_GRACE_MS);
      }
    };
  }, [isAuthenticated]);

  return { socket, isConnected };
};
