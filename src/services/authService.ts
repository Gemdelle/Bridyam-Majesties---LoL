// API configuration
const API_BASE_URL = 'https://bridyam-majesties-back-production.up.railway.app';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt: string;
  authProvider: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  errors?: string[];
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

// Auth service class
export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login method
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.success && data.token) {
        // Store token in localStorage and instance
        this.token = data.token;
        localStorage.setItem('auth_token', data.token);

        // Store user data
        if (data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.user));
        }

        return data;
      } else {
        return data;
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
        errors: ['Connection failed']
      };
    }
  }

  // Register method
  async register(userData: { email: string; password: string; name?: string; birthDate?: string }): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.success && data.token) {
        // Store token in localStorage and instance
        this.token = data.token;
        localStorage.setItem('auth_token', data.token);

        // Store user data
        if (data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.user));
        }

        return data;
      } else {
        return data;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
        errors: ['Connection failed']
      };
    }
  }

  // Logout method
  async logout(): Promise<boolean> {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token and user data regardless of API call success
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
    return true;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Validate token with backend
  async validateToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        return true;
      } else {
        // Token is invalid, clear it
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Get profile from backend
  async getProfile(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.user || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!this.token) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Helper method to make authenticated requests
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`,
      },
    });
  }
}

// Export singleton instance
export const authService = AuthService.getInstance(); 