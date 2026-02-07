import { Skeleton } from '../ui/skeleton';

const ChatMessageSkeleton = ({ isOwn }) => (
  <div className={`flex gap-3 mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
    {!isOwn && (
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
    )}
    <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
      {!isOwn && <Skeleton className="h-3 w-16 mb-1" />}
      <Skeleton className="h-12 w-48 rounded-lg" />
      <Skeleton className="h-3 w-12 mt-1" />
    </div>
  </div>
);

export default ChatMessageSkeleton;
