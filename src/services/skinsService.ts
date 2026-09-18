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
  splashUrl?: string;
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
  // Always re-merge Sheet + local so newly added skins show up after invalidate
  try {
    const res = await fetch(assetUrl(`data/account-skins.json?t=${Date.now()}`), { cache: 'no-store' });
    let base: AccountSkins[] = [];
    if (res.ok) {
      const data: AccountSkinsFile = await res.json();
      base = data.accounts || [];
    }
    ownershipCache = await mergeSheetAndManualSkins(base);
    return ownershipCache;
  } catch {
    ownershipCache = await mergeSheetAndManualSkins([]);
    return ownershipCache;
  }
};

const MANUAL_SKINS_KEY = 'bridyam-manual-account-skins-v1';

type ManualSkinEntry = {
  ranked_id: number;
  username: string;
  skin: OwnedSkin;
};

const loadManualSkins = (): ManualSkinEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(MANUAL_SKINS_KEY) || '[]') as ManualSkinEntry[];
  } catch {
    return [];
  }
};

const saveManualSkinsLocal = (entries: ManualSkinEntry[]) => {
  localStorage.setItem(MANUAL_SKINS_KEY, JSON.stringify(entries));
};

const upsertLocalManualSkin = (entry: ManualSkinEntry) => {
  const manual = loadManualSkins();
  const idx = manual.findIndex(
    (m) =>
      m.username.toLowerCase() === entry.username.toLowerCase() &&
      m.skin.name.toLowerCase() === entry.skin.name.toLowerCase()
  );
  if (idx >= 0) manual[idx] = entry;
  else manual.push(entry);
  saveManualSkinsLocal(manual);
};

const normalizeSkinLines = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* ignore */
    }
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return ['legacy'];
};

const mapSheetSkinRow = async (row: {
  ranked_id?: number;
  username?: string;
  skin_name?: string;
  champ_name?: string;
  rarity?: string;
  image_url?: string;
  skin_lines?: unknown;
}): Promise<ManualSkinEntry | null> => {
  const name = String(row.skin_name || '').trim();
  const username = String(row.username || '').trim();
  if (!name || !username) return null;
  const champName = String(row.champ_name || '').trim() || name.split(/\s+/).slice(-1)[0] || 'Unknown';
  let imageUrl = String(row.image_url || '').trim();
  // Always try to fill missing art (old Sheet rows / failed writes)
  if (!imageUrl) {
    const { resolveSkinImageUrl, resolveChampionPortraitUrl } = await import('./skinArtResolver');
    imageUrl =
      (await resolveSkinImageUrl(name, champName)) ||
      (await resolveChampionPortraitUrl(champName)) ||
      '';
  }
  return {
    ranked_id: Number(row.ranked_id) || 0,
    username,
    skin: {
      name,
      champName,
      rarity: String(row.rarity || 'kLegacy'),
      imageUrl,
      skinLines: normalizeSkinLines(row.skin_lines ?? ['victorious']),
    },
  };
};

const fetchManualSkinsFromSheet = async (): Promise<ManualSkinEntry[]> => {
  try {
    const { SHEETS_WINS_URL } = await import('./sheetsWinsService');
    // Prefer dedicated resource; fall back to main payload.skins (after redeploy)
    const urls = [
      `${SHEETS_WINS_URL}?resource=skins&t=${Date.now()}`,
      `${SHEETS_WINS_URL}?t=${Date.now()}`,
    ];
    let rows: unknown[] = [];
    for (const url of urls) {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) continue;
      const payload = await response.json();
      if (payload?.ok && Array.isArray(payload.skins)) {
        rows = payload.skins;
        break;
      }
    }

    const entries: ManualSkinEntry[] = [];
    for (const row of rows as Array<Record<string, unknown>>) {
      const mapped = await mapSheetSkinRow(row as Parameters<typeof mapSheetSkinRow>[0]);
      if (mapped) entries.push(mapped);
    }
    return entries;
  } catch (err) {
    console.warn('fetchManualSkinsFromSheet failed:', err);
    return [];
  }
};

