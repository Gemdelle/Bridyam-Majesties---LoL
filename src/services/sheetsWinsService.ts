// Google Apps Script web app backed by the ACCOUNTS sheet
export const SHEETS_WINS_URL =
    'https://script.google.com/macros/s/AKfycby9hlSpsWIa7X_IJbt9-UxoZFdrJBDrZEjkcUk1cuFm5f9UM6zVl_wRbOVF54vZgMpo/exec';

export interface SheetAccountRow {
    row: number;
    account: string;
    lv?: number;
    essencer: string;
    wins: number;
    honor?: number;
    solo?: string;
    flex?: string;
}

/** @deprecated use SheetAccountRow */
export type SheetWinsRow = SheetAccountRow;

export interface SheetEssencerRow {
    row: number;
    essencer: string;
    pet: string;
    level: number;
}

export interface SheetMasteryRow {
    row?: number;
    ranked_id: number;
    username: string;
    champion_id: number;
    champion_level: number;
    champion_points: number;
}

interface SheetAccountsResponse {
    ok: boolean;
    data?: SheetAccountRow[];
    essencers?: SheetEssencerRow[];
    masteries?: SheetMasteryRow[];
    error?: string | null;
    account?: string;
    updated?: number;
    inserted?: number;
    skipped?: number;
}

/** Map pet species name → image id (1-4) */
export const PET_SPECIES: Record<string, { id: string; type: string }> = {
    flarnit: { id: '1', type: 'fighter' },
    pettlewyn: { id: '2', type: 'venom' },
    peewee: { id: '3', type: 'water' },
    vindeloon: { id: '4', type: 'psychic' }
};

export const getPetTypeFromSpecies = (species: string | undefined | null): string | null => {
    const key = String(species || '').trim().toLowerCase();
    if (!key) return null;
    return PET_SPECIES[key]?.id ?? null;
};

export const getPetStageFromLevel = (level: number | undefined | null): number => {
    const lv = Number(level) || 1;
    if (lv >= 3) return 3;
    if (lv >= 2) return 2;
    return 1;
};

export const isClaimedEssencer = (essencer: string | undefined | null): boolean => {
    const value = (essencer || '').trim();
    return value !== '' && value !== '-';
};

export const normalizeSheetEssencer = (essencer: string | undefined | null): string => {
    const value = (essencer || '').trim();
    return isClaimedEssencer(value) ? value : '-';
};

/** Parse sheet elo text like "Platinum 1", "gold 4", "unranked" */
export const parseEloFromSheet = (raw: string | undefined | null): { tier: string; division: number } => {
    const value = String(raw || '').trim();
    if (!value || value.toLowerCase() === 'unranked' || value === '-') {
        return { tier: 'unranked', division: 4 };
    }

    const match = value.match(/^([a-zA-Z]+)\s*([1-4]|I{1,3}|IV)?$/i);
    if (!match) {
        return { tier: value.toLowerCase(), division: 4 };
    }

    const tier = match[1].toLowerCase();
    const divRaw = (match[2] || '4').toUpperCase();
    const roman: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
    const division = roman[divRaw] || Number(divRaw) || 4;
    return { tier, division };
};

export const formatEloForSheet = (elo: { tier: string; division: number } | undefined): string => {
    if (!elo || !elo.tier || elo.tier.toLowerCase() === 'unranked') return 'unranked';
    const tier = elo.tier.charAt(0).toUpperCase() + elo.tier.slice(1).toLowerCase();
    return `${tier} ${elo.division}`;
};

/** Fetch all account rows from Google Sheets */
export const fetchWinsFromSheet = async (): Promise<SheetAccountRow[]> => {
    const payload = await fetchSheetPayload();
    return payload.data.filter(row => {
        const account = (row.account || '').trim();
        return account !== '' && account.toUpperCase() !== 'GEM';
    });
};

/** Fetch essencer pet rows from Google Sheets ESSENCERS tab */
export const fetchEssencersFromSheet = async (): Promise<SheetEssencerRow[]> => {
    const payload = await fetchSheetPayload();
    return (payload.essencers || []).filter(row => isClaimedEssencer(row.essencer));
};

const fetchSheetPayload = async (): Promise<SheetAccountsResponse> => {
    const response = await fetch(`${SHEETS_WINS_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Sheets GET failed: ${response.status}`);
    }

    const payload: SheetAccountsResponse = await response.json();
    if (!payload.ok || !payload.data) {
        throw new Error(payload.error || 'Sheets GET returned no data');
    }
    return payload;
};

export const fetchAccountsFromSheet = fetchWinsFromSheet;

/**
 * Build essencer → pet lookup from ESSENCERS tab.
 * Keys are lowercase essencer names.
 */
export const fetchEssencerPetMap = async (): Promise<Map<string, SheetEssencerRow>> => {
    const rows = await fetchEssencersFromSheet();
    const map = new Map<string, SheetEssencerRow>();
    rows.forEach(row => {
        const key = row.essencer.trim().toLowerCase();
        const existing = map.get(key);
        const rowPet = String(row.pet || '').trim();
        const existingPet = String(existing?.pet || '').trim();
        // Prefer row with a pet assigned when the sheet has duplicate essencer names
        if (!existing || (!existingPet && rowPet)) {
            map.set(key, row);
        }
    });
    return map;
};

/**
 * Update one account in Google Sheets.
 * Uses text/plain to avoid CORS preflight with Apps Script.
 */
export const updateAccountInSheet = async (
    account: string,
    patch: Partial<{ wins: number; lv: number; honor: number; solo: string; flex: string; essencer: string }>
): Promise<boolean> => {
    const response = await fetch(SHEETS_WINS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ account, ...patch }),
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(`Sheets POST failed: ${response.status}`);
    }

    const payload: SheetAccountsResponse = await response.json();
    if (!payload.ok) {
        throw new Error(payload.error || 'Sheets POST failed');
    }

    return true;
};

/** Update wins for one account in Google Sheets. */
export const updateWinsInSheet = async (account: string, wins: number): Promise<boolean> => {
    return updateAccountInSheet(account, { wins });
};

/** Fetch mastery rows from Google Sheets MASTERY tab */
export const fetchMasteriesFromSheet = async (): Promise<SheetMasteryRow[]> => {
    const payload = await fetchSheetPayload();
    return (payload.masteries || []).filter(
        (row) => Number(row.ranked_id) > 0 && Number(row.champion_id) > 0
    );
};

/**
 * Upsert masteries into MASTERY tab.
 * mode 'max' = never lower values (API sync)
 * mode 'set' = overwrite (manual UI edit)
 */
export const upsertMasteriesToSheet = async (
    masteries: SheetMasteryRow[],
    mode: 'max' | 'set' = 'max'
): Promise<{ updated: number; inserted: number; skipped: number }> => {
    const response = await fetch(SHEETS_WINS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
            action: 'upsertMasteries',
            mode,
            masteries: masteries.map((m) => ({
                ranked_id: Number(m.ranked_id) || 0,
                username: String(m.username || ''),
                champion_id: Number(m.champion_id) || 0,
                champion_level: Number(m.champion_level) || 0,
                champion_points: Number(m.champion_points) || 0,
            })),
        }),
        redirect: 'follow',
    });

    if (!response.ok) {
        throw new Error(`Sheets mastery POST failed: ${response.status}`);
    }

    const payload: SheetAccountsResponse = await response.json();
    if (!payload.ok) {
        throw new Error(payload.error || 'Sheets mastery POST failed');
    }

    return {
        updated: Number(payload.updated) || 0,
        inserted: Number(payload.inserted) || 0,
        skipped: Number(payload.skipped) || 0,
    };
};
