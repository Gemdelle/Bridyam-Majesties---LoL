// import { authService } from './authService'; // DISABLED - Local mode
import { fetchWinsFromSheet, updateWinsInSheet, normalizeSheetEssencer, parseEloFromSheet, formatEloForSheet, updateAccountInSheet } from './sheetsWinsService';
import { assetUrl } from '../utils/assetUrl';

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

// LOCAL MODE: Fetch ranked data from local JSON, then overlay wins from Google Sheets
export const fetchRankedData = async (): Promise<RankedData[]> => {
    try {
        const response = await fetch(`${assetUrl('data/rankeds.json')}?t=${Date.now()}`, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: RankedData[] = await response.json();

        // Overlay ranked fields from Google Sheets ACCOUNTS tab (source of truth)
        try {
            const sheetRows = await fetchWinsFromSheet();
            const sheetByAccount = new Map(
                sheetRows.map(row => [row.account.trim().toLowerCase(), row])
            );

            return data.map(account => {
                const key = (account.username || '').trim().toLowerCase();
                const sheetRow = sheetByAccount.get(key);

                // Not in sheet yet: clear claimable ranked fields
                if (!sheetRow) {
                    return {
                        ...account,
                        name: '-',
                        essencer: '-',
                        wins: {
                            ...account.wins,
                            current: 0
                        }
                    };
                }

                const sheetEssencer = normalizeSheetEssencer(sheetRow.essencer);
                const solo = parseEloFromSheet(sheetRow.solo);
                const flex = parseEloFromSheet(sheetRow.flex);

                return {
                    ...account,
                    name: sheetEssencer,
                    essencer: sheetEssencer,
                    level: sheetRow.lv !== undefined && sheetRow.lv !== null ? Number(sheetRow.lv) || account.level : account.level,
                    honor: sheetRow.honor !== undefined && sheetRow.honor !== null ? Number(sheetRow.honor) || account.honor : account.honor,
                    wins: {
                        ...account.wins,
                        current: Number(sheetRow.wins) || 0
                    },
                    elo_soloq: sheetRow.solo !== undefined ? solo : account.elo_soloq,
                    elo_flex: sheetRow.flex !== undefined ? flex : account.elo_flex
                };
            });
        } catch (sheetError) {
            console.warn('Could not load ranked fields from Google Sheets, using local JSON:', sheetError);
            return data;
        }
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

// LOCAL MODE: Save the full ranked data array to the JSON file via Vite dev server
const saveRankedDataToFile = async (allData: RankedData[]): Promise<void> => {
    try {
        const res = await fetch('/api/save-rankeds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allData)
        });
        if (res.ok) {
            console.log('%c✅ Rankeds saved to JSON file!', 'color: #90EE90; font-weight: bold;');
        } else {
            console.log('%c⚠️ Could not save rankeds to file (dev server only)', 'color: #FFA500;');
        }
    } catch {
        console.log('%c⚠️ Could not save rankeds to file (dev server only)', 'color: #FFA500;');
    }
};

// LOCAL MODE: Persist full ranked data to file
export const updateRankedData = async (modifiedRankedData: RankedData[]): Promise<RankedData[]> => {
    await saveRankedDataToFile(modifiedRankedData);
    return modifiedRankedData;
};

// Persist changes to Google Sheets ACCOUNTS; full snapshot still saved locally in dev.
export const updateChangedRankedData = async (originalData: RankedData[], modifiedData: RankedData[]): Promise<RankedData[]> => {
    const changed = getChangedRankedData(originalData, modifiedData);

    const sheetUpdates = changed.filter(item => {
        const original = originalData.find(o => o.id === item.id);
        if (!original) return true;
        return (
            original.wins.current !== item.wins.current ||
            original.level !== item.level ||
            original.honor !== item.honor ||
            original.name !== item.name ||
            original.essencer !== item.essencer ||
            original.elo_soloq.tier !== item.elo_soloq.tier ||
            original.elo_soloq.division !== item.elo_soloq.division ||
            original.elo_flex.tier !== item.elo_flex.tier ||
            original.elo_flex.division !== item.elo_flex.division
        );
    });

    if (sheetUpdates.length > 0) {
        await Promise.all(
            sheetUpdates.map(item =>
                updateAccountInSheet(item.username || item.name, {
                    wins: item.wins.current,
                    lv: item.level,
                    honor: item.honor,
                    essencer: item.name || item.essencer || '-',
                    solo: formatEloForSheet(item.elo_soloq),
                    flex: formatEloForSheet(item.elo_flex)
                })
            )
        );
        console.log('%c✅ Ranked fields saved to Google Sheets!', 'color: #90EE90; font-weight: bold;');

        const { publishFeedEvent, NotificationAction } = await import('./feedNotificationService');
        for (const item of sheetUpdates) {
            const original = originalData.find((o) => o.id === item.id);
            const username = item.username || item.name;
            const player = item.name || item.essencer || username;
            if (original && item.wins.current > original.wins.current) {
                void publishFeedEvent({
                    rankedId: item.id,
                    rankedUsername: username,
                    rankedName: player,
                    bloodline: item.bloodline,
                    action: NotificationAction.WIN,
                    title: `${player} won a ranked game`,
                    description: `${username} now has ${item.wins.current} wins`,
                    metadata: {
                        wins: String(item.wins.current),
                        previousWins: String(original.wins.current),
                    },
                    points: 70,
                });
            }
            if (original && item.level > original.level) {
                void publishFeedEvent({
                    rankedId: item.id,
                    rankedUsername: username,
                    rankedName: player,
                    bloodline: item.bloodline,
                    action: NotificationAction.LEVEL_UP,
                    title: `${player} leveled up`,
                    description: `${username} reached level ${item.level}`,
                    metadata: { level: String(item.level) },
                });
            }
            if (original && item.honor > original.honor) {
                void publishFeedEvent({
                    rankedId: item.id,
                    rankedUsername: username,
                    rankedName: player,
                    bloodline: item.bloodline,
                    action: NotificationAction.HONOR_UP,
                    title: `${player} gained honor`,
                    description: `${username} reached honor ${item.honor}`,
                    metadata: { honor: String(item.honor) },
                });
            }
        }
    }

    // Keep local JSON in sync when running vite dev (no-op on GitHub Pages)
    await saveRankedDataToFile(modifiedData);
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