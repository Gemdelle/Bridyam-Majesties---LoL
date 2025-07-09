import { useState, useEffect } from 'react';
import { authService, type User } from '../services/authService';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
  });

  const updateAuthState = (user: User | null, token: string | null) => {
    setAuthState({
      user,
      token,
      isAuthenticated: !!token,
      isLoading: false,
      isInitialized: true,
    });
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.token && response.user) {
        updateAuthState(response.user, response.token);
        return { success: true, message: response.message };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authService.logout();
      updateAuthState(null, null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      updateAuthState(null, null);
    }
  };

  const validateToken = async () => {
    const token = authService.getToken();
    
    if (!token) {
      updateAuthState(null, null);
      return false;
    }

    try {
      const isValid = await authService.validateToken();
      
      if (isValid) {
        const user = authService.getCurrentUser();
        updateAuthState(user, token);
        return true;
      } else {
        updateAuthState(null, null);
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      updateAuthState(null, null);
      return false;
    }
  };

  const refreshProfile = async () => {
    try {
      const user = await authService.getProfile();
      if (user) {
        setAuthState(prev => ({ ...prev, user }));
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authService.getToken();
      const user = authService.getCurrentUser();
      
      if (token && user) {
        // Validate token with backend
        const isValid = await validateToken();
        if (!isValid) {
          // Token is invalid, user needs to log in again
          updateAuthState(null, null);
        }
      } else {
        updateAuthState(null, null);
      }
    };

    initializeAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    validateToken,
    refreshProfile,
  };
}; 