import {
    fetchEssencerPetMap,
    getPetTypeFromSpecies,
    getPetStageFromLevel,
    isClaimedEssencer,
} from './sheetsWinsService';
import { fetchPets, type Pet, type PetAbility } from './petsService';
import { assetUrl } from '../utils/assetUrl';

const NEEDS_KEY = 'bridyam_garden_needs_v1';
const PASSWORDS_KEY = 'bridyam_pet_passwords_v1';

export type GardenNeeds = {
    love: number;
    hunger: number;
    energy: number;
    updatedAt: number;
};

export type GardenPet = {
    owner: string;
    species: string;
    petType: string;
    sheetLevel: number;
    stage: number;
    needs: GardenNeeds;
    catalog: Pet | null;
    imageSrc: string;
    x: number;
    y: number;
    facing: 1 | -1;
    activity: 'walk' | 'eat' | 'sleep' | 'idle';
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const defaultNeeds = (): GardenNeeds => ({
    love: 55 + Math.floor(Math.random() * 25),
    hunger: 45 + Math.floor(Math.random() * 35),
    energy: 50 + Math.floor(Math.random() * 35),
    updatedAt: Date.now(),
});

const loadNeedsMap = (): Record<string, GardenNeeds> => {
    try {
        return JSON.parse(localStorage.getItem(NEEDS_KEY) || '{}');
    } catch {
        return {};
    }
};

const saveNeedsMap = (map: Record<string, GardenNeeds>) => {
    localStorage.setItem(NEEDS_KEY, JSON.stringify(map));
};

const loadPasswords = (): Record<string, string> => {
    try {
        return JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    } catch {
        return {};
    }
};

const savePasswords = (map: Record<string, string>) => {
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(map));
};

/** Decay hunger/energy over time; auto-nudge when critically low (pets self-care). */
export const tickNeeds = (needs: GardenNeeds, now = Date.now()): GardenNeeds => {
    const elapsedMin = Math.max(0, (now - (needs.updatedAt || now)) / 60000);
    let { love, hunger, energy } = needs;
    hunger = clamp(hunger - elapsedMin * 1.2);
    energy = clamp(energy - elapsedMin * 0.9);
    love = clamp(love - elapsedMin * 0.15);

    // Auto eat / sleep when desperate
    if (hunger < 18) hunger = clamp(hunger + 35);
    if (energy < 15) energy = clamp(energy + 40);

    return { love, hunger, energy, updatedAt: now };
};

export const getNeedsForOwner = (owner: string): GardenNeeds => {
    const map = loadNeedsMap();
    const key = owner.toLowerCase();
    const existing = map[key];
    if (!existing) {
        const fresh = defaultNeeds();
        map[key] = fresh;
        saveNeedsMap(map);
        return fresh;
    }
    const ticked = tickNeeds(existing);
    map[key] = ticked;
    saveNeedsMap(map);
    return ticked;
};

export const updateNeedsForOwner = (
    owner: string,
    patch: Partial<Pick<GardenNeeds, 'love' | 'hunger' | 'energy'>>
): GardenNeeds => {
    const map = loadNeedsMap();
    const key = owner.toLowerCase();
    const base = tickNeeds(map[key] || defaultNeeds());
    const next: GardenNeeds = {
        love: clamp(patch.love ?? base.love),
        hunger: clamp(patch.hunger ?? base.hunger),
        energy: clamp(patch.energy ?? base.energy),
        updatedAt: Date.now(),
    };
    map[key] = next;
    saveNeedsMap(map);
    return next;
};

export const petCare = (owner: string, action: 'love' | 'feed' | 'sleep'): GardenNeeds => {
    const cur = getNeedsForOwner(owner);
    if (action === 'love') {
        return updateNeedsForOwner(owner, { love: cur.love + 12 });
    }
    if (action === 'feed') {
        return updateNeedsForOwner(owner, { hunger: cur.hunger + 28, love: cur.love + 3 });
    }
    return updateNeedsForOwner(owner, { energy: cur.energy + 32, love: cur.love + 2 });
};

/** Evolution stage from sheet level + love bond. */
export const resolveGardenStage = (sheetLevel: number, love: number): number => {
    const fromSheet = getPetStageFromLevel(sheetLevel);
    if (love >= 80) return Math.max(fromSheet, 3);
    if (love >= 45) return Math.max(fromSheet, 2);
    return fromSheet;
};

export const hasPetPassword = (owner: string): boolean => {
    const map = loadPasswords();
    return Boolean(map[owner.toLowerCase()]);
};

export const setPetPassword = (owner: string, password: string): void => {
    const map = loadPasswords();
    map[owner.toLowerCase()] = String(password || '').trim();
    savePasswords(map);
};

export const verifyPetPassword = (owner: string, password: string): boolean => {
    const map = loadPasswords();
    const stored = map[owner.toLowerCase()];
    if (!stored) return false;
    return stored === String(password || '').trim();
};

export const loadGardenPets = async (): Promise<GardenPet[]> => {
    const [petMap, catalog] = await Promise.all([fetchEssencerPetMap(), fetchPets().catch(() => [] as Pet[])]);
    const pets: GardenPet[] = [];
    let i = 0;
    petMap.forEach((row, key) => {
        if (!isClaimedEssencer(row.essencer)) return;
        const petType = getPetTypeFromSpecies(row.pet);
        if (!petType) return;
        const owner = row.essencer.trim();
        const needs = getNeedsForOwner(owner);
        const sheetLevel = Number(row.level) || 1;
        const stage = resolveGardenStage(sheetLevel, needs.love);
        const species = String(row.pet || '').trim();
        const catalogPet =
            catalog.find((p) => p.name.toLowerCase() === species.toLowerCase()) || null;
        pets.push({
            owner,
            species,
            petType,
            sheetLevel,
            stage,
            needs,
            catalog: catalogPet,
            imageSrc: assetUrl(`images/pets/pet-${petType}-${stage}.png`),
            x: 12 + ((i * 17) % 70),
            y: 28 + ((i * 13) % 45),
            facing: i % 2 === 0 ? 1 : -1,
            activity: 'walk',
        });
        i += 1;
    });
    return pets;
};

export type FightActionResult = {
    log: string;
    playerHp: number;
    enemyHp: number;
    done: boolean;
    winner: 'player' | 'enemy' | null;
};

export const abilityPower = (ability: PetAbility, stats: Pet['stats']): number => {
    const base =
        ability.type === 'ultimate' ? 28 : ability.type === 'offensive' ? 16 : ability.type === 'defensive' ? 8 : 12;
    const mult =
        ability.type === 'defensive'
            ? stats.instinct + stats.cleverness
            : stats.force * 2 + stats.pressure;
    return Math.max(6, Math.round(base + mult * 1.8 + Math.random() * 8));
};

export const sanctuaryAsset = (
    name: 'bg' | 'floor' | 'food' | 'sleep' | 'ground' | 'eat-spot' | 'sleep-spot'
): string => {
    const map: Record<string, string> = {
        bg: 'sanctuary-bg.png',
        floor: 'floor.png',
        food: 'food.png',
        sleep: 'sleep.png',
        ground: 'sanctuary-bg.png',
        'eat-spot': 'food.png',
        'sleep-spot': 'sleep.png',
    };
    return assetUrl(`images/sanctuary/${map[name] || name}`);
};

export const trophyAsset = (rankIndex: number): string => {
    // rankIndex 0 = 1st place
    if (rankIndex >= 0 && rankIndex < 5) {
        return assetUrl(`images/trophies/trophy-${rankIndex + 1}.png`);
    }
    return assetUrl('images/trophies/trophy-default.png');
};
