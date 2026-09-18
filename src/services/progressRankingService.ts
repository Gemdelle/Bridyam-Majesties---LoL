// Progress ranking from Google Sheets (wins + deltas vs INIT_* baselines)
import {
    fetchWinsFromSheet,
    fetchEssencerPetMap,
    fetchMasteriesFromSheet,
    freezeProgressBaselines,
    needsProgressBaselineFreeze,
    isClaimedEssencer,
    normalizeSheetEssencer,
    getPetTypeFromSpecies,
    getPetStageFromLevel,
    parseEloFromSheet,
    type SheetAccountRow,
} from './sheetsWinsService';

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

// Scoring — Split 1 2026 (matches Ranked rules popup defaults)
const SCORING = {
    wins: 70,
    elo: 25,
    honor: 0,
    level: 80,
    mastery: 50,
    member: 0,
    redeem: 500,
};

const ELO_TIERS = [
    'unranked',
    'iron',
    'bronze',
    'silver',
    'gold',
    'platinum',
    'emerald',
    'diamond',
    'master',
    'grandmaster',
    'challenger',
];

/** Linear rank index so division climbs (e.g. Silver→Gold) score as positive deltas. */
export const eloProgressIndex = (raw: string | undefined | null): number => {
    const { tier, division } = parseEloFromSheet(raw);
    const t = tier.toLowerCase();
    const tierIdx = ELO_TIERS.indexOf(t);
    if (tierIdx <= 0) return 0; // unranked / unknown
    // Master+ have no divisions — treat as top of ladder block
    if (tierIdx >= ELO_TIERS.indexOf('master')) {
        return tierIdx * 4;
    }
    const div = Math.min(4, Math.max(1, Number(division) || 4));
    // Within tier: IV (4) lowest → I (1) highest
    return (tierIdx - 1) * 4 + (4 - div) + 1;
};

const sumMasteryLevels = (
    masteries: { username: string; ranked_id?: number; champion_level: number | null }[]
): { byUsername: Map<string, number>; byRankedId: Map<number, number> } => {
    const byUsername = new Map<string, number>();
    const byRankedId = new Map<number, number>();
    masteries.forEach((m) => {
        const level = Number(m.champion_level) || 0;
        const userKey = String(m.username || '').trim().toLowerCase();
        if (userKey) {
            byUsername.set(userKey, (byUsername.get(userKey) || 0) + level);
        }
        const rid = Number(m.ranked_id) || 0;
        if (rid > 0) {
            byRankedId.set(rid, (byRankedId.get(rid) || 0) + level);
        }
    });
    return { byUsername, byRankedId };
};

const masterySumForAccount = (
    account: string,
    rankedId: number | undefined,
    byUsername: Map<string, number>,
    byRankedId: Map<number, number>
): number => {
    const userKey = account.trim().toLowerCase();
    const fromUser = byUsername.get(userKey) || 0;
    const fromId = rankedId && rankedId > 0 ? byRankedId.get(rankedId) || 0 : 0;
    return Math.max(fromUser, fromId);
};

interface EssencerAgg {
    name: string;
    accountCount: number;
    winsGained: number;
    levelGained: number;
    masteryLevelsGained: number;
    eloDivisionsGained: number;
}

const accumulateAccount = (
    agg: EssencerAgg,
    row: SheetAccountRow,
    masterySum: number
): void => {
    agg.accountCount += 1;
    agg.winsGained += Number(row.wins) || 0;

    const initLv = row.init_lv;
    if (initLv !== null && initLv !== undefined) {
        agg.levelGained += Math.max(0, (Number(row.lv) || 0) - Number(initLv));
    }

    // Mastery: only score when baseline exists on the sheet
    if (row.init_mastery !== null && row.init_mastery !== undefined) {
        const gain = Math.max(0, masterySum - Number(row.init_mastery));
        agg.masteryLevelsGained += gain;
    }

    const initSolo = String(row.init_solo || '').trim();
    const initFlex = String(row.init_flex || '').trim();
    if (initSolo) {
        agg.eloDivisionsGained += Math.max(
            0,
            eloProgressIndex(row.solo) - eloProgressIndex(initSolo)
        );
    }
    if (initFlex) {
        agg.eloDivisionsGained += Math.max(
            0,
            eloProgressIndex(row.flex) - eloProgressIndex(initFlex)
        );
    }
};

