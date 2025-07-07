// Interface for the ranked data structure
export interface RankedData {
    id: number;
    name: string;
    username: string;
    bloodline: string;
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

// Fetch ranked data from API
export const fetchRankedData = async (): Promise<RankedData[]> => {
    try {
        const response = await fetch('http://localhost:8080/rankeds');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: RankedResponse = await response.json();
        return data.ranked;
    } catch (error) {
        console.error('Error fetching ranked data:', error);
        throw new Error('Failed to fetch ranked data');
    }
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