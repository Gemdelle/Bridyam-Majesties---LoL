/**
 * Data Dragon helpers for Add Skin (champion / skin dropdowns + art URLs).
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

let ddragonVersion: string | null = null;
let champListCache: DdragonChampionOption[] | null = null;
let champIdByName: Map<string, string> | null = null;

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

/**
 * Skins that LoLDB / account APIs usually miss — Victorious (+ chromas),
 * plus a few legacy / event patterns users add by hand.
 */
const isManualOnlySkin = (skinName: string): boolean => {
  const n = norm(skinName);
  if (n === 'default') return false;
  return (
    n.includes('victorious') ||
    n.startsWith('mercenary ') ||
    n.includes('silverfang') ||
    n.includes('underworld ') ||
    n.includes('blackthorn ') ||
    n.includes('judgement ') ||
    n.includes('phantom ') ||
    n.includes('riot ') ||
    n.includes('championship ') ||
    n.includes('worlds ') ||
    /\bwp\b/.test(n)
  );
};

const skinLineFromName = (skinName: string): string => {
  const n = norm(skinName);
  if (n.includes('victorious')) return 'victorious';
  if (n.includes('championship') || n.includes('worlds')) return 'worlds';
  if (n.includes('mercenary')) return 'legacy';
  return 'legacy';
};

export const fetchManualSkinOptionsForChampion = async (
  champId: string
): Promise<ManualSkinOption[]> => {
  if (!champId) return [];
  const version = await getDdragonVersion();
  await ensureChampMaps(version);
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
    .filter((s) => isManualOnlySkin(s.name))
    .map((s) => ({
      name: s.name === 'default' ? champName : s.name,
      champId,
      champName,
      num: s.num,
      imageUrl: artUrlFor(champId, s.num),
      skinLine: skinLineFromName(s.name),
    }));
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
