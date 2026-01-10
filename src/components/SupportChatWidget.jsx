import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MessageCircle, X } from 'lucide-react';
import SupportChatPopup from './SupportChatPopup';

const SupportChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleIconClick = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Support Chat Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleIconClick}
          className="relative bg-accent hover:bg-accent/90 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
          aria-label="Open support chat"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Support Chat Popup */}
      {isAuthenticated && isOpen && (
        <SupportChatPopup
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onUnreadCountChange={setUnreadCount}
        />
      )}
    </>
  );
};

export default SupportChatWidget;

