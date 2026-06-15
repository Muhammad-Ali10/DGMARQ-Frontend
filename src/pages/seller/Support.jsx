import SupportPage from '../../components/support/SupportPage';

const SellerSupport = () => (
  <SupportPage
    chatsQueryKey="seller-support-chats"
    chatsQueryOptions={{ staleTime: 30000, refetchOnWindowFocus: false }}
  />
);

export default SellerSupport;
