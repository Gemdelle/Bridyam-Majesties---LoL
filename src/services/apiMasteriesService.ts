// import { authService } from './authService'; // DISABLED - Local mode
import { purchasedChampionsService } from './purchasedChampionsService';
import { assetUrl } from '../utils/assetUrl';
import {
    fetchMasteriesFromSheet,
    upsertMasteriesToSheet,
    type SheetMasteryRow,
} from './sheetsWinsService';

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
const CACHE_DURATION = 0; // Disable cache - always read fresh

export const invalidateMasteryCache = (): void => {
    cachedMasteryData = null;
    cacheTimestamp = 0;
    console.log('🗑️ Mastery cache invalidated');
};

interface LocalMasteryEntry {
    ranked_id: number;
    username: string;
    masteries: {
        champion_id: number;
        champion_level: number;
        champion_points: number;
    }[];
}

const sheetRowsToMasteryData = (rows: SheetMasteryRow[]): MasteryData[] =>
    rows.map((row) => ({
        id: null,
        ranked_id: Number(row.ranked_id) || 0,
        username: String(row.username || ''),
        champion_id: Number(row.champion_id) || 0,
        champion_level: Number(row.champion_level) || 0,
        champion_points: Number(row.champion_points) || 0,
        champion_points_since_last_level: 0,
        champion_points_until_next_level: 0,
        chest_granted: false,
        last_play_time: null,
    }));

const localJsonToMasteryData = (localData: LocalMasteryEntry[]): MasteryData[] => {
    const flattenedMasteries: MasteryData[] = [];
    localData.forEach((user) => {
        user.masteries.forEach((mastery) => {
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
                last_play_time: null,
            });
        });
    });
    return flattenedMasteries;
};

