import {
    fetchWinsFromSheet,
    fetchEssencerPetMap,
    fetchMasteriesFromSheet,
    isClaimedEssencer,
    normalizeSheetEssencer,
    getPetTypeFromSpecies,
    getPetStageFromLevel,
} from './sheetsWinsService';

export type AchievementKind = 'pet' | 'lol';

export interface AchievementDef {
    name: string;
    description: string;
    iconSrc: string;
    type: AchievementKind;
    achievementNumber: number;
    thresholds: number[];
}

/** Same base list as Achievements page */
export const ACHIEVEMENT_DEFS: AchievementDef[] = [
    {
        name: 'Ascension',
        description: 'Take a champion from 0 to mastery 10',
        iconSrc: '/images/masteries/mastery/10.png',
        type: 'lol',
        achievementNumber: 1,
        thresholds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    {
        name: 'Artisan',
        description: 'Level up champion masteries',
        iconSrc: '/images/masteries/mastery/level_plate.png',
        type: 'lol',
        achievementNumber: 2,
        thresholds: [1, 3, 5, 10, 15, 25, 50, 100, 200, 500],
    },
    {
        name: 'Battlelord',
        description: 'Play matches',
        iconSrc: '/images/ranked-btn/mission.png',
        type: 'lol',
        achievementNumber: 3,
        thresholds: [5, 15, 30, 75, 150, 300, 750, 1500, 3000, 7500],
    },
    {
        name: 'Victorious',
        description: 'Win matches',
        iconSrc: '/images/ranked-btn/wins.png',
        type: 'lol',
        achievementNumber: 4,
        thresholds: [1, 5, 15, 35, 75, 150, 350, 750, 1500, 3500],
    },
    {
        name: 'Initiate',
        description: 'Obtain first blood',
        iconSrc: '/images/masteries/mastery/1.png',
        type: 'lol',
        achievementNumber: 5,
        thresholds: [1, 2, 3, 5, 8, 12, 18, 25, 35, 50],
    },
    {
        name: 'Conqueror',
        description: 'Advance to the next division',
        iconSrc: '/images/lol-elements/tier-challenger.webp',
        type: 'lol',
        achievementNumber: 6,
        thresholds: [1, 3, 5, 8, 12, 18, 25, 35, 40, 50],
    },
    {
        name: 'Champion',
        description: 'Ascend to a higher tier',
        iconSrc: '/images/lol-elements/tier-challenger-heml.webp',
        type: 'lol',
        achievementNumber: 7,
        thresholds: [1, 2, 3, 5, 8, 12, 18, 22, 26, 30],
    },
    {
        name: 'Majesty',
        description: 'Redeem majesty accounts',
        iconSrc: '/images/ranked-btn/porveldam.png',
        type: 'lol',
        achievementNumber: 8,
        thresholds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    {
        name: 'Warrior',
        description: 'Win victorious champion ranked games',
        iconSrc: '/images/ranked-btn/gladasmy.png',
        type: 'lol',
        achievementNumber: 9,
        thresholds: [5, 15, 35, 75, 150, 300, 500, 750, 1000, 1500],
    },
    {
        name: 'Companion',
        description: 'Play games in premade',
        iconSrc: '/images/achievement/achievement-11-1.png',
        type: 'lol',
        achievementNumber: 11,
        thresholds: [1, 5, 15, 35, 75, 150, 250, 350, 425, 500],
    },
    {
        name: 'Questmaster',
        description: 'Complete missions',
        iconSrc: '/images/achievement/achievement-12-1.png',
        type: 'lol',
        achievementNumber: 12,
        thresholds: [5, 25, 75, 200, 500, 1000, 2000, 3500, 5500, 8000],
    },
    {
        name: 'Guardian',
        description: 'Pet your pet',
        iconSrc: '/images/achievement/achievement-10-1.png',
        type: 'pet',
        achievementNumber: 10,
        thresholds: [10, 50, 150, 500, 1000, 2000, 3500, 5000, 7500, 10000],
    },
];

export interface PlayerAchievementProgress {
    name: string;
    completedSteps: number; // 0-10
    value: number;
}

export interface PlayerAchievementRow {
    playerName: string;
    petType: string | null;
    petStage: number | null;
    achievements: PlayerAchievementProgress[];
    totalBadges: number;
    maxBadges: number;
    progressPercent: number;
}

const stepsFromValue = (value: number, thresholds: number[]): number => {
    let steps = 0;
    for (const t of thresholds) {
        if (value >= t) steps += 1;
        else break;
    }
    return Math.min(10, steps);
};

export const fetchPlayerAchievementLeaderboard = async (
    type: AchievementKind = 'lol'
): Promise<PlayerAchievementRow[]> => {
    const defs = ACHIEVEMENT_DEFS.filter((d) => d.type === type);
    const maxBadges = defs.length * 10;

    const [accounts, pets, masteries] = await Promise.all([
        fetchWinsFromSheet(),
        fetchEssencerPetMap(),
        fetchMasteriesFromSheet().catch(() => []),
    ]);

    type Agg = {
        name: string;
        wins: number;
        accounts: number;
        rankedIds: Set<number>;
        masterySum: number;
        mastery10: number;
        petLevel: number;
    };

    const byPlayer = new Map<string, Agg>();

    accounts.forEach((row) => {
        const name = normalizeSheetEssencer(row.essencer);
        if (!isClaimedEssencer(name)) return;
        const key = name.toLowerCase();
        let agg = byPlayer.get(key);
        if (!agg) {
            agg = {
                name,
                wins: 0,
                accounts: 0,
                rankedIds: new Set(),
                masterySum: 0,
                mastery10: 0,
                petLevel: 1,
            };
            byPlayer.set(key, agg);
        }
        agg.wins += Number(row.wins) || 0;
        agg.accounts += 1;
    });

    // Map username → essencer for mastery attribution
    const userToEssencer = new Map<string, string>();
    accounts.forEach((row) => {
        const essencer = normalizeSheetEssencer(row.essencer);
        if (!isClaimedEssencer(essencer)) return;
        userToEssencer.set(String(row.account || '').toLowerCase(), essencer);
    });

    masteries.forEach((m) => {
        const essencer =
            userToEssencer.get(String(m.username || '').toLowerCase()) ||
            normalizeSheetEssencer(m.username);
        if (!isClaimedEssencer(essencer)) return;
        const key = essencer.toLowerCase();
        let agg = byPlayer.get(key);
        if (!agg) {
            agg = {
                name: essencer,
                wins: 0,
                accounts: 0,
                rankedIds: new Set(),
                masterySum: 0,
                mastery10: 0,
                petLevel: 1,
            };
            byPlayer.set(key, agg);
        }
        const level = Number(m.champion_level) || 0;
        agg.masterySum += level;
        if (level >= 10) agg.mastery10 += 1;
        agg.rankedIds.add(Number(m.ranked_id) || 0);
    });

    pets.forEach((row, key) => {
        const agg = byPlayer.get(key);
        if (agg) agg.petLevel = Number(row.level) || 1;
    });

    const rows: PlayerAchievementRow[] = [...byPlayer.values()].map((agg) => {
        const petRow = pets.get(agg.name.toLowerCase());
        const petType = getPetTypeFromSpecies(petRow?.pet);
        const petStage = petType ? getPetStageFromLevel(petRow?.level ?? agg.petLevel) : null;

        const valueFor = (def: AchievementDef): number => {
            switch (def.name) {
                case 'Ascension':
                    return agg.mastery10;
                case 'Artisan':
                    return agg.masterySum;
                case 'Battlelord':
                    return agg.wins * 2; // approx games
                case 'Victorious':
                    return agg.wins;
                case 'Majesty':
                    return agg.accounts;
                case 'Guardian':
                    return agg.petLevel * 50;
                case 'Warrior':
                    return Math.floor(agg.wins / 2);
                default:
                    return 0;
            }
        };

        const achievements: PlayerAchievementProgress[] = defs.map((def) => {
            const value = valueFor(def);
            return {
                name: def.name,
                value,
                completedSteps: stepsFromValue(value, def.thresholds),
            };
        });

        const totalBadges = achievements.reduce((sum, a) => sum + a.completedSteps, 0);
        const progressPercent =
            maxBadges > 0 ? Math.round((totalBadges / maxBadges) * 100) : 0;

        return {
            playerName: agg.name,
            petType,
            petStage,
            achievements,
            totalBadges,
            maxBadges,
            progressPercent,
        };
    });

    return rows.sort(
        (a, b) => b.totalBadges - a.totalBadges || a.playerName.localeCompare(b.playerName)
    );
};
