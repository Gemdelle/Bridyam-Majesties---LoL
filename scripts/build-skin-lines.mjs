/**
 * Build curated skin-lines catalog from Community Dragon.
 * Output: public/data/skin-lines.json
 *
 * Display order is intentional (user priority first).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'data', 'skin-lines.json');
const ROLES_OUT = path.join(__dirname, '..', 'public', 'data', 'champion-roles.json');

/**
 * splash: DDragon champion splash key "Champion_skinNum"
 * matchMode:
 *   - 'lines' = only CDragon skinline ids
 *   - 'winter' = winter-themed aggregate (includes winterblessed + snow + blackfrost + winter wonder)
 */
const FAMILY_MAP = [
  {
    id: 1,
    name: 'WINTER',
    cdragonIds: [187, 47, 28, 46, 48, 160, 129],
    splash: 'Annie_40', // Winterblessed Annie
    matchMode: 'winter',
  },
  {
    id: 2,
    name: 'WINTERBLESSED',
    cdragonIds: [187],
    splash: 'Warwick_45',
    matchMode: 'lines',
  },
  {
    id: 3,
    name: 'CAFE CUTIES',
    cdragonIds: [153],
    splash: 'Annie_22',
    matchMode: 'lines',
  },
  {
    id: 4,
    name: 'STAR GUARDIAN',
    cdragonIds: [19, 20, 119, 161],
    splash: 'Lux_6',
    matchMode: 'lines',
  },
  {
    id: 5,
    name: 'FAERIE COURT',
    cdragonIds: [191],
    splash: 'Katarina_47',
    matchMode: 'lines',
  },
  {
    id: 6,
    name: 'CRYSTAL ROSE',
    cdragonIds: [140],
    splash: 'Zyra_7',
    matchMode: 'lines',
  },
  {
    id: 7,
    name: 'WITHERED ROSE',
    cdragonIds: [141],
    splash: 'Elise_15',
    matchMode: 'lines',
  },
  {
    id: 8,
    name: 'PORCELAIN',
    cdragonIds: [154],
    splash: 'Amumu_34',
    matchMode: 'lines',
  },
  {
    id: 9,
    name: 'ARCANA',
    cdragonIds: [146],
    splash: 'Camille_11',
    matchMode: 'lines',
  },
  {
    id: 10,
    name: 'SPIRIT BLOSSOM',
    cdragonIds: [171, 218],
    splash: 'Ahri_27',
    matchMode: 'lines',
  },
  // Rest
  { id: 11, name: 'PROJECT', cdragonIds: [18], splash: 'Yasuo_2', matchMode: 'lines' },
  { id: 12, name: 'K/DA', cdragonIds: [91], splash: 'Ahri_15', matchMode: 'lines' },
  { id: 13, name: 'DARK STAR', cdragonIds: [54], splash: 'Thresh_5', matchMode: 'lines' },
  { id: 14, name: 'BLOOD MOON', cdragonIds: [12], splash: 'Akali_7', matchMode: 'lines' },
  { id: 15, name: 'HIGH NOON', cdragonIds: [39], splash: 'Lucian_8', matchMode: 'lines' },
  { id: 16, name: 'PENTAKILL', cdragonIds: [16, 151], splash: 'Karthus_3', matchMode: 'lines' },
  { id: 17, name: 'ARCADE', cdragonIds: [10, 11], splash: 'Sona_6', matchMode: 'lines' },
  { id: 18, name: 'PULSEFIRE', cdragonIds: [36], splash: 'Ezreal_5', matchMode: 'lines' },
  { id: 19, name: 'WORLDBREAKER', cdragonIds: [29], splash: 'Malphite_7', matchMode: 'lines' },
  { id: 20, name: 'COSMIC', cdragonIds: [43], splash: 'Lux_15', matchMode: 'lines' },
  { id: 21, name: 'BATTLECAST', cdragonIds: [25], splash: 'KogMaw_5', matchMode: 'lines' },
  { id: 22, name: 'ODYSSEY', cdragonIds: [73], splash: 'Jinx_13', matchMode: 'lines' },
  { id: 23, name: 'BATTLE ACADEMIA', cdragonIds: [94], splash: 'Ezreal_19', matchMode: 'lines' },
  { id: 24, name: 'CRIME CITY', cdragonIds: [51, 149], splash: 'Twitch_8', matchMode: 'lines' },
  { id: 25, name: 'DEBONAIR', cdragonIds: [23], splash: 'Jayce_2', matchMode: 'lines' },
  { id: 26, name: 'INFERNAL', cdragonIds: [86], splash: 'Brand_3', matchMode: 'lines' },
  { id: 27, name: 'DAWNBRINGER', cdragonIds: [124, 193], splash: 'Riven_16', matchMode: 'lines' },
  { id: 28, name: 'NIGHTBRINGER', cdragonIds: [125, 193], splash: 'Yasuo_9', matchMode: 'lines' },
  { id: 29, name: 'SOUL FIGHTER', cdragonIds: [196], splash: 'Sett_10', matchMode: 'lines' },
];