const mergeEntriesIntoAccounts = (
  accounts: AccountSkins[],
  entries: ManualSkinEntry[]
): AccountSkins[] => {
  if (!entries.length) return accounts;
  const byId = new Map(accounts.map((a) => [a.ranked_id, { ...a, skins: [...a.skins] }]));
  const byUser = new Map(
    [...byId.values()].map((a) => [a.username.trim().toLowerCase(), a] as const)
  );

  entries.forEach((entry) => {
    if (!entry.skin?.name || !entry.username) return;
    let acc =
      (entry.ranked_id ? byId.get(entry.ranked_id) : undefined) ||
      byUser.get(entry.username.trim().toLowerCase());

    if (!acc) {
      acc = {
        ranked_id: entry.ranked_id || Date.now(),
        username: entry.username,
        skins: [],
      };
      byId.set(acc.ranked_id, acc);
      byUser.set(acc.username.trim().toLowerCase(), acc);
    }

    const existingIdx = acc.skins.findIndex(
      (s) => s.name.toLowerCase() === entry.skin.name.toLowerCase()
    );
    if (existingIdx >= 0) {
      // Prefer entry with an image
      if (entry.skin.imageUrl && !acc.skins[existingIdx].imageUrl) {
        acc.skins[existingIdx] = { ...acc.skins[existingIdx], ...entry.skin };
      } else if (entry.skin.imageUrl) {
        acc.skins[existingIdx] = {
          ...acc.skins[existingIdx],
          imageUrl: entry.skin.imageUrl,
          skinLines: entry.skin.skinLines?.length
            ? entry.skin.skinLines
            : acc.skins[existingIdx].skinLines,
        };
      }
    } else {
      acc.skins.push(entry.skin);
    }
  });
  return [...byId.values()];
};

const mergeSheetAndManualSkins = async (accounts: AccountSkins[]): Promise<AccountSkins[]> => {
  const fromSheet = await fetchManualSkinsFromSheet();
  const fromLocal = loadManualSkins();
  // Local last so just-added skins (with art) win over empty Sheet rows
  return mergeEntriesIntoAccounts(accounts, [...fromSheet, ...fromLocal]);
};

export const invalidateAccountSkinsCache = () => {
  ownershipCache = null;
};

