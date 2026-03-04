// import { authService } from './authService'; // DISABLED - Local mode

// Interface for the ranked data structure
export interface RankedData {
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
    wins: {
        current: number;
        totals: number;
    };
    missions: {
        current_act: {
            current: number;
            totals: number;
        };
        current_hall_of_legends: {
            current: number;
            totals: number;
        };
    };
    elo_soloq: {
        tier: string;
        division: number;
    };
    elo_flex: {
        tier: string;
        division: number;
    };
    honor: number;
    rol: {
        top: number;
        jungle: number;
        mid: number;
        adc: number;
        support: number;
    };
    blue_essence: number;
    orange_essence: number;
}

// Interface for the API response
export interface RankedResponse {
    ranked: RankedData[];
}

// LOCAL MODE: Fetch ranked data from local JSON
export const fetchRankedData = async (): Promise<RankedData[]> => {
    try {
        const response = await fetch('/data/rankeds.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: RankedData[] = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching ranked data:', error);
        throw new Error('Failed to fetch ranked data');
    }
};

// Helper function to compare two RankedData objects and detect changes
export const getChangedRankedData = (originalData: RankedData[], modifiedData: RankedData[]): RankedData[] => {
    const changedItems: RankedData[] = [];
    
    for (const modified of modifiedData) {
        const original = originalData.find(item => item.id === modified.id);
        
        if (!original) {
            // New item, include it
            changedItems.push(modified);
            continue;
        }
        
        // Deep comparison to detect changes
        const hasChanges = 
            original.name !== modified.name ||
            original.username !== modified.username ||
            original.bloodline !== modified.bloodline ||
            original.champions !== modified.champions ||
            original.skins !== modified.skins ||
            original.masteries !== modified.masteries ||
            original.level !== modified.level ||
            original.icon !== modified.icon ||
            original.wins.current !== modified.wins.current ||
            original.wins.totals !== modified.wins.totals ||
            original.missions.current_act.current !== modified.missions.current_act.current ||
            original.missions.current_act.totals !== modified.missions.current_act.totals ||
            original.missions.current_hall_of_legends.current !== modified.missions.current_hall_of_legends.current ||
            original.missions.current_hall_of_legends.totals !== modified.missions.current_hall_of_legends.totals ||
            original.elo_soloq.tier !== modified.elo_soloq.tier ||
            original.elo_soloq.division !== modified.elo_soloq.division ||
            original.elo_flex.tier !== modified.elo_flex.tier ||
            original.elo_flex.division !== modified.elo_flex.division ||
            original.honor !== modified.honor ||
            original.rol.top !== modified.rol.top ||
            original.rol.jungle !== modified.rol.jungle ||
            original.rol.mid !== modified.rol.mid ||
            original.rol.adc !== modified.rol.adc ||
            original.rol.support !== modified.rol.support ||
            original.blue_essence !== modified.blue_essence ||
            original.orange_essence !== modified.orange_essence;
        
        if (hasChanges) {
            changedItems.push(modified);
        }
    }
    
    return changedItems;
};

// DISABLED - Local mode: Update ranked data via PUT to API
// To update data, edit public/data/rankeds.json directly
export const updateRankedData = async (modifiedRankedData: RankedData[]): Promise<RankedData[]> => {
    console.log('LOCAL MODE: updateRankedData is disabled. Edit public/data/rankeds.json directly.');
    return modifiedRankedData;
};

// DISABLED - Local mode: Update only changed ranked data
export const updateChangedRankedData = async (originalData: RankedData[], modifiedData: RankedData[]): Promise<RankedData[]> => {
    console.log('LOCAL MODE: updateChangedRankedData is disabled. Edit public/data/rankeds.json directly.');
    return modifiedData;
};

// Fetch ranked data by bloodline
export const fetchRankedDataByBloodline = async (bloodline: string): Promise<RankedData[]> => {
    const allData = await fetchRankedData();
    return allData.filter(item => item.bloodline.toLowerCase() === bloodline.toLowerCase());
};

// Fetch ranked data by ID
export const fetchRankedDataById = async (id: number): Promise<RankedData | null> => {
    const allData = await fetchRankedData();
    return allData.find(item => item.id === id) || null;
};

// Search ranked data by name
export const searchRankedData = async (query: string): Promise<RankedData[]> => {
    const allData = await fetchRankedData();
    return allData.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.username.toLowerCase().includes(query.toLowerCase())
    );
};

// LOCAL MODE: Fetch available ranked accounts (accounts with essencer = "-")
export const fetchAvailableRankedAccounts = async (): Promise<RankedData[]> => {
    try {
        const allData = await fetchRankedData();
        return allData.filter(account => account.essencer === '-');
    } catch (error) {
        console.error('Error fetching available ranked accounts:', error);
        throw new Error('Failed to fetch available ranked accounts');
    }
};

// Interface for ranking configuration
export interface RankingConfig {
    wins: string;
    level: string;
    mastery: string;
    honor: string;
    elo: string;
    redeem: string;
    member: string;
}

// LOCAL MODE: Return static ranking configuration
export const fetchRankingConfig = async (): Promise<RankingConfig> => {
    return {
        wins: "5",
        level: "3",
        mastery: "2",
        honor: "4",
        elo: "6",
        redeem: "1",
        member: "1"
    };
}; 