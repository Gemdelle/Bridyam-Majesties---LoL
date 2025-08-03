// API configuration
const API_BASE_URL = 'http://localhost:8080';

// Types
export interface LoginRequest {
  username: string;
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
  private lastValidationTime: number = 0;
  private validationCacheDuration: number = 5 * 60 * 1000; // 5 minutos en ms
  private isValidationInProgress: boolean = false;

  private constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    // Load last validation time from localStorage
    const lastValidation = localStorage.getItem('last_validation_time');
    if (lastValidation) {
      this.lastValidationTime = parseInt(lastValidation);
    }
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

        // Reset validation cache on successful login
        this.lastValidationTime = Date.now();
        localStorage.setItem('last_validation_time', this.lastValidationTime.toString());

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

        // Reset validation cache on successful registration
        this.lastValidationTime = Date.now();
        localStorage.setItem('last_validation_time', this.lastValidationTime.toString());

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
      this.lastValidationTime = 0;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('last_validation_time');
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

  // Check if validation cache is still valid
  private isValidationCacheValid(): boolean {
    const now = Date.now();
    return (now - this.lastValidationTime) < this.validationCacheDuration;
  }

  // Validate token with backend (with improved error handling and caching)
  async validateToken(): Promise<boolean> {
    if (!this.token) return false;

    // Check if we have a recent validation cache
    if (this.isValidationCacheValid()) {
      return true;
    }

    // Prevent multiple simultaneous validations
    if (this.isValidationInProgress) {
      // Wait for the current validation to complete
      while (this.isValidationInProgress) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.isValidationCacheValid();
    }

    this.isValidationInProgress = true;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        // Token is valid, update cache
        this.lastValidationTime = Date.now();
        localStorage.setItem('last_validation_time', this.lastValidationTime.toString());
        return true;
      } else if (response.status === 401 || response.status === 403) {
        // Token is actually invalid, clear it
        console.log('Token validation failed: token is invalid');
        this.logout();
        return false;
      } else {
        // Other HTTP errors (500, 502, etc.) - don't logout, just return false
        console.warn('Token validation failed with status:', response.status);
        return false;
      }
    } catch (error) {
      // Network errors - don't logout, just return false
      console.error('Token validation network error:', error);
      return false;
    } finally {
      this.isValidationInProgress = false;
    }
  }

  // Force validate token (bypass cache)
  async forceValidateToken(): Promise<boolean> {
    this.lastValidationTime = 0; // Clear cache
    localStorage.removeItem('last_validation_time');
    return this.validateToken();
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

  // Helper method to handle authenticated request responses
  async handleAuthenticatedResponse(response: Response): Promise<Response> {
    if (response.status === 401 || response.status === 403) {
      // Token is invalid, clear it
      console.log('Authentication failed, clearing token');
      this.logout();
      throw new Error('Authentication failed');
    }
    return response;
  }

  // Enhanced method for making authenticated requests with automatic error handling
  async makeAuthenticatedRequestWithHandling(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await this.makeAuthenticatedRequest(url, options);
    return this.handleAuthenticatedResponse(response);
  }
}

// Export singleton instance
export const authService = AuthService.getInstance(); 