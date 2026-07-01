// Public surface of the support-ticket feature. Import from '@features/support'.
// NOTE: distinct from the buyer↔seller order chat (@features/chat).

// Components
export { default as SupportPage } from './components/SupportPage';
export { default as SupportChatWidget } from './components/SupportChatWidget';
export { default as SupportChatPopup } from './components/SupportChatPopup';
export { default as MessageList } from './components/MessageList';
export { default as ChatInput } from './components/ChatInput';
export { default as PresenceBar } from './components/PresenceBar';
export { default as CannedResponsesManager } from './components/CannedResponsesManager';
export { PriorityBadge, StatusBadge } from './components/badges';

// Hooks
export { useSupportThread } from './hooks/useSupportThread';
export { useSupportUnread } from './hooks/useSupportUnread';
export { useUserPresence } from './hooks/useUserPresence';

// Utils (genClientId, labels, grouping, filter/category constants, etc.)
export * from './utils/supportChat';
