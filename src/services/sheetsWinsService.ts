// Google Apps Script web app that reads/writes ranked fields from Google Sheets
export const SHEETS_WINS_URL =
    'https://script.google.com/macros/s/AKfycby9hlSpsWIa7X_IJbt9-UxoZFdrJBDrZEjkcUk1cuFm5f9UM6zVl_wRbOVF54vZgMpo/exec';

export interface SheetWinsRow {
    row: number;
    account: string;
    essencer: string;
    wins: number;
}

interface SheetWinsResponse {
    ok: boolean;
    data?: SheetWinsRow[];
    error?: string | null;
    account?: string;
    wins?: number;
}

/** True when the account has a real claimed essencer in the sheet. */
export const isClaimedEssencer = (essencer: string | undefined | null): boolean => {
    const value = (essencer || '').trim();
    return value !== '' && value !== '-';
};

/** Normalize sheet essencer values: blank / "-" => unclaimed. */
export const normalizeSheetEssencer = (essencer: string | undefined | null): string => {
    const value = (essencer || '').trim();
    return isClaimedEssencer(value) ? value : '-';
};

/** Fetch all account rows from Google Sheets */
export const fetchWinsFromSheet = async (): Promise<SheetWinsRow[]> => {
    const response = await fetch(SHEETS_WINS_URL, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Sheets GET failed: ${response.status}`);
    }

    const payload: SheetWinsResponse = await response.json();
    if (!payload.ok || !payload.data) {
        throw new Error(payload.error || 'Sheets GET returned no data');
    }

    return payload.data.filter(row => {
        const account = (row.account || '').trim();
        return account !== '' && account.toUpperCase() !== 'GEM';
    });
};

/**
 * Update wins for one account in Google Sheets.
 * Uses text/plain to avoid CORS preflight with Apps Script.
 */
export const updateWinsInSheet = async (account: string, wins: number): Promise<boolean> => {
    const response = await fetch(SHEETS_WINS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ account, wins }),
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(`Sheets POST failed: ${response.status}`);
    }

    const payload: SheetWinsResponse = await response.json();
    if (!payload.ok) {
        throw new Error(payload.error || 'Sheets POST failed');
    }

    return true;
};
