import { useSafeAuth } from '../contexts/AuthContext';
import { User } from '../utils/api';

export interface UseAuthUserReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthority: boolean;
  isCitizen: boolean;
  updateRole: (role: 'citizen' | 'authority') => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthUser = (): UseAuthUserReturn => {
  // Use safe auth first to prevent errors during initialization
  const safeAuth = useSafeAuth();

  // If safe auth returns null, return loading state
  if (!safeAuth) {
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isAuthority: false,
      isCitizen: false,
      updateRole: async () => {},
      refreshUser: async () => {},
    };
  }

  const {
    user,
    isLoading,
    isAuthority,
    isCitizen,
    updateUserRole,
    refreshUser
  } = safeAuth;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAuthority,
    isCitizen,
    updateRole: updateUserRole,
    refreshUser,
  };
};
