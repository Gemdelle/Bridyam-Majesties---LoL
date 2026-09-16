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

interface SheetAccountsResponse {
    ok: boolean;
    data?: SheetAccountRow[];
    error?: string | null;
    account?: string;
}

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
    const response = await fetch(`${SHEETS_WINS_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Sheets GET failed: ${response.status}`);
    }

    const payload: SheetAccountsResponse = await response.json();
    if (!payload.ok || !payload.data) {
        throw new Error(payload.error || 'Sheets GET returned no data');
    }

    return payload.data.filter(row => {
        const account = (row.account || '').trim();
        return account !== '' && account.toUpperCase() !== 'GEM';
    });
};

export const fetchAccountsFromSheet = fetchWinsFromSheet;

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
