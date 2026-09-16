import { assetUrl } from '../utils/assetUrl';

export type LaneRole = 'top' | 'jungle' | 'mid' | 'adc' | 'support';

export const LANE_ROLES: { id: LaneRole; label: string; icon: string }[] = [
  {
    id: 'top',
    label: 'TOP',
    icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/icon-position-top.png',
  },
  {
    id: 'jungle',
    label: 'JG',
    icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/icon-position-jungle.png',
  },
  {
    id: 'mid',
    label: 'MID',
    icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/icon-position-middle.png',
  },
  {
    id: 'adc',
    label: 'ADC',
    icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/icon-position-bottom.png',
  },
  {
    id: 'support',
    label: 'SUPP',
    icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/icon-position-utility.png',
  },
];

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
  sortOrder?: number;
  name: string;
  splashart: string;
  description?: string;
  cdragonIds: number[];
  cdragonNames: string[];
  matchKeys: string[];
  matchMode?: string;
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

export interface FamilySkinOption {
  rankedId: number;
  username: string;
  essencer?: string;
  skin: OwnedSkin;
  role: LaneRole;
}

export interface RoleTeamColumn {
  role: LaneRole;
  label: string;
  icon: string;
  options: FamilySkinOption[];
}

interface SkinLinesFile {
  families: SkinFamily[];
}

interface AccountSkinsFile {
  accounts: AccountSkins[];
}

interface ChampionRolesFile {
  byName: Record<string, LaneRole>;
}

let familiesCache: SkinFamily[] | null = null;
let ownershipCache: AccountSkins[] | null = null;
let rolesCache: Record<string, LaneRole> | null = null;

export const fetchSkinFamilies = async (): Promise<SkinFamily[]> => {
  if (familiesCache) return familiesCache;
  const res = await fetch(assetUrl(`data/skin-lines.json?t=${Date.now()}`), { cache: 'no-store' });
  if (!res.ok) throw new Error(`skin-lines.json ${res.status}`);
  const data: SkinLinesFile = await res.json();
  familiesCache = (data.families || []).slice().sort((a, b) => (a.sortOrder || a.id) - (b.sortOrder || b.id));
  return familiesCache;
};

/** @deprecated alias */
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

export const fetchChampionRoles = async (): Promise<Record<string, LaneRole>> => {
  if (rolesCache) return rolesCache;
  try {
    const res = await fetch(assetUrl(`data/champion-roles.json?t=${Date.now()}`), { cache: 'no-store' });
    if (!res.ok) {
      rolesCache = {};
      return rolesCache;
    }
    const data: ChampionRolesFile = await res.json();
    rolesCache = data.byName || {};
    return rolesCache;
  } catch {
    rolesCache = {};
    return rolesCache;
  }
};

export const invalidateSkinsCache = (): void => {
  familiesCache = null;
  ownershipCache = null;
  rolesCache = null;
};

const normalize = (s: string) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const skinBelongsToFamily = (skin: OwnedSkin, family: SkinFamily): boolean => {
  const keys = family.matchKeys.map(normalize);
  const lineHits = (skin.skinLines || []).map(normalize);
  const skinName = normalize(skin.name);

  // Strict families: require key in skinLines or exact name prefix
  if (family.name === 'WINTERBLESSED') {
    return lineHits.some((l) => l.includes('winterblessed')) || skinName.includes('winterblessed');
  }

  if (lineHits.some((line) => keys.some((k) => line === k || line.includes(k) || k.includes(line)))) {
    return true;
  }

  return keys.some((k) => k.length >= 4 && (skinName.startsWith(k) || skinName.includes(k)));
};

export const getRoleForChampionName = (
  champName: string,
  rolesByName: Record<string, LaneRole>
): LaneRole => {
  const key = normalize(champName);
  return rolesByName[key] || rolesByName[champName.toLowerCase()] || 'mid';
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

/** Build TOP/JG/MID/ADC/SUPP columns with skin+account options for a family. */
export const getRoleTeamForFamily = (
  family: SkinFamily,
  accountSkins: AccountSkins[],
  rankedLookup: Map<number, { username: string; essencer?: string }>,
  rolesByName: Record<string, LaneRole>
): RoleTeamColumn[] => {
  const options: FamilySkinOption[] = [];

  for (const account of accountSkins) {
    for (const skin of account.skins || []) {
      if (!skinBelongsToFamily(skin, family)) continue;
      const role = getRoleForChampionName(skin.champName, rolesByName);
      const ranked = rankedLookup.get(account.ranked_id);
      options.push({
        rankedId: account.ranked_id,
        username: account.username || ranked?.username || `Account ${account.ranked_id}`,
        essencer: ranked?.essencer,
        skin,
        role,
      });
    }
  }

  return LANE_ROLES.map((lane) => {
    const roleOptions = options
      .filter((o) => o.role === lane.id)
      // Prefer unique accounts first, keep multiple skins visible
      .sort((a, b) => a.username.localeCompare(b.username) || a.skin.name.localeCompare(b.skin.name));

    return {
      role: lane.id,
      label: lane.label,
      icon: lane.icon,
      options: roleOptions,
    };
  });
};

export const cleanAccountName = (username: string): string =>
  String(username || '')
    .replace(/^GEM\s+/i, '')
    .replace(/#[A-Za-z0-9]+$/, '')
    .trim();

export const canFormFullTeam = (columns: RoleTeamColumn[]): boolean =>
  columns.every((col) => col.options.length > 0);
