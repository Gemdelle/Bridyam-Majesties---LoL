// LOCAL MODE: Claim functionality disabled

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

  // LOCAL MODE: Claim account method (disabled)
  async claimAccount(claimData: ClaimRequest): Promise<ClaimResponse> {
    console.log('LOCAL MODE: claimAccount is disabled');
    return {
      success: false,
      message: 'LOCAL MODE: Claiming accounts is disabled. Edit rankeds.json directly.',
    };
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