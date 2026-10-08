export const genClientId = () =>
  `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const isMineForSide = (msg, side) =>
  side === 'admin' ? msg?.senderType === 'admin' : msg?.senderType !== 'admin';

const toDate = (value) => (value instanceof Date ? value : new Date(value));

export const sameDay = (a, b) => {
  if (!a || !b) return false;
  const da = toDate(a);
  const db = toDate(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

export const dayLabel = (value) => {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

export const timeLabel = (value) => {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_customer', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'unassigned', label: 'Unassigned' },
];
export const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];
export const STATUS_OPTIONS = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];

export const SUPPORT_CATEGORIES = [
  'Order Issue', 'Payment Problem', 'Account Issue', 'Product Question',
  'Key Not Working', 'Refund Request', 'Bug Report', 'Other',
];

const GROUP_WINDOW_MS = 5 * 60 * 1000;
export const isGroupedWith = (msg, prev) => {
  if (!prev || !msg) return false;
  if (msg.senderType !== prev.senderType) return false;
  if (msg.messageType === 'system' || prev.messageType === 'system') return false;
  const a = toDate(msg.sentAt || msg.createdAt).getTime();
  const b = toDate(prev.sentAt || prev.createdAt).getTime();
  if (!sameDay(a, b)) return false;
  return Math.abs(a - b) <= GROUP_WINDOW_MS;
};
