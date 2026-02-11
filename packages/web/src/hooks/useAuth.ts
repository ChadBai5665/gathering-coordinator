import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

/**
 * 认证 Hook
 * 包装 auth store，自动从 localStorage 加载状态
 */
export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    setAuth,
    loadFromStorage,
  } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    setAuth,
  };
}
