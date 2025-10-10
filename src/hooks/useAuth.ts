import { useState, useEffect } from 'react';
import { authService, type User } from '../services/authService';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

// Hook for making authenticated requests with automatic error handling
export const useAuthenticatedRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.makeAuthenticatedRequestWithHandling(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication failed') {
        // Token expired, redirect to login
        window.location.href = '/login';
        return null;
      }
      
      setError(error instanceof Error ? error.message : 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { makeRequest, isLoading, error };
};

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

  const login = async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authService.login({ username, password });
      
      if (response.success && response.token && response.user) {
        updateAuthState(response.user, response.token);
        return { success: true, message: response.message };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
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

  const validateToken = async (force: boolean = false) => {
    const token = authService.getToken();
    
    if (!token) {
      updateAuthState(null, null);
      return false;
    }

    try {
      const isValid = force 
        ? await authService.forceValidateToken()
        : await authService.validateToken();
      
      if (isValid) {
        const user = authService.getCurrentUser();
        updateAuthState(user, token);
        return true;
      } else {
        // Only clear state if token is actually invalid (not just network error)
        // The authService will handle actual token invalidation
        const user = authService.getCurrentUser();
        if (user) {
          // If we still have user data, token might be valid but validation failed due to network
          updateAuthState(user, token);
          return true;
        } else {
          updateAuthState(null, null);
          return false;
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
      // On error, keep current state if we have user data
      const user = authService.getCurrentUser();
      if (user && token) {
        updateAuthState(user, token);
        return true;
      } else {
        updateAuthState(null, null);
        return false;
      }
    }
  };

  const refreshProfile = async () => {
    try {
      const user = await authService.getProfile();
      if (user) {
        // Create a new user object to ensure React detects the change
        const updatedUser = { ...user };
        
        // Update state
        setAuthState(prev => ({ 
          ...prev, 
          user: updatedUser 
        }));
        
        // Update localStorage to keep it in sync
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        console.log('Profile refreshed successfully:', updatedUser);
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  // Force token validation (bypass cache)
  const forceValidateToken = async () => {
    return validateToken(true);
  };

  // Initialize auth state on mount (with reduced validation frequency)
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authService.getToken();
      const user = authService.getCurrentUser();
      
      if (token && user) {
        // Only validate if we don't have recent validation cache
        // This reduces unnecessary API calls
        const isValid = await validateToken(false);
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
    forceValidateToken,
    refreshProfile,
  };
}; 