// Interface for the mastery data structure
export interface MasteryData {
    id: number;
    ranked_id: number;
    username: string;
    champion_id: number;
    champion_level: number;
    champion_points: number;
    champion_points_since_last_level: number;
    champion_points_until_next_level: number;
    chest_granted: boolean;
    last_play_time: string;
}

// Interface for the API response
export interface MasteryResponse {
    masteries: MasteryData[];
}

// Fetch mastery data from API
export const fetchMasteryData = async (): Promise<MasteryData[]> => {
    try {
        const response = await fetch('http://localhost:8080/masteries');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: MasteryResponse = await response.json();
        return data.masteries;
    } catch (error) {
        console.error('Error fetching mastery data:', error);
        throw new Error('Failed to fetch mastery data');
    }
};

// Fetch mastery data by ranked ID
export const fetchMasteryDataByRankedId = async (rankedId: number): Promise<MasteryData[]> => {
    const allData = await fetchMasteryData();
    return allData.filter(item => item.ranked_id === rankedId);
};

// Fetch mastery data by champion ID
export const fetchMasteryDataByChampionId = async (championId: number): Promise<MasteryData[]> => {
    const allData = await fetchMasteryData();
    return allData.filter(item => item.champion_id === championId);
};

// Get mastery level for a specific champion and account
export const getMasteryLevel = async (rankedId: number, championId: number): Promise<number> => {
    const allData = await fetchMasteryData();
    const mastery = allData.find(item => item.ranked_id === rankedId && item.champion_id === championId);
    return mastery ? mastery.champion_level : 0;
};

// Get mastery data for a specific champion and account
export const getMasteryData = async (rankedId: number, championId: number): Promise<MasteryData | null> => {
    const allData = await fetchMasteryData();
    return allData.find(item => item.ranked_id === rankedId && item.champion_id === championId) || null;
}; 