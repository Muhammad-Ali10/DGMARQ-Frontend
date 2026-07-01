import { Wifi } from 'lucide-react';
import { useUserPresence } from '../hooks/useUserPresence';

/**
 * Thin status strip above the message list. Shows the other party's online dot
 * + an expected-response hint, and a "Reconnecting…" notice when the socket is
 * down. `userId` is the person whose presence to watch (assigned admin for the
 * customer view; the customer for the admin view).
 */
const PresenceBar = ({
  userId,
  name = 'Support',
  connected = true,
  onlineText = 'Usually responds within minutes',
  offlineText = "Support is offline — we'll reply when back",
}) => {
  const online = useUserPresence(userId);

  if (!connected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 border-b border-amber-700/40 text-amber-200 text-xs">
        <Wifi className="h-3.5 w-3.5 animate-pulse" />
        Reconnecting…
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 border-b border-gray-700/60 text-xs">
      <span className={`h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-gray-500'}`} />
      <span className="text-gray-200 font-medium">{name}</span>
      <span className="text-gray-500">· {online ? onlineText : offlineText}</span>
    </div>
  );
};

export default PresenceBar;
