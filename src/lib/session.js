import { store } from '@store/store';
import { logout } from '@store/slices/authSlice';
import { queryClient } from './queryClient';

export const SESSION_SCOPED_FLAGS = ['allowCustomerAccess'];

export const endSession = () => {
  store.dispatch(logout());
  queryClient.clear();
  try {
    SESSION_SCOPED_FLAGS.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    return;
  }
};
