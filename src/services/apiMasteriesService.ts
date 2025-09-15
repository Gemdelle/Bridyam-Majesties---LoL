import { authService } from './authService';
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

// Fetch mastery data from API
export const fetchMasteryData = async (): Promise<MasteryData[]> => {
    try {
        const response = await authService.makeAuthenticatedRequest('https://bridyam-majesties-back-production.up.railway.app/masteries');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: MasteryResponse = await response.json();
        // Flatten the data from the new grouped structure
        const flattenedMasteries: MasteryData[] = [];
        data.masteries.forEach(user => {
            flattenedMasteries.push(...user.masteries_by_champions);
        });
        return flattenedMasteries;
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

// Fetch raw mastery data grouped by users (new structure)
export const fetchGroupedMasteryData = async (): Promise<UserMasteryData[]> => {
    try {
        const response = await authService.makeAuthenticatedRequest('https://bridyam-majesties-back-production.up.railway.app/masteries');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: MasteryResponse = await response.json();
        return data.masteries;
    } catch (error) {
        console.error('Error fetching grouped mastery data:', error);
        throw new Error('Failed to fetch grouped mastery data');
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

// Update masteries data via PUT request
export const updateMasteries = async (masteriesData: MasteryData[]): Promise<void> => {
    try {
        const response = await authService.makeAuthenticatedRequest(
            'https://bridyam-majesties-back-production.up.railway.app/masteries',
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ masteries: masteriesData }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error updating masteries data:', error);
        throw new Error('Failed to update masteries data');
    }
}; 