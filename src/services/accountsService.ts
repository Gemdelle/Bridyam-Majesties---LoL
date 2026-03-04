// LOCAL MODE: Accounts loaded from local JSON

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
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

// Interface for local ranked data
interface LocalRankedData {
  id: number;
  name: string;
  username: string;
  bloodline: string;
  essencer: string;
  champions: number;
  skins: number;
  masteries: number;
  level: number;
  icon: string;
  elo_soloq: { tier: string; division: number };
  rol: { top: number; jungle: number; mid: number; adc: number; support: number };
}

// Accounts service class
export class AccountsService {
  private static instance: AccountsService;

  private constructor() { }

  public static getInstance(): AccountsService {
    if (!AccountsService.instance) {
      AccountsService.instance = new AccountsService();
    }
    return AccountsService.instance;
  }

  /**
   * LOCAL MODE: Fetches all accounts from local JSON
   * @returns Promise<Account[]> - Array of all accounts
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await fetch('/data/rankeds.json');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rankedData: LocalRankedData[] = await response.json();

      const accounts: Account[] = rankedData.map(ranked => ({
        url: ranked.icon,
        id: ranked.id,
        name: ranked.essencer !== '-' ? ranked.essencer : ranked.bloodline,
        username: ranked.username,
        champions: ranked.champions,
        skins: ranked.skins,
        masteries: ranked.masteries,
        solo_q_elo: ranked.elo_soloq.tier !== 'unranked'
          ? `${ranked.elo_soloq.tier.toUpperCase()} ${ranked.elo_soloq.division}`
          : 'UNRANKED',
        roles: {
          top: ranked.rol.top,
          jungle: ranked.rol.jungle,
          mid: ranked.rol.mid,
          adc: ranked.rol.adc,
          support: ranked.rol.support
        }
      }));

      console.log('LOCAL MODE: Cuentas cargadas:', accounts.length);
      return accounts;
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