const WINTER_MATCH_KEYS = [
  'winter',
  'winterblessed',
  'winter wonder',
  'winter sports',
  'snow day',
  'snowdown',
  'snow moon',
  'blackfrost',
  'frosted',
];

const POSITION_TO_ROLE = {
  TOP: 'top',
  JUNGLE: 'jungle',
  MIDDLE: 'mid',
  BOTTOM: 'adc',
  UTILITY: 'support',
  SUPPORT: 'support',
};

async function buildChampionRoles() {
  const res = await fetch(
    'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json'
  );
  const data = await res.json();
  const byName = {};
  const byId = {};
  for (const champ of Object.values(data)) {
    const positions = champ.positions || [];
    const primary = POSITION_TO_ROLE[positions[0]] || 'mid';
    byName[String(champ.name).toLowerCase()] = primary;
    byId[champ.id] = primary;
  }
  const payload = { updatedAt: new Date().toISOString(), byName, byId };
  fs.writeFileSync(ROLES_OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote champion roles (${Object.keys(byName).length}) → ${ROLES_OUT}`);
  return byName;
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
  const lines = await linesRes.json();
  const skins = Object.values(await skinsRes.json());
  const lineById = new Map(lines.map((l) => [l.id, l]));

  const families = FAMILY_MAP.map((fam, index) => {
    const cdragonNames = fam.cdragonIds
      .map((id) => lineById.get(id)?.name)
      .filter(Boolean);

    const familySkins = skins
      .filter(
        (s) => !s.isBase && (s.skinLines || []).some((sl) => fam.cdragonIds.includes(sl.id))
      )
      .map((s) => {
        const champId = Math.floor(s.id / 1000);
        const skinNum = s.id % 1000;
        return {
          id: s.id,
          name: s.name,
          championId: champId,
          skinNum,
          rarity: s.rarity || '',
          cdragonLineIds: (s.skinLines || []).map((sl) => sl.id),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    let matchKeys = [
      fam.name.toLowerCase(),
      ...cdragonNames.map((n) => String(n).toLowerCase()),
      ...cdragonNames.map((n) =>
        String(n)
          .toLowerCase()
          .replace(/\s+season\s+\d+/g, '')
          .trim()
      ),
    ];

    if (fam.matchMode === 'winter') {
      matchKeys = [...WINTER_MATCH_KEYS, ...matchKeys];
    }

    // Dawnbringer / Nightbringer share line 193 — prefer name startsWith for clarity in matchKeys
    if (fam.name === 'DAWNBRINGER') {
      matchKeys = ['dawnbringer', ...matchKeys.filter((k) => !k.includes('night'))];
    }
    if (fam.name === 'NIGHTBRINGER') {
      matchKeys = ['nightbringer', ...matchKeys.filter((k) => !k.includes('dawn'))];
    }
    // Winterblessed should NOT use generic "winter" alone
    if (fam.name === 'WINTERBLESSED') {
      matchKeys = ['winterblessed'];
    }

    return {
      id: fam.id,
      sortOrder: index + 1,
      name: fam.name,
      splashart: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${fam.splash}.jpg`,
      cdragonIds: fam.cdragonIds,
      cdragonNames,
      matchKeys: [...new Set(matchKeys.filter(Boolean))],
      matchMode: fam.matchMode || 'lines',
      skinCount: familySkins.length,
      skins: familySkins,
    };
  });

  const payload = {
    updatedAt: new Date().toISOString(),
    source: 'communitydragon',
    families,
  };

  fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${families.length} families → ${OUT}`);
  families.forEach((f) => console.log(`  ${String(f.sortOrder).padStart(2)}. ${f.name}: ${f.skinCount}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
