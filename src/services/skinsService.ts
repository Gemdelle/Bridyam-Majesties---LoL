import { assetUrl } from '../utils/assetUrl';

export interface SkinLineSkin {
  id: number;
  name: string;
  championId: number;
  skinNum: number;
  rarity: string;
  cdragonLineIds: number[];
}

export interface SkinFamily {
  id: number;
  name: string;
  splashart: string;
  description?: string;
  cdragonIds: number[];
  cdragonNames: string[];
  matchKeys: string[];
  skinCount: number;
  skins: SkinLineSkin[];
}

export interface OwnedSkin {
  name: string;
  champName: string;
  rarity: string;
  imageUrl: string;
  skinLines: string[];
}

export interface AccountSkins {
  ranked_id: number;
  username: string;
  skins: OwnedSkin[];
}

interface SkinLinesFile {
  families: SkinFamily[];
}

interface AccountSkinsFile {
  accounts: AccountSkins[];
}

let familiesCache: SkinFamily[] | null = null;
let ownershipCache: AccountSkins[] | null = null;

export const fetchSkinFamilies = async (): Promise<SkinFamily[]> => {
  if (familiesCache) return familiesCache;
  const res = await fetch(assetUrl(`data/skin-lines.json?t=${Date.now()}`), { cache: 'no-store' });
  if (!res.ok) throw new Error(`skin-lines.json ${res.status}`);
  const data: SkinLinesFile = await res.json();
  familiesCache = data.families || [];
  return familiesCache;
};

/** @deprecated alias for older imports */
export type SkinLine = SkinFamily;
export const fetchSkinLines = fetchSkinFamilies;

export const fetchAccountSkins = async (): Promise<AccountSkins[]> => {
  if (ownershipCache) return ownershipCache;
  try {
    const res = await fetch(assetUrl(`data/account-skins.json?t=${Date.now()}`), { cache: 'no-store' });
    if (!res.ok) {
      ownershipCache = [];
      return ownershipCache;
    }
    const data: AccountSkinsFile = await res.json();
    ownershipCache = data.accounts || [];
    return ownershipCache;
  } catch {
    ownershipCache = [];
    return ownershipCache;
  }
};

export const invalidateSkinsCache = (): void => {
  familiesCache = null;
  ownershipCache = null;
};

const normalize = (s: string) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** Does this owned skin belong to the family? */
export const skinBelongsToFamily = (skin: OwnedSkin, family: SkinFamily): boolean => {
  const keys = family.matchKeys.map(normalize);
  const lineHits = (skin.skinLines || []).map(normalize);
  if (lineHits.some((line) => keys.some((k) => line === k || line.includes(k) || k.includes(line)))) {
    return true;
  }
  // Fallback: skin name starts with family name (e.g. "PROJECT: Yasuo", "Star Guardian Rell")
  const skinName = normalize(skin.name);
  return keys.some((k) => skinName.startsWith(k) || skinName.includes(k));
};

export interface FamilyAccountOwnership {
  rankedId: number;
  username: string;
  essencer?: string;
  ownedCount: number;
  ownedSkins: OwnedSkin[];
}

export const getAccountsForFamily = (
  family: SkinFamily,
  accountSkins: AccountSkins[],
  rankedLookup: Map<number, { username: string; essencer?: string }>
): FamilyAccountOwnership[] => {
  const rows: FamilyAccountOwnership[] = [];

  for (const account of accountSkins) {
    const owned = (account.skins || []).filter((s) => skinBelongsToFamily(s, family));
    if (owned.length === 0) continue;
    const ranked = rankedLookup.get(account.ranked_id);
    rows.push({
      rankedId: account.ranked_id,
      username: account.username || ranked?.username || `Account ${account.ranked_id}`,
      essencer: ranked?.essencer,
      ownedCount: owned.length,
      ownedSkins: owned,
    });
  }

  return rows.sort(
    (a, b) => b.ownedCount - a.ownedCount || a.username.localeCompare(b.username)
  );
};

export const cleanAccountName = (username: string): string =>
  String(username || '')
    .replace(/^GEM\s+/i, '')
    .replace(/#[A-Za-z0-9]+$/, '')
    .trim();
