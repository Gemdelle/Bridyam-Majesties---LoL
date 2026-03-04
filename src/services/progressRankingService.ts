// LOCAL MODE: Progress ranking functionality disabled (no backend)

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
        const response = await fetch('/data/essencers.json');
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
 * LOCAL MODE: Calcula el ranking dinámicamente desde rankeds.json
 * Solo incluye essencers con wins > 0
 */
export const fetchGlobalRanking = async (limit: number = 100): Promise<ProgressRankingResponse> => {
    try {
        const [rankedsResponse, essencers] = await Promise.all([
            fetch('/data/rankeds.json'),
            loadEssencersConfig()
        ]);

        if (!rankedsResponse.ok) {
            throw new Error(`HTTP error! status: ${rankedsResponse.status}`);
        }
        const rankeds: RankedAccount[] = await rankedsResponse.json();

        // Group accounts by essencer and sum their stats
        const essencerStats: Record<string, {
            name: string;
            totalWins: number;
            totalLevel: number;
            totalHonor: number;
            totalMastery: number;
            totalEloSoloq: number;
            totalEloFlex: number;
            accountCount: number;
        }> = {};

        const eloPoints: Record<string, number> = {
            'challenger': 1000, 'grandmaster': 900, 'master': 800,
            'diamond': 700, 'emerald': 600, 'platinum': 500,
            'gold': 400, 'silver': 300, 'bronze': 200, 'iron': 100, 'unranked': 0
        };

        rankeds.forEach(r => {
            if (r.essencer === '-') return;

            if (!essencerStats[r.essencer]) {
                essencerStats[r.essencer] = {
                    name: r.essencer,
                    totalWins: 0,
                    totalLevel: 0,
                    totalHonor: 0,
                    totalMastery: 0,
                    totalEloSoloq: 0,
                    totalEloFlex: 0,
                    accountCount: 0
                };
            }

            const soloqPoints = (eloPoints[r.elo_soloq.tier.toLowerCase()] || 0) + (5 - r.elo_soloq.division) * 20;
            const flexPoints = (eloPoints[r.elo_flex.tier.toLowerCase()] || 0) + (5 - r.elo_flex.division) * 20;

            essencerStats[r.essencer].totalWins += r.wins.current;
            essencerStats[r.essencer].totalLevel += r.level;
            essencerStats[r.essencer].totalHonor += r.honor;
            essencerStats[r.essencer].totalMastery += r.masteries;
            essencerStats[r.essencer].totalEloSoloq += soloqPoints;
            essencerStats[r.essencer].totalEloFlex += flexPoints;
            essencerStats[r.essencer].accountCount += 1;
        });

        // Build ranking - only include essencers with wins > 0
        const ranking: RankingEntry[] = Object.values(essencerStats)
            .filter(e => e.totalWins > 0)
            .map(e => {
                const winsScore = e.totalWins * SCORING.wins;
                const eloScore = Math.floor((e.totalEloSoloq + e.totalEloFlex) / 4) * (SCORING.elo > 0 ? 1 : 0);
                const honorScore = e.totalHonor * SCORING.honor;
                const levelScore = e.totalLevel * SCORING.level;
                const masteryScore = e.totalMastery * SCORING.mastery;
                const totalScore = winsScore + eloScore + honorScore + levelScore + masteryScore;

                // Get pet info from essencers config
                const petConfig = essencers[e.name];

                return {
                    rank: 0,
                    rankedId: 0,
                    rankedName: e.name,
                    userId: 'local-user',
                    petType: petConfig?.petType || '1',
                    petStage: petConfig?.petStage || 2,
                    totalProgressScore: totalScore,
                    levelGained: e.totalLevel,
                    honorGained: e.totalHonor,
                    winsGained: e.totalWins,
                    soloqProgress: e.totalEloSoloq,
                    flexProgress: e.totalEloFlex,
                    masteryLevelsGained: e.totalMastery,
                    level30BonusCount: 0,
                    eloDivisionsGained: 0,
                    winsScore,
                    masteryScore,
                    honorScore,
                    levelScore,
                    memberScore: 0,
                    eloScore,
                    redeemCount: 0,
                    redeemScore: 0
                };
            })
            .sort((a, b) => b.totalProgressScore - a.totalProgressScore)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        return { ranking: ranking.slice(0, limit), totalCount: ranking.length };
    } catch (error) {
        console.error('Error calculating ranking:', error);
        return { ranking: [], totalCount: 0 };
    }
};

/**
 * LOCAL MODE: Obtiene el ranking de progreso por bloodline
 */
export const fetchRankingByBloodline = async (bloodline: string, limit: number = 100): Promise<ProgressRankingResponse> => {
    try {
        const response = await fetch('/data/rankeds.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rankeds: RankedAccount[] = await response.json();

        // Filter by bloodline first, then group by essencer
        const filteredRankeds = rankeds.filter(r =>
            r.bloodline.toLowerCase() === bloodline.toLowerCase()
        );

        // Use same logic as global ranking but with filtered data
        const { ranking } = await fetchGlobalRanking(1000);

        // Get essencers that have accounts in this bloodline
        const bloodlineEssencers = new Set(
            filteredRankeds.filter(r => r.essencer !== '-').map(r => r.essencer)
        );

        const filtered = ranking.filter(entry => bloodlineEssencers.has(entry.rankedName));
        const reranked = filtered.map((entry, index) => ({ ...entry, rank: index + 1 }));

        return { ranking: reranked.slice(0, limit), totalCount: reranked.length };
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

