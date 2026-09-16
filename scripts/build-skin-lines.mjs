/**
 * Build skin-lines catalog from Community Dragon.
 * - Featured families first (user priority)
 * - Remaining real skinlines under featured:false (Other view)
 * Also builds champion-roles.json (Meraki primary + all positions)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'data', 'skin-lines.json');
const ROLES_OUT = path.join(__dirname, '..', 'public', 'data', 'champion-roles.json');

const FEATURED = [
  {
    key: 'WINTER',
    cdragonIds: [187, 47, 28, 46, 48, 160, 129],
    splash: 'Twitch_12', // Ice King Twitch
    matchMode: 'winter',
    extraMatchKeys: [
      'winter',
      'winterblessed',
      'winter wonder',
      'winter sports',
      'snow day',
      'snowdown',
      'snow moon',
      'blackfrost',
      'frosted',
      'ice king',
    ],
  },
  {
    key: 'WINTERBLESSED',
    cdragonIds: [187],
    splash: 'Warwick_45',
    matchMode: 'winterblessed',
    extraMatchKeys: ['winterblessed'],
  },
  {
    key: 'CAFE CUTIES',
    cdragonIds: [153],
    splash: 'Annie_22',
    matchMode: 'lines',
  },
  {
    key: 'STAR GUARDIAN',
    cdragonIds: [19, 20, 119, 161],
    splash: 'Lux_6',
    matchMode: 'lines',
  },
  {
    key: 'FAERIE COURT',
    cdragonIds: [191],
    splash: 'Katarina_47',
    matchMode: 'lines',
  },
  {
    key: 'CRYSTAL ROSE',
    cdragonIds: [140],
    splash: 'Zyra_7',
    matchMode: 'lines',
  },
  {
    key: 'WITHERED ROSE',
    cdragonIds: [141],
    splash: 'Elise_15',
    matchMode: 'lines',
  },
  {
    key: 'PORCELAIN',
    cdragonIds: [154],
    splash: 'Amumu_34',
    matchMode: 'lines',
  },
  {
    key: 'ARCANA',
    cdragonIds: [146],
    splash: 'Camille_11',
    matchMode: 'lines',
  },
  {
    key: 'SPIRIT BLOSSOM',
    cdragonIds: [171, 218],
    splash: 'Ahri_27',
    matchMode: 'lines',
  },
];

const POSITION_TO_ROLE = {
  TOP: 'top',
  JUNGLE: 'jungle',
  MIDDLE: 'mid',
  BOTTOM: 'adc',
  UTILITY: 'support',
  SUPPORT: 'support',
};

function cdragonSplashUrl(splashPath) {
  if (!splashPath) return '';
  const cleaned = String(splashPath)
    .replace(/^\/lol-game-data\/assets\//i, '')
    .replace(/^ASSETS\//i, 'assets/')
    .toLowerCase();
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/${cleaned}`;
}

function ddragonSplash(splashKey) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${splashKey}.jpg`;
}

async function buildChampionRoles() {
  const res = await fetch(
    'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json'
  );
  const data = await res.json();
  const byName = {};
  const byNameAll = {};
  const byId = {};
  for (const champ of Object.values(data)) {
    const positions = champ.positions || [];
    const roles = positions
      .map((p) => POSITION_TO_ROLE[p])
      .filter(Boolean);
    // Prefer top for Camille even if Meraki lists support first
    if (String(champ.name).toLowerCase() === 'camille') {
      if (!roles.includes('top')) roles.unshift('top');
      else {
        roles.splice(roles.indexOf('top'), 1);
        roles.unshift('top');
      }
    }
    const primary = roles[0] || 'mid';
    byName[String(champ.name).toLowerCase()] = primary;
    byNameAll[String(champ.name).toLowerCase()] = roles.length ? roles : ['mid'];
    byId[champ.id] = primary;
  }
  const payload = { updatedAt: new Date().toISOString(), byName, byNameAll, byId };
  fs.writeFileSync(ROLES_OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote champion roles → ${ROLES_OUT}`);
  return payload;
}

function skinsForLineIds(skins, ids) {
  return skins
    .filter((s) => !s.isBase && (s.skinLines || []).some((sl) => ids.includes(sl.id)))
    .map((s) => ({
      id: s.id,
      name: s.name,
      championId: Math.floor(s.id / 1000),
      skinNum: s.id % 1000,
      rarity: s.rarity || '',
      cdragonLineIds: (s.skinLines || []).map((sl) => sl.id),
      tileUrl: cdragonSplashUrl(s.tilePath || s.splashPath),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  await buildChampionRoles();

  const [linesRes, skinsRes] = await Promise.all([
    fetch(
      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skinlines.json'
    ),
    fetch(
      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json'
    ),
  ]);
  const lines = (await linesRes.json()).filter((l) => l.id && l.name);
  const skins = Object.values(await skinsRes.json());
  const lineById = new Map(lines.map((l) => [l.id, l]));

  const featuredIds = new Set(FEATURED.flatMap((f) => f.cdragonIds));
  const families = [];
  let idCounter = 1;

  FEATURED.forEach((fam, index) => {
    const cdragonNames = fam.cdragonIds.map((id) => lineById.get(id)?.name).filter(Boolean);
    const familySkins = skinsForLineIds(skins, fam.cdragonIds);
    const matchKeys = [
      fam.key.toLowerCase(),
      ...(fam.extraMatchKeys || []),
      ...cdragonNames.map((n) => String(n).toLowerCase()),
      ...cdragonNames.map((n) =>
        String(n)
          .toLowerCase()
          .replace(/\s+season\s+\d+/g, '')
          .trim()
      ),
    ];

    families.push({
      id: idCounter++,
      sortOrder: index + 1,
      featured: true,
      name: fam.key,
      splashart: ddragonSplash(fam.splash),
      cdragonIds: fam.cdragonIds,
      cdragonNames,
      matchKeys: [...new Set(matchKeys.filter(Boolean))],
      matchMode: fam.matchMode || 'lines',
      skinCount: familySkins.length,
      skins: familySkins,
    });
  });

  // All remaining named skinlines
  const remaining = lines
    .filter((l) => !featuredIds.has(l.id))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  remaining.forEach((line) => {
    const familySkins = skinsForLineIds(skins, [line.id]);
    if (familySkins.length === 0) return;
    const splashart =
      familySkins[0]?.tileUrl ||
      ddragonSplash('Aatrox_0');
    families.push({
      id: idCounter++,
      sortOrder: 1000 + line.id,
      featured: false,
      name: String(line.name).toUpperCase(),
      splashart,
      cdragonIds: [line.id],
      cdragonNames: [line.name],
      matchKeys: [
        String(line.name).toLowerCase(),
        String(line.name)
          .toLowerCase()
          .replace(/\s+season\s+\d+/g, '')
          .trim(),
      ],
      matchMode: 'lines',
      skinCount: familySkins.length,
      skins: familySkins,
    });
  });

  const payload = {
    updatedAt: new Date().toISOString(),
    source: 'communitydragon',
    featuredCount: FEATURED.length,
    families,
  };
  fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `Wrote ${families.length} families (${FEATURED.length} featured, ${families.length - FEATURED.length} other) → ${OUT}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
