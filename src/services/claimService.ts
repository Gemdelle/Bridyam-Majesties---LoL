// API configuration
const API_BASE_URL = 'http://localhost:8080';

// Types
export interface ClaimRequest {
  code: string;
  rankedUsername: string;
}

export interface ClaimResponse {
  success: boolean;
  message: string;
  rankedUsername?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

// Claim service class
export class ClaimService {
  private static instance: ClaimService;

  private constructor() {}

  public static getInstance(): ClaimService {
    if (!ClaimService.instance) {
      ClaimService.instance = new ClaimService();
    }
    return ClaimService.instance;
  }

  // Get auth token from localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Claim account method
  async claimAccount(claimData: ClaimRequest): Promise<ClaimResponse> {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        return {
          success: false,
          message: 'Authentication required. Please login first.',
        };
      }

      const response = await fetch(`${API_BASE_URL}/claim/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(claimData),
      });

      const data: ClaimResponse = await response.json();

      if (response.ok && data.success) {
        return data;
      } else {
        return {
          success: false,
          message: data.message || 'Failed to claim account',
        };
      }
    } catch (error) {
      console.error('Claim account error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Validate claim data
  validateClaimData(code: string, rankedUsername: string): string[] {
    const errors: string[] = [];
    
    // Validate code
    if (!code || code.length !== 8) {
      errors.push('El código debe tener exactamente 8 caracteres');
    }
    
    if (!/^[A-Za-z0-9]{8}$/.test(code)) {
      errors.push('El código solo puede contener letras y números');
    }
    
    // Validate username
    if (!rankedUsername || rankedUsername.trim() === '') {
      errors.push('El username del ranked es requerido');
    }
    
    return errors;
  }
}

// Export singleton instance
export const claimService = ClaimService.getInstance(); 