const fetchMasteryDataFromJson = async (): Promise<MasteryData[]> => {
    const response = await fetch(assetUrl(`data/masteries.json?t=${Date.now()}`), {
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const localData: LocalMasteryEntry[] = await response.json();
    return localJsonToMasteryData(localData);
};

/** Prefer Google Sheet MASTERY tab; fall back to local masteries.json */
export const fetchMasteryData = async (): Promise<MasteryData[]> => {
    if (cachedMasteryData && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return cachedMasteryData;
    }

    try {
        const sheetRows = await fetchMasteriesFromSheet();
        if (sheetRows.length > 0) {
            const flattened = sheetRowsToMasteryData(sheetRows);
            cachedMasteryData = flattened;
            cacheTimestamp = Date.now();
            console.log(`Masteries loaded from Sheet (${flattened.length})`);
            return flattened;
        }
    } catch (sheetError) {
        console.warn('Sheet masteries unavailable, falling back to JSON:', sheetError);
    }

    try {
        const flattened = await fetchMasteryDataFromJson();
        cachedMasteryData = flattened;
        cacheTimestamp = Date.now();
        return flattened;
    } catch (error) {
        console.error('Error fetching local mastery data:', error);
        return [];
    }
};

export const fetchMasteryDataByRankedId = async (rankedId: number): Promise<MasteryData[]> => {
    const allData = await fetchMasteryData();
    return allData.filter((item) => item.ranked_id === rankedId);
};

export const fetchMasteryDataByChampionId = async (championId: number): Promise<MasteryData[]> => {
    const allData = await fetchMasteryData();
    return allData.filter((item) => item.champion_id === championId);
};

export const getMasteryLevel = async (
    rankedId: number,
    championId: number
): Promise<number | null> => {
    const allData = await fetchMasteryData();
    const mastery = allData.find(
        (item) => item.ranked_id === rankedId && item.champion_id === championId
    );
    return mastery ? mastery.champion_level : null;
};

export const getMasteryData = async (
    rankedId: number,
    championId: number
): Promise<MasteryData | null> => {
    const allData = await fetchMasteryData();
    return (
        allData.find((item) => item.ranked_id === rankedId && item.champion_id === championId) ||
        null
    );
};

export const fetchGroupedMasteryData = async (): Promise<UserMasteryData[]> => {
    try {
        const all = await fetchMasteryData();
        const byUser = new Map<number, UserMasteryData>();
        all.forEach((m) => {
            let user = byUser.get(m.ranked_id);
            if (!user) {
                user = {
                    id: m.ranked_id,
                    username: m.username,
                    masteries_by_champions: [],
                };
                byUser.set(m.ranked_id, user);
            }
            user.masteries_by_champions.push(m);
        });
        return [...byUser.values()];
    } catch (error) {
        console.error('Error fetching grouped mastery data:', error);
        return [];
    }
};

export const getUserMasteryData = async (rankedId: number): Promise<UserMasteryData | null> => {
    const groupedData = await fetchGroupedMasteryData();
    return groupedData.find((user) => user.id === rankedId) || null;
};

export const getEffectiveMasteryLevel = (
    rankedId: number,
    championId: number,
    realMasteryLevel: number
): number => {
    return purchasedChampionsService.getEffectiveMasteryLevel(
        rankedId,
        championId,
        realMasteryLevel
    );
};

export const isGemUser = (): boolean => {
    return purchasedChampionsService.isGemUser();
};

export const markChampionAsPurchased = (rankedId: number, championId: number): void => {
    purchasedChampionsService.markAsPurchased(rankedId, championId);
};

export const unmarkChampionAsPurchased = (rankedId: number, championId: number): void => {
    purchasedChampionsService.unmarkAsPurchased(rankedId, championId);
};

export const isChampionPurchased = (rankedId: number, championId: number): boolean => {
    return purchasedChampionsService.isPurchased(rankedId, championId);
};

const toSheetRows = (masteriesData: MasteryData[]): SheetMasteryRow[] =>
    masteriesData.map((m) => ({
        ranked_id: m.ranked_id,
        username: m.username,
        champion_id: m.champion_id,
        champion_level: Number(m.champion_level) || 0,
        champion_points: Number(m.champion_points) || 0,
    }));

/** Persist masteries: Sheet first (production), JSON via Vite in dev */
export const updateMasteries = async (
    masteriesData: MasteryData[],
    mode: 'max' | 'set' = 'set'
): Promise<void> => {
    try {
        await upsertMasteriesToSheet(toSheetRows(masteriesData), mode);
        console.log(`Masteries queued to Sheet (${mode}, ${masteriesData.length} row(s))`);

        // Feed: one event per changed mastery (account name identifies the actor)
        const { publishFeedEvent, NotificationAction } = await import('./feedNotificationService');
        for (const m of masteriesData) {
            void publishFeedEvent({
                rankedId: m.ranked_id,
                rankedUsername: m.username,
                rankedName: m.username,
                action: NotificationAction.MASTERY_LEVEL_UP,
                title: `${m.username} updated a mastery`,
                description: `Champion ${m.champion_id} → level ${m.champion_level}`,
                metadata: {
                    championId: String(m.champion_id),
                    masteryLevel: String(m.champion_level ?? 0),
                    to: String(m.champion_level ?? 0),
                },
            });
        }
    } catch (err) {
        console.warn('Could not save masteries to Sheet:', err);
        throw err;
    } finally {
        invalidateMasteryCache();
    }

    try {
        const byAccount = new Map<number, LocalMasteryEntry>();
        masteriesData.forEach((m) => {
            let entry = byAccount.get(m.ranked_id);
            if (!entry) {
                entry = { ranked_id: m.ranked_id, username: m.username, masteries: [] };
                byAccount.set(m.ranked_id, entry);
            }
            entry.masteries.push({
                champion_id: m.champion_id,
                champion_level: Number(m.champion_level) || 0,
                champion_points: Number(m.champion_points) || 0,
            });
        });
        await fetch('/api/save-masteries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([...byAccount.values()]),
        });
    } catch {
        /* production has no save-masteries endpoint */
    }
};

export const updateMasteriesByRankedId = async (
    rankedId: number,
    masteriesData: MasteryData[],
    mode: 'max' | 'set' = 'set'
): Promise<void> => {
    await updateMasteries(
        masteriesData.filter((m) => m.ranked_id === rankedId),
        mode
    );
};

export const clearMasteryCache = (): void => {
    cachedMasteryData = null;
    cacheTimestamp = 0;
    console.log('Mastery cache cleared');
};
