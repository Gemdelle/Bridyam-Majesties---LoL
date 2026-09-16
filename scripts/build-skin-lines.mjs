/**
 * Build curated skin-lines catalog from Community Dragon.
 * Output: public/data/skin-lines.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'data', 'skin-lines.json');

/** Our display families → Community Dragon skinline id(s) */
const FAMILY_MAP = [
  { id: 1, name: 'PROJECT', cdragonIds: [18], splash: 'Yasuo_2' },
  { id: 2, name: 'STAR GUARDIAN', cdragonIds: [19, 20, 119, 161], splash: 'Lux_7' },
  { id: 3, name: 'K/DA', cdragonIds: [91], splash: 'Ahri_14' },
  { id: 4, name: 'DARK STAR', cdragonIds: [54], splash: 'Thresh_5' },
  { id: 5, name: 'BLOOD MOON', cdragonIds: [12], splash: 'Akali_7' },
  { id: 6, name: 'HIGH NOON', cdragonIds: [39], splash: 'Lucian_8' },
  { id: 7, name: 'PENTAKILL', cdragonIds: [16, 151], splash: 'Karthus_3' },
  { id: 8, name: 'ARCADE', cdragonIds: [10, 11], splash: 'Corki_6' },
  { id: 9, name: 'PULSEFIRE', cdragonIds: [36], splash: 'Ezreal_5' },
  { id: 10, name: 'WORLDBREAKER', cdragonIds: [29], splash: 'Malphite_7' },
  { id: 11, name: 'COSMIC', cdragonIds: [43], splash: 'Lux_15' },
  { id: 12, name: 'BATTLECAST', cdragonIds: [25], splash: 'Velkoz_3' },
  { id: 13, name: 'ODYSSEY', cdragonIds: [73], splash: 'Jinx_13' },
  { id: 14, name: 'BATTLE ACADEMIA', cdragonIds: [94], splash: 'Ezreal_19' },
  { id: 15, name: 'SPIRIT BLOSSOM', cdragonIds: [171, 218], splash: 'Ahri_27' },
  { id: 16, name: 'CRIME CITY', cdragonIds: [51, 149], splash: 'Twitch_8' },
  { id: 17, name: 'DEBONAIR', cdragonIds: [23], splash: 'Jayce_2' },
  { id: 18, name: 'INFERNAL', cdragonIds: [86], splash: 'Brand_3' },
  { id: 19, name: 'ARCANA', cdragonIds: [146], splash: 'Riven_23' },
  { id: 20, name: 'DAWNBRINGER', cdragonIds: [124, 193], splash: 'Riven_16' },
  { id: 21, name: 'NIGHTBRINGER', cdragonIds: [125, 193], splash: 'Yasuo_9' },
  { id: 22, name: 'SOUL FIGHTER', cdragonIds: [196], splash: 'Sett_10' },
];

async function main() {
  const [linesRes, skinsRes] = await Promise.all([
    fetch(
      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skinlines.json'
    ),
    fetch(
      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json'
    ),
  ]);
  const lines = await linesRes.json();
  const skinsObj = await skinsRes.json();
  const skins = Object.values(skinsObj);

  const lineById = new Map(lines.map((l) => [l.id, l]));

  const families = FAMILY_MAP.map((fam) => {
    const cdragonNames = fam.cdragonIds
      .map((id) => lineById.get(id)?.name)
      .filter(Boolean);

    const familySkins = skins
      .filter((s) => !s.isBase && (s.skinLines || []).some((sl) => fam.cdragonIds.includes(sl.id)))
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

    // Match keys for LoLDB skinLines strings (lowercase)
    const matchKeys = [
      fam.name.toLowerCase(),
      ...cdragonNames.map((n) => String(n).toLowerCase()),
      // e.g. "star guardian season 4" should match STAR GUARDIAN
      ...cdragonNames.map((n) =>
        String(n)
          .toLowerCase()
          .replace(/\s+season\s+\d+/g, '')
          .trim()
      ),
    ];

    return {
      id: fam.id,
      name: fam.name,
      splashart: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${fam.splash}.jpg`,
      cdragonIds: fam.cdragonIds,
      cdragonNames,
      matchKeys: [...new Set(matchKeys.filter(Boolean))],
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
  families.forEach((f) => console.log(`  ${f.name}: ${f.skinCount} skins`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