const buildEntry = (
    e: EssencerAgg,
    petRow: { pet?: string; level?: number } | undefined
): RankingEntry => {
    const winsScore = e.winsGained * SCORING.wins;
    const masteryScore = e.masteryLevelsGained * SCORING.mastery;
    const levelScore = e.levelGained * SCORING.level;
    const eloScore = e.eloDivisionsGained * SCORING.elo;
    // Redeem = claimed account count (direct)
    const redeemCount = e.accountCount;
    const redeemScore = redeemCount * SCORING.redeem;
    const petType = getPetTypeFromSpecies(petRow?.pet);
    const petStage = petType ? getPetStageFromLevel(petRow?.level ?? 1) : null;

    return {
        rank: 0,
        rankedId: 0,
        rankedName: e.name,
        userId: `sheet-${e.name.toLowerCase()}`,
        petType,
        petStage,
        totalProgressScore: winsScore + masteryScore + levelScore + eloScore + redeemScore,
        levelGained: e.levelGained,
        honorGained: 0,
        winsGained: e.winsGained,
        soloqProgress: 0,
        flexProgress: 0,
        masteryLevelsGained: e.masteryLevelsGained,
        level30BonusCount: 0,
        eloDivisionsGained: e.eloDivisionsGained,
        winsScore,
        masteryScore,
        honorScore: 0,
        levelScore,
        memberScore: 0,
        eloScore,
        redeemCount,
        redeemScore,
    };
};

/**
 * Ranking from Google Sheets: group claimed essencers and score
 * wins + redeem(accounts) + mastery/level/elo deltas vs INIT_* baselines.
 */
export const fetchGlobalRanking = async (limit: number = 100): Promise<ProgressRankingResponse> => {
    try {
        let sheetRows = await fetchWinsFromSheet();

        // One-shot: freeze baselines if INIT_* missing (safe — only fills empty cells)
        if (needsProgressBaselineFreeze(sheetRows)) {
            console.log('Progress baselines missing — freezing current state to Sheet…');
            await freezeProgressBaselines(false);
            try {
                sheetRows = await fetchWinsFromSheet();
            } catch {
                /* keep previous rows; freeze is async via Apps Script */
            }
        }

        const [essencerPetMap, masteryRows, rankeds] = await Promise.all([
            fetchEssencerPetMap(),
            fetchMasteriesFromSheet(),
            import('./apiRankedsService')
                .then((m) => m.fetchRankedData())
                .catch(() => [] as { id: number; username: string }[]),
        ]);

        const { byUsername, byRankedId } = sumMasteryLevels(masteryRows);
        const rankedIdByAccount = new Map<string, number>();
        rankeds.forEach((r) => {
            const key = (r.username || '').trim().toLowerCase();
            if (key) rankedIdByAccount.set(key, r.id);
        });

        const essencerStats: Record<string, EssencerAgg> = {};

        sheetRows.forEach((row) => {
            const essencer = normalizeSheetEssencer(row.essencer);
            if (!isClaimedEssencer(essencer)) return;

            if (!essencerStats[essencer]) {
                essencerStats[essencer] = {
                    name: essencer,
                    accountCount: 0,
                    winsGained: 0,
                    levelGained: 0,
                    masteryLevelsGained: 0,
                    eloDivisionsGained: 0,
                };
            }

            const accountKey = row.account.trim().toLowerCase();
            const rankedId = rankedIdByAccount.get(accountKey);
            const masterySum = masterySumForAccount(
                row.account,
                rankedId,
                byUsername,
                byRankedId
            );
            accumulateAccount(essencerStats[essencer], row, masterySum);
        });

        const ranking: RankingEntry[] = Object.values(essencerStats)
            .filter(
                (e) =>
                    e.winsGained > 0 ||
                    e.accountCount > 0 ||
                    e.levelGained > 0 ||
                    e.masteryLevelsGained > 0 ||
                    e.eloDivisionsGained > 0
            )
            .map((e) => {
                const petRow = essencerPetMap.get(e.name.toLowerCase());
                return buildEntry(e, petRow);
            })
            .sort(
                (a, b) =>
                    b.totalProgressScore - a.totalProgressScore ||
                    a.rankedName.localeCompare(b.rankedName)
            )
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        const withMastery = ranking.filter((r) => r.masteryLevelsGained > 0).length;
        console.log(
            `[ranking] ${ranking.length} players, ${withMastery} with mastery gains (INIT snapshot must be below current Sheet MASTERY)`
        );

        return { ranking: ranking.slice(0, limit), totalCount: ranking.length };
    } catch (error) {
        console.error('Error calculating ranking from Google Sheets:', error);
        return { ranking: [], totalCount: 0 };
    }
};

