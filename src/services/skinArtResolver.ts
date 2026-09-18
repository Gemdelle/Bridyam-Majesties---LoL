/**
 * Data Dragon helpers for Add Skin (champion / skin dropdowns + art URLs).
 * Manual-add list = skins not in the permanent RP store (legacy + rewards).
 */

const norm = (s: string) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export type DdragonChampionOption = { id: string; name: string };

export type ManualSkinOption = {
  name: string;
  champId: string;
  champName: string;
  num: number;
  imageUrl: string;
  skinLine: string;
};

type CdragonSkinMeta = { isLegacy: boolean; name: string };

let ddragonVersion: string | null = null;
let champListCache: DdragonChampionOption[] | null = null;
let champIdByName: Map<string, string> | null = null;
let cdragonSkinsById: Map<number, CdragonSkinMeta> | null = null;

const getDdragonVersion = async (): Promise<string> => {
  if (ddragonVersion) return ddragonVersion;
  const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  if (!res.ok) throw new Error('ddragon versions failed');
  const versions: string[] = await res.json();
  ddragonVersion = versions[0] || '14.24.1';
  return ddragonVersion;
};

const ensureChampMaps = async (version: string) => {
  if (champListCache && champIdByName) return;
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
  );
  if (!res.ok) throw new Error('ddragon champion.json failed');
  const data = await res.json();
  const list: DdragonChampionOption[] = [];
  const map = new Map<string, string>();
  Object.values(data.data || {}).forEach((c: unknown) => {
    const champ = c as { id: string; name: string };
    list.push({ id: champ.id, name: champ.name });
    map.set(norm(champ.name), champ.id);
    map.set(norm(champ.id), champ.id);
  });
  list.sort((a, b) => a.name.localeCompare(b.name));
  // aliases
  map.set('kogmaw', 'KogMaw');
  map.set('wukong', 'MonkeyKing');
  map.set('renata glasc', 'Renata');
  map.set('nunu & willump', 'Nunu');
  champListCache = list;
  champIdByName = map;
};

/** Community Dragon marks retired / limited store skins with isLegacy. */
const ensureCdragonSkins = async () => {
  if (cdragonSkinsById) return;
  const res = await fetch(
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json'
  );
  if (!res.ok) throw new Error('cdragon skins.json failed');
  const data = (await res.json()) as Record<
    string,
    { isBase?: boolean; isLegacy?: boolean; name?: string }
  >;
  const map = new Map<number, CdragonSkinMeta>();
  Object.entries(data).forEach(([id, skin]) => {
    if (!skin || skin.isBase) return;
    const n = Number(id);
    if (!Number.isFinite(n)) return;
    map.set(n, { isLegacy: Boolean(skin.isLegacy), name: String(skin.name || '') });
  });
  cdragonSkinsById = map;
};

export const fetchChampionOptions = async (): Promise<DdragonChampionOption[]> => {
  const version = await getDdragonVersion();
  await ensureChampMaps(version);
  return champListCache || [];
};

export const splashUrlFor = (champId: string, num: number): string =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champId}_${num}.jpg`;

export const loadingUrlFor = (champId: string, num: number): string =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champId}_${num}.jpg`;

/** Prefer splash (wide, always available on DDragon) for team cards. */
export const artUrlFor = (champId: string, num: number): string => splashUrlFor(champId, num);

/** Reward / never-in-permanent-RP-shop name patterns (when CDragon isLegacy is false). */
const isRewardOrSpecialUnavailable = (skinName: string): boolean => {
  const n = norm(skinName);
  return (
    n.includes('victorious') ||
    n.startsWith('riot ') ||
    n.includes('championship ') ||
    n.includes('worlds ') ||
    n.startsWith('mercenary ') ||
    n.includes('silverfang') ||
    n.includes('judgement ') ||
    n.includes('underworld ') ||
    n.includes('blackthorn ') ||
    n.includes('phantom ') ||
    /\bwp\b/.test(n)
  );
};

