import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@services/api';
import { endSession } from '@lib/session';

export const useLogout = ({ onDone } = {}) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authAPI.logout(),
    onSettled: () => {
      endSession();
      onDone?.();
      navigate('/');
    },
  });
};

export default useLogout;
