import { ChatPage } from '@features/chat';

// Thin wrapper: all buyer-chat behavior lives in the shared ChatPage component,
// parameterized by role. Kept at this path with a default export so the lazy
// import in App.jsx keeps working unchanged.
const UserChat = () => <ChatPage role="buyer" />;

export default UserChat;
