import ChatPage from '../../components/chat/ChatPage';

// Thin wrapper: all seller-chat behavior lives in the shared ChatPage component,
// parameterized by role. Kept at this path with a default export so the lazy
// import in App.jsx keeps working unchanged.
const SellerChat = () => <ChatPage role="seller" />;

export default SellerChat;