/** Add a victorious / legacy / custom skin — persisted to Google Sheets SKINS tab (everyone sees it). */
export const addManualAccountSkin = async (input: {
  rankedId: number;
  username: string;
  skinName: string;
  champName?: string;
  skinLine?: string;
  imageUrl?: string;
}): Promise<AccountSkins[]> => {
  const skinName = String(input.skinName || '').trim();
  const username = String(input.username || '').trim();
  if (!skinName || !username) throw new Error('Skin name and account are required');

  const champGuess =
    String(input.champName || '').trim() ||
    skinName.split(/\s+/).slice(-1)[0] ||
    'Unknown';
  const line = String(input.skinLine || 'legacy').trim().toLowerCase() || 'legacy';

  let imageUrl = String(input.imageUrl || '').trim();
  if (!imageUrl) {
    const { resolveSkinImageUrl, resolveChampionPortraitUrl } = await import('./skinArtResolver');
    imageUrl = await resolveSkinImageUrl(skinName, champGuess);
    if (!imageUrl) {
      imageUrl = await resolveChampionPortraitUrl(champGuess);
    }
  }

  const skin: OwnedSkin = {
    name: skinName,
    champName: champGuess,
    rarity: 'kLegacy',
    imageUrl,
    skinLines: [line],
  };

  // Always keep a local copy so the UI updates even if Apps Script is not redeployed yet
  upsertLocalManualSkin({ ranked_id: input.rankedId, username, skin });

  // Shared source of truth: Google Sheets (requires latest sheets-wins-api.gs deploy)
  const { postToSheet } = await import('./sheetsWinsService');
  const ok = await postToSheet({
    action: 'appendSkin',
    skin: {
      ranked_id: input.rankedId,
      username,
      skin_name: skinName,
      champ_name: champGuess,
      rarity: 'kLegacy',
      image_url: imageUrl,
      skin_lines: [line],
    },
  });
  if (!ok) {
    console.warn('Sheets appendSkin may have failed — skin kept in localStorage.');
  }

  invalidateAccountSkinsCache();
  return fetchAccountSkins();
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

export const ROLE_CHAMP_PRIORITY: Partial<Record<LaneRole, string[]>> = {
  adc: ['twitch', 'miss fortune', 'jinx', "kog'maw", 'kogmaw'],
  support: ['thresh', 'leona', 'rell', 'nautilus'],
};

export const champRolePriority = (role: LaneRole, champName: string): number => {
  const list = ROLE_CHAMP_PRIORITY[role];
  if (!list?.length) return 100;
  const key = normalize(champName).replace(/\s+/g, ' ');
  const idx = list.findIndex((c) => {
    const n = normalize(c);
    return key === n || key.replace(/'/g, '') === n.replace(/'/g, '');
  });
  return idx === -1 ? 100 : idx;
};

export const skinBelongsToFamily = (skin: OwnedSkin, family: SkinFamily): boolean => {
  const keys = family.matchKeys.map(normalize);
  const lineHits = (skin.skinLines || []).map(normalize);
  const skinName = normalize(skin.name);

  if (family.matchMode === 'winterblessed' || family.name === 'WINTERBLESSED') {
    return lineHits.some((l) => l.includes('winterblessed')) || skinName.includes('winterblessed');
  }

  if (family.matchMode === 'nightbringer' || family.name === 'NIGHTBRINGER') {
    // Shared CDragon line with Dawnbringer — match by skin name only
    return skinName.includes('nightbringer');
  }

  if (family.matchMode === 'dawnbringer' || family.name === 'DAWNBRINGER') {
    return skinName.includes('dawnbringer');
  }

  // Pure Coven only — not Old God, not Broken Covenant
  if (family.matchMode === 'coven' || family.name === 'COVEN') {
    if (skinName.includes('old god') || skinName.includes('broken covenant')) return false;
    if (lineHits.some((l) => l.includes('broken covenant'))) return false;
    return (
      /^(prestige\s+)?coven\b/.test(skinName) ||
      skinName === 'the thousand-pierced bear' ||
      (lineHits.some((l) => l === 'coven') && skinName.includes('coven'))
    );
  }

  // Broken Covenant only — never pull plain Coven (substring trap: "broken covenant" contains "coven")
  if (family.matchMode === 'broken-covenant' || family.name === 'BROKEN COVENANT') {
    return (
      skinName.includes('broken covenant') ||
      lineHits.some((l) => l.includes('broken covenant'))
    );
  }

  if (
    family.matchMode === 'christmas' ||
    family.matchMode === 'navidad' ||
    family.name === 'CHRISTMAS' ||
    family.name === 'NAVIDAD'
  ) {
    return (
      lineHits.some((l) => l.includes('snowdown')) ||
      keys.some((k) => skinName.includes(k)) ||
      /santa|reindeer|mistletoe|happy elf|candy cane|bad santa/.test(skinName)
    );
  }

  if (family.matchMode === 'halloween' || family.name === 'HALLOWEEN') {
    return (
      lineHits.some((l) =>
        /bewitching|fright night|trick-or-treat|trick or treat|zombies vs slayers/.test(l)
      ) ||
      keys.some((k) => skinName.includes(k)) ||
      /bewitching|fright night|pumpkin|franken|batnivia|underworld/.test(skinName)
    );
  }

  if (family.matchMode === 'royal' || family.name === 'ROYAL') {
    if (/king of clubs|queen of diamonds|jack of hearts|ace of spades|mecha kingdoms|battle queen/.test(skinName)) {
      return false;
    }
    if (skinName.includes('lancer paragon')) return true;
    return (
      /^(royal|imperial|golden|lord|king|queen)\b/.test(skinName) ||
      skinName.includes('battle regalia') ||
      skinName.includes('royal guard') ||
      skinName.includes('majestic empress')
    );
  }

  if (lineHits.some((line) => keys.some((k) => line === k || line.includes(k) || k.includes(line)))) {
    return true;
  }

  return keys.some((k) => k.length >= 4 && (skinName.startsWith(k) || skinName.includes(k)));
};

/** Winter theme priority: winterblessed > winter wonder > freljord > winter/... */
export const getWinterSkinPriority = (skin: OwnedSkin): number => {
  const name = normalize(skin.name);
  const lines = (skin.skinLines || []).map(normalize).join(' ');
  const hay = `${name} ${lines}`;
  if (hay.includes('winterblessed')) return 0;
  if (hay.includes('winter wonder')) return 1;
  if (hay.includes('freljord')) return 2;
  if (
    hay.includes('winter') ||
    hay.includes('snow') ||
    hay.includes('frost') ||
    hay.includes('ice king')
  ) {
    return 3;
  }
  return 4;
};

/** Star Guardian > Pajama Guardian */
export const getStarGuardianPriority = (skin: OwnedSkin): number => {
  const name = normalize(skin.name);
  const lines = (skin.skinLines || []).map(normalize).join(' ');
  const hay = `${name} ${lines}`;
  if (hay.includes('pajama')) return 1;
  if (hay.includes('star guardian')) return 0;
  return 2;
};

export const sortSkinsForFamily = (
  skins: OwnedSkin[],
  family: SkinFamily,
  role?: LaneRole
): OwnedSkin[] => {
  const copy = skins.slice();
  copy.sort((a, b) => {
    // Family theme priority first (winterblessed / star guardian), then role champ priority
    if (family.matchMode === 'winter' || family.name === 'WINTER') {
      const wp = getWinterSkinPriority(a) - getWinterSkinPriority(b);
      if (wp !== 0) return wp;
    }
    if (family.name === 'STAR GUARDIAN') {
      const sp = getStarGuardianPriority(a) - getStarGuardianPriority(b);
      if (sp !== 0) return sp;
    }
    if (role) {
      const pr = champRolePriority(role, a.champName) - champRolePriority(role, b.champName);
      if (pr !== 0) return pr;
    }
    return a.name.localeCompare(b.name);
  });
  return copy;
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

/** Single display lane per champion (primary). Dual-role champs still counted via getRolesForChampionName. */
export const getPrimaryRoleForChampionName = (
  champName: string,
  rolesData: ChampionRolesFile
): LaneRole => {
  const key = normalize(champName);
  const primary = rolesData.byName?.[key] || rolesData.byName?.[champName.toLowerCase()];
  if (primary) return primary;
  const all = rolesData.byNameAll?.[key] || rolesData.byNameAll?.[champName.toLowerCase()];
  return (all && all[0]) || 'mid';
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

/** Group owned family skins by lane, then by account (for dropdowns).
 * Each champion appears on ONE lane only (primary role) so dual-role champs don't flicker. */
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
        // Display only on primary lane — dual-role champs still "can" play elsewhere but show once
        const primary = getPrimaryRoleForChampionName(skin.champName, rolesData);
        if (primary !== lane.id) continue;

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

    const accounts = [...byAccount.values()]
      .map((acc) => ({
        ...acc,
        skins: sortSkinsForFamily(acc.skins, family, lane.id),
      }))
      .sort((a, b) => {
        if (family.matchMode === 'winter' || family.name === 'WINTER') {
          const wa = Math.min(...a.skins.map((s) => getWinterSkinPriority(s)));
          const wb = Math.min(...b.skins.map((s) => getWinterSkinPriority(s)));
          if (wa !== wb) return wa - wb;
        }
        if (family.name === 'STAR GUARDIAN') {
          const sa = Math.min(...a.skins.map((s) => getStarGuardianPriority(s)));
          const sb = Math.min(...b.skins.map((s) => getStarGuardianPriority(s)));
          if (sa !== sb) return sa - sb;
        }
        const bestA = Math.min(...a.skins.map((s) => champRolePriority(lane.id, s.champName)));
        const bestB = Math.min(...b.skins.map((s) => champRolePriority(lane.id, s.champName)));
        return bestA - bestB || a.username.localeCompare(b.username);
      });

    return {
      role: lane.id,
      label: lane.label,
      icon: lane.icon,
      accounts,
    };
  });
};

