import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

// Module-level singleton: ONE socket shared by every consumer (Chat pages,
// notification hooks, presence). Ref-counted so it survives route changes and
// is torn down shortly after the last consumer unmounts.
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
    // Auth travels via the httpOnly accessToken cookie (withCredentials).
    auth: {},
    transports: ['polling', 'websocket'],
    upgrade: true,
    rememberUpgrade: true,
    reconnection: true,
    randomizationFactor: 0.5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // FIX: was 3 — after 3 failed attempts the socket gave up FOREVER, so a
    // brief network blip permanently killed real-time until a manual refresh.
    // Keep retrying indefinitely (capped backoff) so it self-heals.
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

/**
 * Shared Socket.IO connection.
 *
 * FIX (real-time chat): previously only the consumer that CREATED the socket
 * registered connect/disconnect listeners — every other consumer that reused
 * the singleton kept a stale `isConnected` and never re-rendered when the socket
 * (re)connected. That silently prevented the Chat page's `new_message` listener
 * and the notification hooks' `notification_new` listener from ever wiring up
 * (→ "must refresh", no bell, no sound). Now EVERY consumer:
 *   - gets the live socket via state (so it re-renders when it becomes available),
 *   - registers its OWN connect/disconnect/reconnect listeners (accurate
 *     `isConnected` for everyone), and
 *   - cleans them up on unmount.
 */
export const useSocket = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(globalSocket);
  const [isConnected, setIsConnected] = useState(Boolean(globalSocket?.connected));

  useEffect(() => {
    let unmounted = false;
    const safeSetConnected = (v) => { if (!unmounted) setIsConnected(v); };
    const safeSetSocket = (s) => { if (!unmounted) setSocket(s); };

    // Logged out → tear everything down.
    if (!isAuthenticated) {
      destroyGlobalSocket();
      globalSocketRefCount = 0;
      safeSetSocket(null);
      safeSetConnected(false);
      return;
    }

    // Cancel any pending teardown from a previous unmount.
    if (globalDestroyTimer) {
      clearTimeout(globalDestroyTimer);
      globalDestroyTimer = null;
    }

    // Create the singleton on first use.
    if (!globalSocket) {
      globalSocket = createGlobalSocket();
    }
    const s = globalSocket;
    globalSocketRefCount++;

    // Make THIS consumer see the socket + current connection state immediately.
    safeSetSocket(s);
    safeSetConnected(s.connected);

    // Per-instance connection listeners — the core fix.
    const onConnect = () => safeSetConnected(true); // fires on initial AND reconnect (v4)
    const onDisconnect = (reason) => {
      safeSetConnected(false);
      // Server forced the disconnect → client must explicitly reconnect.
      if (reason === 'io server disconnect') s.connect();
    };
    const onConnectError = () => safeSetConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    // Ensure we're actually attempting to connect (covers a reused, idle socket).
    if (!s.connected) s.connect();

    return () => {
      unmounted = true;
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      globalSocketRefCount = Math.max(0, globalSocketRefCount - 1);
      if (globalSocketRefCount === 0) {
        // Defer teardown to avoid thrash on route changes / strict-mode remounts.
        globalDestroyTimer = setTimeout(() => {
          if (globalSocketRefCount === 0) destroyGlobalSocket();
        }, SOCKET_DESTROY_GRACE_MS);
      }
    };
  }, [isAuthenticated]);

  return { socket, isConnected };
};