/**
 * Skins not buyable year-round in the RP store: CDragon legacy + Victorious/rewards.
 * Chromas (name with parentheses) are excluded.
 */
const isManualOnlySkin = (skinName: string, skinId: number): boolean => {
  const n = norm(skinName);
  if (!n || n === 'default') return false;
  // Chromas: "Skin Name (Ruby)" or "... Chroma"
  if (/\([^)]+\)/.test(n) || /\bchroma\b/.test(n)) return false;

  const meta = cdragonSkinsById?.get(skinId);
  if (meta?.isLegacy) return true;
  return isRewardOrSpecialUnavailable(skinName);
};

const skinLineFromName = (skinName: string, isLegacy: boolean): string => {
  const n = norm(skinName);
  if (n.includes('victorious')) return 'victorious';
  if (n.includes('championship') || n.includes('worlds')) return 'worlds';
  if (isLegacy || n.includes('mercenary')) return 'legacy';
  return 'legacy';
};

export const fetchManualSkinOptionsForChampion = async (
  champId: string
): Promise<ManualSkinOption[]> => {
  if (!champId) return [];
  const version = await getDdragonVersion();
  await ensureChampMaps(version);
  try {
    await ensureCdragonSkins();
  } catch (err) {
    console.warn('CDragon skins unavailable, falling back to name patterns:', err);
  }
  const champName =
    champListCache?.find((c) => c.id === champId)?.name || champId;

  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${champId}.json`
  );
  if (!res.ok) return [];
  const payload = await res.json();
  const skins: { id: string; num: number; name: string }[] =
    payload?.data?.[champId]?.skins || [];

  return skins
    .filter((s) => isManualOnlySkin(s.name, Number(s.id)))
    .map((s) => {
      const skinId = Number(s.id);
      const legacy = Boolean(cdragonSkinsById?.get(skinId)?.isLegacy);
      return {
        name: s.name === 'default' ? champName : s.name,
        champId,
        champName,
        num: s.num,
        imageUrl: artUrlFor(champId, s.num),
        skinLine: skinLineFromName(s.name, legacy),
      };
    });
};

const guessChampFromSkinName = (skinName: string): string => {
  const parts = String(skinName || '').trim().split(/\s+/);
  return parts[parts.length - 1] || '';
};

/**
 * Resolve art for an already-saved manual skin (Sheet rows without image_url).
 */
export const resolveSkinImageUrl = async (
  skinName: string,
  champName?: string
): Promise<string> => {
  try {
    const version = await getDdragonVersion();
    await ensureChampMaps(version);
    const champKey = norm(champName || guessChampFromSkinName(skinName));
    const champId = champIdByName?.get(champKey);
    if (!champId) return '';

    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${champId}.json`
    );
    if (!res.ok) return '';
    const payload = await res.json();
    const skins: { id: string; num: number; name: string }[] =
      payload?.data?.[champId]?.skins || [];

    const want = norm(skinName);
    let match =
      skins.find((s) => norm(s.name) === want) ||
      skins.find((s) => norm(s.name).includes(want) || want.includes(norm(s.name)));

    if (!match && /victorious/.test(want)) {
      // Prefer base Victorious (no chroma suffix)
      match =
        skins.find((s) => /^victorious [^()]+$/i.test(s.name)) ||
        skins.find((s) => /victorious/.test(norm(s.name)));
    }

    const num = match?.num ?? 0;
    return artUrlFor(champId, num);
  } catch (err) {
    console.warn('resolveSkinImageUrl failed:', err);
    return '';
  }
};

export const resolveChampionPortraitUrl = async (champName: string): Promise<string> => {
  try {
    const version = await getDdragonVersion();
    await ensureChampMaps(version);
    const champId = champIdByName?.get(norm(champName));
    if (!champId) return '';
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champId}.png`;
  } catch {
    return '';
  }
};