export interface RoleSelection {
  rankedId: number;
  skinName: string;
}

const champKey = (name: string) => normalize(name);

/** Resolve owned skin for a selection. */
export const resolveSelectedSkin = (
  column: RoleTeamColumn,
  selection: RoleSelection | null | undefined
): OwnedSkin | null => {
  if (!column.accounts.length) return null;
  const acc =
    column.accounts.find((a) => a.rankedId === selection?.rankedId) || column.accounts[0];
  if (!acc) return null;
  return acc.skins.find((s) => s.name === selection?.skinName) || acc.skins[0] || null;
};

/** Champions already taken by other roles in the current team. */
export const getBlockedChampions = (
  columns: RoleTeamColumn[],
  selections: Partial<Record<LaneRole, RoleSelection>>,
  exceptRole?: LaneRole
): Set<string> => {
  const blocked = new Set<string>();
  for (const col of columns) {
    if (col.role === exceptRole) continue;
    const skin = resolveSelectedSkin(col, selections[col.role]);
    if (skin?.champName) blocked.add(champKey(skin.champName));
  }
  return blocked;
};

/** Pick first skin for an account whose champion is not blocked. */
export const firstAvailableSkin = (
  skins: OwnedSkin[],
  blocked: Set<string>
): OwnedSkin | null => skins.find((s) => !blocked.has(champKey(s.champName))) || null;

