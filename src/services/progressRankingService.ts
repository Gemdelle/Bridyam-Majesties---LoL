// LOCAL MODE: Progress ranking functionality disabled (no backend)
import {
    fetchWinsFromSheet,
    fetchEssencerPetMap,
    isClaimedEssencer,
    normalizeSheetEssencer,
    getPetTypeFromSpecies,
    getPetStageFromLevel
} from './sheetsWinsService';
import { assetUrl } from '../utils/assetUrl';

export interface RankingEntry {
    rank: number;
    rankedId: number;
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
    redeemCount: number;
    redeemScore: number;
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

// Interface for ranked data from JSON
interface RankedAccount {
    id: number;
    essencer: string;
    bloodline: string;
    wins: { current: number; totals: number };
    level: number;
    honor: number;
    masteries: number;
    elo_soloq: { tier: string; division: number };
    elo_flex: { tier: string; division: number };
}

// Interface for essencer config
interface EssencerConfig {
    petType: string;
    petName: string;
    petStage: number;
}

// Cache for essencers config
let essencersConfig: Record<string, EssencerConfig> | null = null;

// Load essencers config
const loadEssencersConfig = async (): Promise<Record<string, EssencerConfig>> => {
    if (essencersConfig) return essencersConfig;

    try {
        const response = await fetch(assetUrl('data/essencers.json'));
        if (response.ok) {
            const data = await response.json();
            essencersConfig = data.essencers;
            return essencersConfig || {};
        }
    } catch (error) {
        console.error('Error loading essencers config:', error);
    }
    return {};
};

// Scoring configuration - Split 1 2026
const SCORING = {
    wins: 70,      // 70 pts per win
    elo: 0,        // Will be enabled later
    honor: 0,      // Will be enabled later
    level: 0,      // Will be enabled later
    mastery: 0,    // Will be enabled later
    member: 0,
    redeem: 0
};

/**
 * Ranking from Google Sheets only: group claimed essencers by name and sum wins.
 * Old local essencer names are ignored.
 */
export const fetchGlobalRanking = async (limit: number = 100): Promise<ProgressRankingResponse> => {
    try {
        const [sheetRows, essencerPetMap] = await Promise.all([
            fetchWinsFromSheet(),
            fetchEssencerPetMap()
        ]);

        const essencerStats: Record<string, { name: string; totalWins: number; accountCount: number }> = {};

        sheetRows.forEach(row => {
            const essencer = normalizeSheetEssencer(row.essencer);
            if (!isClaimedEssencer(essencer)) return;

            if (!essencerStats[essencer]) {
                essencerStats[essencer] = {
                    name: essencer,
                    totalWins: 0,
                    accountCount: 0
                };
            }

            essencerStats[essencer].totalWins += Number(row.wins) || 0;
            essencerStats[essencer].accountCount += 1;
        });

        const ranking: RankingEntry[] = Object.values(essencerStats)
            .filter(e => e.totalWins > 0)
            .map(e => {
                const winsScore = e.totalWins * SCORING.wins;
                const petRow = essencerPetMap.get(e.name.toLowerCase());
                const petType = getPetTypeFromSpecies(petRow?.pet);
                const petStage = petType ? getPetStageFromLevel(petRow?.level ?? 1) : null;

                return {
                    rank: 0,
                    rankedId: 0,
                    rankedName: e.name,
                    userId: `sheet-${e.name.toLowerCase()}`,
                    petType,
                    petStage,
                    totalProgressScore: winsScore,
                    levelGained: 0,
                    honorGained: 0,
                    winsGained: e.totalWins,
                    soloqProgress: 0,
                    flexProgress: 0,
                    masteryLevelsGained: 0,
                    level30BonusCount: 0,
                    eloDivisionsGained: 0,
                    winsScore,
                    masteryScore: 0,
                    honorScore: 0,
                    levelScore: 0,
                    memberScore: 0,
                    eloScore: 0,
                    redeemCount: 0,
                    redeemScore: 0
                };
            })
            .sort((a, b) => b.totalProgressScore - a.totalProgressScore || a.rankedName.localeCompare(b.rankedName))
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        return { ranking: ranking.slice(0, limit), totalCount: ranking.length };
    } catch (error) {
        console.error('Error calculating ranking from Google Sheets:', error);
        return { ranking: [], totalCount: 0 };
    }
};

/**
 * Bloodline ranking: uses Sheet-overlaid ranked data (essencer/wins from Excel).
 */
export const fetchRankingByBloodline = async (bloodline: string, limit: number = 100): Promise<ProgressRankingResponse> => {
    try {
        const { fetchRankedData } = await import('./apiRankedsService');
        const [rankeds, essencerPetMap] = await Promise.all([
            fetchRankedData(),
            fetchEssencerPetMap()
        ]);

        const filtered = rankeds.filter(r =>
            r.bloodline.toLowerCase() === bloodline.toLowerCase() &&
            isClaimedEssencer(r.name || r.essencer)
        );

        const essencerStats: Record<string, { name: string; totalWins: number }> = {};
        filtered.forEach(r => {
            const essencer = normalizeSheetEssencer(r.name || r.essencer);
            if (!isClaimedEssencer(essencer)) return;
            if (!essencerStats[essencer]) {
                essencerStats[essencer] = { name: essencer, totalWins: 0 };
            }
            essencerStats[essencer].totalWins += r.wins?.current || 0;
        });

        const ranking: RankingEntry[] = Object.values(essencerStats)
            .filter(e => e.totalWins > 0)
            .map(e => {
                const winsScore = e.totalWins * SCORING.wins;
                const petRow = essencerPetMap.get(e.name.toLowerCase());
                const petType = getPetTypeFromSpecies(petRow?.pet);
                const petStage = petType ? getPetStageFromLevel(petRow?.level ?? 1) : null;
                return {
                    rank: 0,
                    rankedId: 0,
                    rankedName: e.name,
                    userId: `sheet-${e.name.toLowerCase()}`,
                    petType,
                    petStage,
                    totalProgressScore: winsScore,
                    levelGained: 0,
                    honorGained: 0,
                    winsGained: e.totalWins,
                    soloqProgress: 0,
                    flexProgress: 0,
                    masteryLevelsGained: 0,
                    level30BonusCount: 0,
                    eloDivisionsGained: 0,
                    winsScore,
                    masteryScore: 0,
                    honorScore: 0,
                    levelScore: 0,
                    memberScore: 0,
                    eloScore: 0,
                    redeemCount: 0,
                    redeemScore: 0
                };
            })
            .sort((a, b) => b.totalProgressScore - a.totalProgressScore || a.rankedName.localeCompare(b.rankedName))
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        return { ranking: ranking.slice(0, limit), totalCount: ranking.length };
    } catch (error) {
        console.error('Error fetching bloodline ranking:', error);
        return { ranking: [], totalCount: 0 };
    }
};

/**
 * LOCAL MODE: Obtiene el progreso detallado de un usuario (disabled)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchUserProgress = async (userId: string, rankedId: number, token: string): Promise<UserProgressStats> => {
    console.log('LOCAL MODE: fetchUserProgress is disabled');
    throw new Error('LOCAL MODE: User progress is not available');
};

/**
 * LOCAL MODE: Actualiza el progreso de una cuenta específica (disabled)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updateAccountProgress = async (userId: string, rankedId: number, token: string): Promise<{ message: string; progress: UserProgressStats }> => {
    console.log('LOCAL MODE: updateAccountProgress is disabled');
    throw new Error('LOCAL MODE: Progress updates are not available');
};

/**
 * LOCAL MODE: Actualiza el progreso de todas las cuentas de un usuario (disabled)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updateUserProgress = async (userId: string, token: string): Promise<{ message: string; updatedCount: number }> => {
    console.log('LOCAL MODE: updateUserProgress is disabled');
    return { message: 'LOCAL MODE: Progress updates are disabled', updatedCount: 0 };
};

