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
  tileUrl?: string;
}

export interface SkinFamily {
  id: number;
  sortOrder?: number;
  featured?: boolean;
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

export interface RoleAccountOption {
  rankedId: number;
  username: string;
  essencer?: string;
  skins: OwnedSkin[];
}

export interface RoleTeamColumn {
  role: LaneRole;
  label: string;
  icon: string;
  accounts: RoleAccountOption[];
}

interface SkinLinesFile {
  families: SkinFamily[];
}

interface AccountSkinsFile {
  accounts: AccountSkins[];
}

interface ChampionRolesFile {
  byName: Record<string, LaneRole>;
  byNameAll?: Record<string, LaneRole[]>;
}

let familiesCache: SkinFamily[] | null = null;
let ownershipCache: AccountSkins[] | null = null;
let rolesCache: ChampionRolesFile | null = null;

export const fetchSkinFamilies = async (): Promise<SkinFamily[]> => {
  if (familiesCache) return familiesCache;
  const res = await fetch(assetUrl(`data/skin-lines.json?t=${Date.now()}`), { cache: 'no-store' });
  if (!res.ok) throw new Error(`skin-lines.json ${res.status}`);
  const data: SkinLinesFile = await res.json();
  familiesCache = (data.families || [])
    .slice()
    .sort((a, b) => (a.sortOrder || a.id) - (b.sortOrder || b.id));
  return familiesCache;
};

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

export const fetchChampionRoles = async (): Promise<ChampionRolesFile> => {
  if (rolesCache) return rolesCache;
  try {
    const res = await fetch(assetUrl(`data/champion-roles.json?t=${Date.now()}`), { cache: 'no-store' });
    if (!res.ok) {
      rolesCache = { byName: {}, byNameAll: {} };
      return rolesCache;
    }
    rolesCache = await res.json();
    return rolesCache;
  } catch {
    rolesCache = { byName: {}, byNameAll: {} };
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

  if (family.matchMode === 'winterblessed' || family.name === 'WINTERBLESSED') {
    return lineHits.some((l) => l.includes('winterblessed')) || skinName.includes('winterblessed');
  }

  if (lineHits.some((line) => keys.some((k) => line === k || line.includes(k) || k.includes(line)))) {
    return true;
  }

  return keys.some((k) => k.length >= 4 && (skinName.startsWith(k) || skinName.includes(k)));
};

export const getRolesForChampionName = (
  champName: string,
  rolesData: ChampionRolesFile
): LaneRole[] => {
  const key = normalize(champName);
  const all = rolesData.byNameAll?.[key] || rolesData.byNameAll?.[champName.toLowerCase()];
  if (all?.length) return all;
  const primary = rolesData.byName?.[key] || rolesData.byName?.[champName.toLowerCase()];
  return primary ? [primary] : ['mid'];
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

/** Group owned family skins by lane, then by account (for dropdowns). */
export const getRoleTeamForFamily = (
  family: SkinFamily,
  accountSkins: AccountSkins[],
  rankedLookup: Map<number, { username: string; essencer?: string }>,
  rolesData: ChampionRolesFile
): RoleTeamColumn[] => {
  return LANE_ROLES.map((lane) => {
    const byAccount = new Map<number, RoleAccountOption>();

    for (const account of accountSkins) {
      for (const skin of account.skins || []) {
        if (!skinBelongsToFamily(skin, family)) continue;
        const roles = getRolesForChampionName(skin.champName, rolesData);
        if (!roles.includes(lane.id)) continue;

        const ranked = rankedLookup.get(account.ranked_id);
        const existing = byAccount.get(account.ranked_id);
        if (existing) {
          if (!existing.skins.some((s) => s.name === skin.name)) {
            existing.skins.push(skin);
          }
        } else {
          byAccount.set(account.ranked_id, {
            rankedId: account.ranked_id,
            username: account.username || ranked?.username || `Account ${account.ranked_id}`,
            essencer: ranked?.essencer,
            skins: [skin],
          });
        }
      }
    }

    const accounts = [...byAccount.values()].sort((a, b) =>
      a.username.localeCompare(b.username)
    );

    return {
      role: lane.id,
      label: lane.label,
      icon: lane.icon,
      accounts,
    };
  });
};

export const cleanAccountName = (username: string): string =>
  String(username || '')
    .replace(/^GEM\s+/i, '')
    .replace(/#[A-Za-z0-9]+$/, '')
    .trim();

export const canFormFullTeam = (columns: RoleTeamColumn[]): boolean =>
  columns.every((col) => col.accounts.length > 0);
