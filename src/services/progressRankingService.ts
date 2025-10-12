// API configuration
const API_BASE_URL = 'https://bridyam-majesties-back-production.up.railway.app';

export interface RankingEntry {
    rank: number;
    userId: string;
    rankedName: string;
    petType: string | null;
    petStage: number | null;
    totalProgressScore: number;
    levelGained: number;
    honorGained: number;
    winsGained: number;
    soloqProgress: number;
    flexProgress: number;
    masteryLevelsGained: number;
    level30BonusCount: number;
    eloDivisionsGained: number;
    winsScore: number;
    masteryScore: number;
    honorScore: number;
    levelScore: number;
    memberScore: number;
    eloScore: number;
}

export interface ProgressRankingResponse {
    ranking: RankingEntry[];
    totalCount: number;
}

export interface UserProgressStats {
    userId: string;
    rankedId: number;
    rankedUsername: string;
    rankedName: string;
    levelGained: number;
    honorGained: number;
    winsGained: number;
    soloqProgress: number;
    flexProgress: number;
    currentLevel: number;
    currentHonor: number;
    currentWinsCurrent: number;
    currentSoloqTier: string;
    currentSoloqDivision: number;
    currentFlexTier: string;
    currentFlexDivision: number;
    baselineLevel: number;
    baselineHonor: number;
    baselineWinsCurrent: number;
    baselineSoloqTier: string;
    baselineSoloqDivision: number;
    baselineFlexTier: string;
    baselineFlexDivision: number;
    totalProgressScore: number;
    claimedAt: string;
    lastUpdatedAt: string;
}

/**
 * Obtiene el ranking global de progreso
 */
export const fetchGlobalRanking = async (limit: number = 100): Promise<ProgressRankingResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/progress/ranking?limit=${limit}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ranking: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching global ranking:', error);
        throw error;
    }
};

/**
 * Obtiene el ranking de progreso por bloodline
 */
export const fetchRankingByBloodline = async (bloodline: string, limit: number = 100): Promise<ProgressRankingResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/progress/ranking/bloodline/${bloodline}?limit=${limit}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ranking for bloodline: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ranking for bloodline ${bloodline}:`, error);
        throw error;
    }
};

/**
 * Obtiene el progreso detallado de un usuario en una cuenta específica
 */
export const fetchUserProgress = async (userId: string, rankedId: number, token: string): Promise<UserProgressStats> => {
    try {
        const response = await fetch(`${API_BASE_URL}/progress/user/${userId}/ranked/${rankedId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch user progress: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching user progress:', error);
        throw error;
    }
};

/**
 * Actualiza el progreso de una cuenta específica
 */
export const updateAccountProgress = async (userId: string, rankedId: number, token: string): Promise<{ message: string; progress: UserProgressStats }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/progress/update/${userId}/${rankedId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update account progress: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating account progress:', error);
        throw error;
    }
};

/**
 * Actualiza el progreso de todas las cuentas de un usuario
 */
export const updateUserProgress = async (userId: string, token: string): Promise<{ message: string; updatedCount: number }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/progress/update/user/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update user progress: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating user progress:', error);
        throw error;
    }
};