/**
 * Build initial role selections with unique champions across the 5 lanes
 * (same champ can't play two roles in one game).
 */
export const pickUniqueRoleSelections = (
  columns: RoleTeamColumn[]
): Partial<Record<LaneRole, RoleSelection>> => {
  const used = new Set<string>();
  const result: Partial<Record<LaneRole, RoleSelection>> = {};

  for (const col of columns) {
    let picked: RoleSelection | null = null;
    for (const acc of col.accounts) {
      const skin = firstAvailableSkin(acc.skins, used);
      if (skin) {
        used.add(champKey(skin.champName));
        picked = { rankedId: acc.rankedId, skinName: skin.name };
        break;
      }
    }
    if (picked) result[col.role] = picked;
  }

  return result;
};

/**
 * After a role change, re-pick any other roles that now share a champion.
 */
export const reconcileUniqueSelections = (
  columns: RoleTeamColumn[],
  selections: Partial<Record<LaneRole, RoleSelection>>,
  changedRole: LaneRole
): Partial<Record<LaneRole, RoleSelection>> => {
  const next = { ...selections };
  const changedSkin = resolveSelectedSkin(
    columns.find((c) => c.role === changedRole)!,
    next[changedRole]
  );
  const changedChamp = changedSkin ? champKey(changedSkin.champName) : '';

  for (const col of columns) {
    if (col.role === changedRole) continue;
    const skin = resolveSelectedSkin(col, next[col.role]);
    if (!skin || !changedChamp || champKey(skin.champName) !== changedChamp) continue;

    const blocked = getBlockedChampions(columns, next, col.role);
    let replaced: RoleSelection | null = null;
    for (const acc of col.accounts) {
      const alt = firstAvailableSkin(acc.skins, blocked);
      if (alt) {
        replaced = { rankedId: acc.rankedId, skinName: alt.name };
        break;
      }
    }
    if (replaced) next[col.role] = replaced;
    else delete next[col.role];
  }

  return next;
};

