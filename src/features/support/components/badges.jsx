const PRIORITY_STYLES = {
  low: 'bg-green-900/40 text-success border-green-700/50',
  medium: 'bg-yellow-900/40 text-warning border-yellow-700/50',
  high: 'bg-orange-900/40 text-warning border-orange-700/50',
  urgent: 'bg-red-900/50 text-danger border-red-600/60',
};

const STATUS_META = {
  open: { label: 'Open', cls: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
  in_progress: { label: 'In Progress', cls: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50' },
  pending: { label: 'In Progress', cls: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50' },
  waiting_customer: { label: 'Waiting Customer', cls: 'bg-amber-900/40 text-warning border-amber-700/50' },
  resolved: { label: 'Resolved', cls: 'bg-green-900/40 text-success border-green-700/50' },
  closed: { label: 'Closed', cls: 'bg-surface-2/50 text-fg-muted border-border-interactive/50' },
};

const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize';

export const PriorityBadge = ({ priority }) => {
  const cls = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;
  return <span className={`${base} ${cls}`}>{priority || 'low'}</span>;
};

export const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.open;
  return <span className={`${base} ${meta.cls}`}>{meta.label}</span>;
};
