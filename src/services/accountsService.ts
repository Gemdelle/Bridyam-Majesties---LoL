// API configuration
const API_BASE_URL = 'http://localhost:8080';

// Types
export interface Account {
  url: string;
  id: number;
  name: string;
  username: string;
  champions: number;
  skins: number;
  masteries: number;
  solo_q_elo: string;
  roles: {
    top: number;
    jungle: number;
    mid: number;
    adc: number;
    support: number;
  };
  blueEssence: number;
  orangeEssence: number;
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

// Accounts service class
export class AccountsService {
  private static instance: AccountsService;

  private constructor() {}

  public static getInstance(): AccountsService {
    if (!AccountsService.instance) {
      AccountsService.instance = new AccountsService();
    }
    return AccountsService.instance;
  }

  // Get auth token from localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Fetches all accounts from the API
   * @returns Promise<Account[]> - Array of all accounts
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required. Please login first.');
      }

      const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data: AccountsResponse = await response.json();
      
      if (!data.accounts || !Array.isArray(data.accounts)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }
      
      return data.accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  /**
   * Helper method to extract rank and tier from solo_q_elo string
   * @param eloString - The elo string (e.g., "EMERALD 4")
   * @returns Object with rank and tier
   */
  parseElo(eloString: string): { rank: string; tier: string } {
    const parts = eloString.split(' ');
    if (parts.length >= 2) {
      return {
        rank: parts[0].toLowerCase(),
        tier: parts[1]
      };
    }
    return {
      rank: '',
      tier: ''
    };
  }

  /**
   * Get accounts filtered by rank
   * @param accounts - Array of accounts
   * @param rank - Rank to filter by
   * @returns Filtered accounts
   */
  getAccountsByRank(accounts: Account[], rank: string): Account[] {
    return accounts.filter(account => {
      const { rank: accountRank } = this.parseElo(account.solo_q_elo);
      return accountRank === rank.toLowerCase();
    });
  }

  /**
   * Get accounts filtered by tier
   * @param accounts - Array of accounts
   * @param tier - Tier to filter by
   * @returns Filtered accounts
   */
  getAccountsByTier(accounts: Account[], tier: string): Account[] {
    return accounts.filter(account => {
      const { tier: accountTier } = this.parseElo(account.solo_q_elo);
      return accountTier === tier;
    });
  }

  /**
   * Get accounts filtered by name/portrait
   * @param accounts - Array of accounts
   * @param name - Name to filter by
   * @returns Filtered accounts
   */
  getAccountsByName(accounts: Account[], name: string): Account[] {
    return accounts.filter(account => 
      account.name.toLowerCase().includes(name.toLowerCase())
    );
  }
}

export default AccountsService; 