import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, within, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';

vi.mock('@services/api', () => ({
  chatAPI: {
    getConversations: vi.fn(),
    getMessages: vi.fn(),
    toggleBlock: vi.fn(),
    markAsRead: vi.fn(),
    sendMessage: vi.fn(),
  },
}));
const stubs = vi.hoisted(() => ({
  socket: { socket: null, isConnected: false },
}));
vi.mock('@hooks/useSocket', () => ({ useSocket: () => stubs.socket }));

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
    expect(chatAPI.toggleBlock).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: /^block$/i }));
    await waitFor(() => expect(chatAPI.toggleBlock).toHaveBeenCalledWith('conv-1'));
  });
});

describe('ChatPage send fallback', () => {
  afterEach(() => { stubs.socket = { socket: null, isConnected: false }; });

  const timedOutSocket = () => ({
    connected: true,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    timeout: () => ({ emit: (_event, _payload, cb) => cb(new Error('timeout')) }),
  });

  const sendText = async (text) => {
    renderChat(conversation());
    const input = await screen.findByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: text } });
    fireEvent.submit(input.closest('form'));
  };

  it('does not resend over REST when the timed-out socket message was already saved', async () => {
    stubs.socket = { socket: timedOutSocket(), isConnected: true };
    chatAPI.getMessages.mockImplementation((_id, params) => Promise.resolve({
      data: { data: params?.limit === 5
        ? { messages: [{ _id: 'srv-1', senderId: { _id: ME }, messageText: 'Is the key region free?', sentAt: new Date().toISOString() }] }
        : { messages: [], hasMore: false } },
    }));

    await sendText('Is the key region free?');

    await waitFor(() => expect(chatAPI.getMessages).toHaveBeenCalledWith('conv-1', { limit: 5 }));
    expect(chatAPI.sendMessage).not.toHaveBeenCalled();
  });

  it('resends over REST when the timed-out socket message never reached the server', async () => {
    stubs.socket = { socket: timedOutSocket(), isConnected: true };
    chatAPI.sendMessage.mockImplementation(() => Promise.resolve({ data: { data: { _id: 'srv-2', senderId: { _id: ME }, messageText: 'Hello?' } } }));

    await sendText('Hello?');

    await waitFor(() => expect(chatAPI.sendMessage).toHaveBeenCalledWith({ conversationId: 'conv-1', messageText: 'Hello?' }));
  });
});
