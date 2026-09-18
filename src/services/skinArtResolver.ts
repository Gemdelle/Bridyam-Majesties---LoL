/**
 * Resolve splash/tile art for manually added skins via Riot Data Dragon.
 * You don't need to hunt images — we look them up by skin + champion name.
 */

const norm = (s: string) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

let ddragonVersion: string | null = null;
let champIdByName: Map<string, string> | null = null;

const getDdragonVersion = async (): Promise<string> => {
  if (ddragonVersion) return ddragonVersion;
  const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  if (!res.ok) throw new Error('ddragon versions failed');
  const versions: string[] = await res.json();
  ddragonVersion = versions[0] || '14.24.1';
  return ddragonVersion;
};

const getChampIdMap = async (version: string): Promise<Map<string, string>> => {
  if (champIdByName) return champIdByName;
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
  );
  if (!res.ok) throw new Error('ddragon champion.json failed');
  const data = await res.json();
  const map = new Map<string, string>();
  Object.values(data.data || {}).forEach((c: unknown) => {
    const champ = c as { id: string; name: string };
    map.set(norm(champ.name), champ.id);
    map.set(norm(champ.id), champ.id);
  });
  // Common aliases
  map.set('kogmaw', 'KogMaw');
  map.set('kog maw', 'KogMaw');
  map.set('jarvan iv', 'JarvanIV');
  map.set('jarvan', 'JarvanIV');
  map.set('lee sin', 'LeeSin');
  map.set('master yi', 'MasterYi');
  map.set('miss fortune', 'MissFortune');
  map.set('tahm kench', 'TahmKench');
  map.set('twisted fate', 'TwistedFate');
  map.set('xin zhao', 'XinZhao');
  map.set('aurelion sol', 'AurelionSol');
  map.set("belveth", 'Belveth');
  map.set("bel'veth", 'Belveth');
  map.set('cho gath', 'Chogath');
  map.set("cho'gath", 'Chogath');
  map.set('dr mundo', 'DrMundo');
  map.set('nunu', 'Nunu');
  map.set('nunu & willump', 'Nunu');
  map.set('renata glasc', 'Renata');
  map.set('wukong', 'MonkeyKing');
  champIdByName = map;
  return map;
};

const guessChampFromSkinName = (skinName: string): string => {
  // "Victorious Orianna" → Orianna; "Mercenary Katarina" → Katarina
  const parts = String(skinName || '').trim().split(/\s+/);
  return parts[parts.length - 1] || '';
};

/**
 * Returns a Community Dragon / Data Dragon splash tile URL, or '' if not found.
 */
export const resolveSkinImageUrl = async (
  skinName: string,
  champName?: string
): Promise<string> => {
  try {
    const version = await getDdragonVersion();
    const idMap = await getChampIdMap(version);
    const champKey = norm(champName || guessChampFromSkinName(skinName));
    const champId = idMap.get(champKey);
    if (!champId) return '';

    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${champId}.json`
    );
    if (!res.ok) return '';
    const payload = await res.json();
    const skins: { id: string; num: number; name: string }[] =
      payload?.data?.[champId]?.skins || [];

    const want = norm(skinName);
    const wantShort = want.replace(norm(champId), '').replace(champKey, '').trim();

    let match =
      skins.find((s) => norm(s.name) === want) ||
      skins.find((s) => norm(s.name).includes(want) || want.includes(norm(s.name))) ||
      (wantShort
        ? skins.find((s) => {
            const n = norm(s.name);
            return n.includes(wantShort) || wantShort.includes(n.replace(champKey, '').trim());
          })
        : undefined);

    // Victorious / Prestige partials
    if (!match && /victorious/.test(want)) {
      match = skins.find((s) => /victorious/.test(norm(s.name)));
    }

    const num = match?.num ?? 0;
    // Data Dragon splash is the most reliable public URL for any skin num
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champId}_${num}.jpg`;
  } catch (err) {
    console.warn('resolveSkinImageUrl failed:', err);
    return '';
  }
};

/** Champ portrait fallback when skin art is missing */
export const resolveChampionPortraitUrl = async (champName: string): Promise<string> => {
  try {
    const version = await getDdragonVersion();
    const idMap = await getChampIdMap(version);
    const champId = idMap.get(norm(champName));
    if (!champId) return '';
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champId}.png`;
  } catch {
    return '';
  }
};
