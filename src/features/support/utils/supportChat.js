/**
 * Shared helpers for the support-chat module (used by the user, seller, admin
 * and popup chat UIs via useSupportThread / MessageList).
 */

// A throwaway id for optimistic messages, echoed to the server as `clientId`
// so the saved message can be reconciled back to its temporary bubble.
export const genClientId = () =>
  `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

// "Mine" depends on which side of the conversation is viewing it:
//  - admin side  → only admin messages are mine
//  - customer side → anything that isn't an admin message (user OR guest)
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

// "Today" / "Yesterday" / "June 8, 2026" — used for the date separators.
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

// Two messages are "grouped" when they're from the same sender, on the same
// day, and within a few minutes of each other (tighter spacing, no repeated
// name). Keeps consecutive bursts visually compact.
// Admin ticket-list filter tabs and the priority/status option lists. Kept here
// (a non-component module) so the badge components file can stay fast-refresh-safe.
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
