/**
 * Animated 3-dot "is typing" indicator. `label` is e.g. "Admin" or "Customer".
 */
const TypingIndicator = ({ label = 'Support' }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-fg-muted animate-in fade-in duration-200">
    <span className="flex gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
    </span>
    <span>{label} is typing…</span>
  </div>
);

export default TypingIndicator;
