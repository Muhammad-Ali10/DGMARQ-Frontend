import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';

// ChatPage pulls in a socket, notifications and an infinite message query; none of
// that is under test here. The block/unblock control is.
vi.mock('@services/api', () => ({
  chatAPI: {
    getConversations: vi.fn(),
    getMessages: vi.fn(),
    toggleBlock: vi.fn(),
    markAsRead: vi.fn(),
  },
}));
// Both return STABLE identities: ChatPage has effects keyed on these, and a fresh
// function per render turns them into a render loop.
const stubs = vi.hoisted(() => ({
  socket: { socket: null, isConnected: false },
  markNotificationAsRead: vi.fn(),
}));
vi.mock('@hooks/useSocket', () => ({ useSocket: () => stubs.socket }));
vi.mock('../hooks/useChatNotifications', () => ({
  useChatNotifications: () => ({ markNotificationAsRead: stubs.markNotificationAsRead }),
}));

const { chatAPI } = await import('@services/api');

const ME = 'user-me';
const THEM = 'user-them';
const signedIn = { auth: { isAuthenticated: true, user: { _id: ME } } };

const conversation = (overrides = {}) => ({
  _id: 'conv-1',
  status: 'active',
  blockedBy: null,
  sellerId: { shopName: 'Pixel Keys' },
  buyerId: { name: 'A Buyer' },
  orderId: { _id: 'order-9', totalAmount: 20 },
  unreadCountBuyer: 0,
  lastMessage: 'Hello',
  ...overrides,
});

// The module keeps a 2s per-role conversations cache, so each test gets a fresh
// copy of the module rather than the previous test's list.
let ChatPage;
beforeEach(async () => {
  vi.clearAllMocks();
  chatAPI.getMessages.mockResolvedValue({ data: { data: { messages: [], hasMore: false } } });
  chatAPI.toggleBlock.mockResolvedValue({
    data: { data: { conversationId: 'conv-1', status: 'blocked', blockedBy: ME } },
  });
  vi.resetModules();
  ChatPage = (await import('./ChatPage')).default;
});

const renderChat = (conv, role = 'buyer') => {
  chatAPI.getConversations.mockResolvedValue({ data: { data: [conv] } });
  return renderWithProviders(<ChatPage role={role} />, {
    route: `/${role === 'buyer' ? 'user' : 'seller'}/chat?conversation=conv-1`,
    preloadedState: signedIn,
  });
};

describe('ChatPage block controls', () => {
  // THE CLIENT BUG: the conversations endpoint did not return `blockedBy`, so this
  // button was hidden from everyone — including the participant who blocked the
  // thread and is the only one allowed to lift it.
  it('offers Unblock to the participant who blocked the conversation', async () => {
    renderChat(conversation({ status: 'blocked', blockedBy: ME }));

    expect(await screen.findByRole('button', { name: /unblock/i })).toBeInTheDocument();
    expect(await screen.findByText(/Click Unblock above to resume messaging/i)).toBeInTheDocument();
  });

  it('does not offer Unblock to the party who was blocked', async () => {
    renderChat(conversation({ status: 'blocked', blockedBy: THEM }));

    expect(await screen.findByText(/The other party has blocked this conversation/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /unblock/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^block$/i })).not.toBeInTheDocument();
  });

  // Only the blocker can lift a block, so without this the other party is simply
  // stuck: no button, no explanation of what still works.
  it('shows the blocked buyer a refund and a support route', async () => {
    renderChat(conversation({ status: 'blocked', blockedBy: THEM }));

    expect(await screen.findByRole('link', { name: /refund request on the order/i })).toHaveAttribute(
      'href',
      '/user/orders/order-9',
    );
    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute('href', '/buyer-support');
  });

  it('sends a blocked seller to seller support, with no refund route', async () => {
    renderChat(conversation({ status: 'blocked', blockedBy: THEM, unreadCountSeller: 0 }), 'seller');

    expect(await screen.findByRole('link', { name: /contact support/i })).toHaveAttribute('href', '/seller-support');
    expect(screen.queryByRole('link', { name: /refund request/i })).not.toBeInTheDocument();
  });

  it('does not offer the escape routes to the participant who did the blocking', async () => {
    renderChat(conversation({ status: 'blocked', blockedBy: ME }));

    expect(await screen.findByText(/Click Unblock above to resume messaging/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /contact support/i })).not.toBeInTheDocument();
  });

  it('marks a blocked thread in the conversation list', async () => {
    renderChat(conversation({ status: 'blocked', blockedBy: THEM }));

    const row = await screen.findByRole('button', { name: /Pixel Keys/ });
    expect(within(row).getByText('Blocked')).toBeInTheDocument();
  });

  it('confirms in a dialog before blocking, then calls the API', async () => {
    renderChat(conversation());

    fireEvent.click(await screen.findByRole('button', { name: /^block$/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Block this conversation?')).toBeInTheDocument();
    // The dialog is the gate: nothing happens until it is confirmed.
    expect(chatAPI.toggleBlock).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: /^block$/i }));
    await waitFor(() => expect(chatAPI.toggleBlock).toHaveBeenCalledWith('conv-1'));
  });
});