/**
 * Bloodline ranking: uses Sheet-overlaid ranked data + same scoring as global.
 */
export const fetchRankingByBloodline = async (
    bloodline: string,
    limit: number = 100
): Promise<ProgressRankingResponse> => {
    try {
        const { fetchRankedData } = await import('./apiRankedsService');
        const [rankeds, sheetRows, essencerPetMap, masteryRows] = await Promise.all([
            fetchRankedData(),
            fetchWinsFromSheet(),
            fetchEssencerPetMap(),
            fetchMasteriesFromSheet(),
        ]);

        const sheetByAccount = new Map(
            sheetRows.map((r) => [r.account.trim().toLowerCase(), r])
        );
        const { byUsername, byRankedId } = sumMasteryLevels(masteryRows);

        const filtered = rankeds.filter(
            (r) =>
                r.bloodline.toLowerCase() === bloodline.toLowerCase() &&
                isClaimedEssencer(r.name || r.essencer)
        );

        const essencerStats: Record<string, EssencerAgg> = {};
        filtered.forEach((r) => {
            const essencer = normalizeSheetEssencer(r.name || r.essencer);
            if (!isClaimedEssencer(essencer)) return;
            if (!essencerStats[essencer]) {
                essencerStats[essencer] = {
                    name: essencer,
                    accountCount: 0,
                    winsGained: 0,
                    levelGained: 0,
                    masteryLevelsGained: 0,
                    eloDivisionsGained: 0,
                };
            }

            const key = (r.username || '').trim().toLowerCase();
            const sheetRow = sheetByAccount.get(key);
            if (sheetRow) {
                const masterySum = masterySumForAccount(r.username, r.id, byUsername, byRankedId);
                accumulateAccount(essencerStats[essencer], sheetRow, masterySum);
            } else {
                essencerStats[essencer].accountCount += 1;
                essencerStats[essencer].winsGained += r.wins?.current || 0;
            }
        });

        const ranking: RankingEntry[] = Object.values(essencerStats)
            .filter((e) => e.accountCount > 0)
            .map((e) => buildEntry(e, essencerPetMap.get(e.name.toLowerCase())))
            .sort(
                (a, b) =>
                    b.totalProgressScore - a.totalProgressScore ||
                    a.rankedName.localeCompare(b.rankedName)
            )
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        return { ranking: ranking.slice(0, limit), totalCount: ranking.length };
    } catch (error) {
        console.error('Error fetching bloodline ranking:', error);
        return { ranking: [], totalCount: 0 };
    }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchUserProgress = async (
    userId: string,
    rankedId: number,
    token: string
): Promise<UserProgressStats> => {
    throw new Error('LOCAL MODE: User progress is not available');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updateAccountProgress = async (
    userId: string,
    rankedId: number,
    token: string
): Promise<{ message: string; progress: UserProgressStats }> => {
    throw new Error('LOCAL MODE: Progress updates are not available');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updateUserProgress = async (
    userId: string,
    token: string
): Promise<{ message: string; updatedCount: number }> => {
    return { message: 'LOCAL MODE: Progress updates are disabled', updatedCount: 0 };
};