export const cleanAccountName = (username: string): string =>
  String(username || '')
    .replace(/^GEM\s+/i, '')
    .replace(/#[A-Za-z0-9]+$/, '')
    .trim();

export const canFormFullTeam = (columns: RoleTeamColumn[]): boolean =>
  columns.every((col) => col.accounts.length > 0);

/** How many of the 5 lanes can be filled for this family. */
export const countCoveredRoles = (
  family: SkinFamily,
  accountSkins: AccountSkins[],
  rankedLookup: Map<number, { username: string; essencer?: string }>,
  rolesData: ChampionRolesFile
): number => {
  const team = getRoleTeamForFamily(family, accountSkins, rankedLookup, rolesData);
  return team.filter((col) => col.accounts.length > 0).length;
};

/** Preferred champion for catalog splash (prefer owned skin of that champ when available). */
export const FAMILY_SPLASH_CHAMP: Record<string, string[]> = {
  WINTER: ['twitch'],
  WINTERBLESSED: ['hecarim'],
  FRELJORD: ['taliyah'],
  VICTORIOUS: ["kog'maw", 'kogmaw'],
  'STAR GUARDIAN': ["kai'sa", 'kaisa'],
  'BATTLE QUEENS': ['annie'],
  'FAERIE COURT': ['lillia'],
  'CAFE CUTIES': ['bard'],
  COVEN: ['syndra'],
  'WITHERED ROSE': ['syndra'],
  WARDEN: ['quinn'],
  PORCELAIN: ['amumu'],
  ARCANA: ['tahm kench'],
  'BROKEN COVENANT': ["cho'gath", 'chogath'],
  DAWNBRINGER: ['janna'],
  ROYAL: ['poppy'],
  'CRYSTAL ROSE': ['janna'],
  NIGHTBRINGER: ['aphelios'],
  'HIGH STAKES': ['syndra'],
  MARAUDER: ['alistar'],
  'SPIRIT BLOSSOM': ['akali'],
  HEARTBREAKERS: ['ashe'],
  HALLOWEEN: ['anivia'],
  CHRISTMAS: ["kog'maw", 'kogmaw'],
};

/** Prefer a splash of a skin we actually own for this family. */
export const getOwnedSplashForFamily = (
  family: SkinFamily,
  accountSkins: AccountSkins[]
): string => {
  const owned: OwnedSkin[] = [];
  for (const account of accountSkins) {
    for (const skin of account.skins || []) {
      if (skinBelongsToFamily(skin, family)) owned.push(skin);
    }
  }

  const preferred = FAMILY_SPLASH_CHAMP[family.name] || [];
  const ranked = owned.slice().sort((a, b) => {
    const pa = preferred.findIndex((p) => normalize(a.champName).includes(p));
    const pb = preferred.findIndex((p) => normalize(b.champName).includes(p));
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || a.name.localeCompare(b.name);
  });

  const pick = ranked[0];
  if (pick) {
    const matchesPreferred =
      preferred.length === 0 ||
      preferred.some((p) => normalize(pick.champName).includes(p));
    // If a preferred champ is set but we don't own it, keep the curated catalog splash.
    if (matchesPreferred) {
      const catalog = family.skins?.find((s) => s.name === pick.name);
      if (catalog?.splashUrl) return catalog.splashUrl;
      if (pick.imageUrl) return pick.imageUrl;
      if (catalog?.tileUrl) return catalog.tileUrl;
    }
  }

  return family.splashart;
};

export const FEATURED_PRIORITY_ORDER = [
  'WINTER',
  'WINTERBLESSED',
  'FRELJORD',
  'VICTORIOUS',
  'STAR GUARDIAN',
  'BATTLE QUEENS',
];

/** Always show these last among featured families. */
export const FEATURED_TRAILING_ORDER = ['HEARTBREAKERS', 'HALLOWEEN', 'CHRISTMAS'];
