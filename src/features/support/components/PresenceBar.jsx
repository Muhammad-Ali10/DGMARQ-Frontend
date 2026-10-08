import { Wifi } from 'lucide-react';
import { useUserPresence } from '../hooks/useUserPresence';

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
    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2/60 border-b border-brand-cyan/10 text-xs">
      <span className={`h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-gray-500'}`} />
      <span className="text-fg font-medium">{name}</span>
      <span className="text-fg-subtle">· {online ? onlineText : offlineText}</span>
    </div>
  );
};

export default PresenceBar;
