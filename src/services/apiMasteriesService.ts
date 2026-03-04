// import { authService } from './authService'; // DISABLED - Local mode
import { purchasedChampionsService } from './purchasedChampionsService';

// Interface for the individual mastery data structure
export interface MasteryData {
    id: number | null;
    ranked_id: number;
    username: string;
    champion_id: number;
    champion_level: number | null;
    champion_points: number;
    champion_points_since_last_level: number;
    champion_points_until_next_level: number;
    chest_granted: boolean;
    last_play_time: string | null;
}

// Interface for user mastery data grouped by user
export interface UserMasteryData {
    id: number | null;
    username: string;
    masteries_by_champions: MasteryData[];
}

// Interface for the API response
export interface MasteryResponse {
    masteries: UserMasteryData[];
}

// Cache variables for performance optimization
let cachedMasteryData: MasteryData[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Interface for local mastery JSON structure
interface LocalMasteryEntry {
    ranked_id: number;
    username: string;
    masteries: {
        champion_id: number;
        champion_level: number;
        champion_points: number;
    }[];
}

// LOCAL MODE: Fetch mastery data from local JSON
export const fetchMasteryData = async (): Promise<MasteryData[]> => {
    // Check if we have cached data and it hasn't expired
    if (cachedMasteryData && Date.now() - cacheTimestamp < CACHE_DURATION) {
        console.log('Using cached mastery data');
        return cachedMasteryData;
    }

    try {
        console.log('LOCAL MODE: Fetching mastery data from local JSON');
        const response = await fetch('/data/masteries.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const localData: LocalMasteryEntry[] = await response.json();

        // Flatten the data to match the original structure
        const flattenedMasteries: MasteryData[] = [];
        localData.forEach(user => {
            user.masteries.forEach(mastery => {
                flattenedMasteries.push({
                    id: null,
                    ranked_id: user.ranked_id,
                    username: user.username,
                    champion_id: mastery.champion_id,
                    champion_level: mastery.champion_level,
                    champion_points: mastery.champion_points,
                    champion_points_since_last_level: 0,
                    champion_points_until_next_level: 0,
                    chest_granted: false,
                    last_play_time: null
                });
            });
        });

        // Cache the data
        cachedMasteryData = flattenedMasteries;
        cacheTimestamp = Date.now();

        return flattenedMasteries;
    } catch (error) {
        console.error('Error fetching local mastery data:', error);
        return [];
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
export const getMasteryLevel = async (rankedId: number, championId: number): Promise<number | null> => {
    const allData = await fetchMasteryData();
    const mastery = allData.find(item => item.ranked_id === rankedId && item.champion_id === championId);
    return mastery ? mastery.champion_level : null;
};

// Get mastery data for a specific champion and account
export const getMasteryData = async (rankedId: number, championId: number): Promise<MasteryData | null> => {
    const allData = await fetchMasteryData();
    return allData.find(item => item.ranked_id === rankedId && item.champion_id === championId) || null;
};

// LOCAL MODE: Fetch raw mastery data grouped by users from local JSON
export const fetchGroupedMasteryData = async (): Promise<UserMasteryData[]> => {
    try {
        const response = await fetch('/data/masteries.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const localData: LocalMasteryEntry[] = await response.json();

        // Convert to UserMasteryData format
        const groupedData: UserMasteryData[] = localData.map(user => ({
            id: user.ranked_id,
            username: user.username,
            masteries_by_champions: user.masteries.map(m => ({
                id: null,
                ranked_id: user.ranked_id,
                username: user.username,
                champion_id: m.champion_id,
                champion_level: m.champion_level,
                champion_points: m.champion_points,
                champion_points_since_last_level: 0,
                champion_points_until_next_level: 0,
                chest_granted: false,
                last_play_time: null
            }))
        }));

        return groupedData;
    } catch (error) {
        console.error('Error fetching grouped mastery data:', error);
        return [];
    }
};

// Get mastery data for a specific user
export const getUserMasteryData = async (rankedId: number): Promise<UserMasteryData | null> => {
    const groupedData = await fetchGroupedMasteryData();
    return groupedData.find(user => user.id === rankedId) || null;
};

// Get effective mastery level (considering purchased champions for GEM user)
export const getEffectiveMasteryLevel = (rankedId: number, championId: number, realMasteryLevel: number): number => {
    return purchasedChampionsService.getEffectiveMasteryLevel(rankedId, championId, realMasteryLevel);
};

// Check if current user is GEM
export const isGemUser = (): boolean => {
    return purchasedChampionsService.isGemUser();
};

// Mark champion as purchased
export const markChampionAsPurchased = (rankedId: number, championId: number): void => {
    purchasedChampionsService.markAsPurchased(rankedId, championId);
};

// Unmark champion as purchased
export const unmarkChampionAsPurchased = (rankedId: number, championId: number): void => {
    purchasedChampionsService.unmarkAsPurchased(rankedId, championId);
};

// Check if champion is marked as purchased
export const isChampionPurchased = (rankedId: number, championId: number): boolean => {
    return purchasedChampionsService.isPurchased(rankedId, championId);
};

// LOCAL MODE: Update masteries data (disabled)
export const updateMasteries = async (_masteriesData: MasteryData[]): Promise<void> => {
    console.log('LOCAL MODE: updateMasteries is disabled');
};

// LOCAL MODE: Update masteries data for a specific ranked account (disabled)
export const updateMasteriesByRankedId = async (_rankedId: number, _masteriesData: MasteryData[]): Promise<void> => {
    console.log('LOCAL MODE: updateMasteriesByRankedId is disabled');
};

// Clear mastery data cache
export const clearMasteryCache = (): void => {
    cachedMasteryData = null;
    cacheTimestamp = 0;
    console.log('Mastery cache cleared');
}; 