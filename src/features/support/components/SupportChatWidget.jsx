import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MessageCircle, X } from 'lucide-react';
import { useSupportUnread } from '../hooks/useSupportUnread';
const SupportChatPopup = lazy(() => import('./SupportChatPopup'));

const SupportChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useSupportUnread();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleIconClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className="fixed bottom-[7.5rem] md:bottom-6 right-6 z-50">
        <button
          onClick={handleIconClick}
          className="relative bg-accent hover:bg-accent/90 text-fg rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
          aria-label="Open support chat"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-fg text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {isAuthenticated && isOpen && (
        <Suspense fallback={null}>
          <SupportChatPopup
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
};

export default SupportChatWidget;

