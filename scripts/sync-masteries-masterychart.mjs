/**
 * Sync champion masteries from MasteryChart (no Riot API key).
 *
 * OP.GG loads mastery tables client-side; MasteryChart exposes them in HTML
 * with Riot champion IDs — same data, usable from a Node script.
 *
 * SAFE BY DEFAULT:
 *   - dry-run (prints diff, does NOT write)
 *   - only updates --ranked-id / --only accounts
 *   - backs up masteries.json before any write
 *
 * Usage (CMD):
 *   npm run sync:masteries:depurallire:mc
 *   npm run sync:masteries:depurallire:mc -- --apply
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MASTERIES_PATH = path.join(ROOT, 'public', 'data', 'masteries.json');
const RANKEDS_PATH = path.join(ROOT, 'public', 'data', 'rankeds.json');
const BACKUP_DIR = path.join(ROOT, 'public', 'data', 'backups');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const onlyArg = args.find((a) => a.startsWith('--only='));
const rankedIdArg = args.find((a) => a.startsWith('--ranked-id='));

const TAG_TO_REGION = {
  GEM: 'las',
  LAS: 'las',
  LAN: 'lan',
  NA: 'na',
  BR: 'br',
  EUW: 'euw',
  EUNE: 'eune',
};

function readOnlyAccounts() {
  const fromFlag = onlyArg
    ? onlyArg
        .slice('--only='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  if (fromFlag.length) return fromFlag;

  if (rankedIdArg) {
    const rankeds = JSON.parse(fs.readFileSync(RANKEDS_PATH, 'utf8'));
    const ids = rankedIdArg
      .slice('--ranked-id='.length)
      .split(',')
      .map((s) => Number(s.trim()))
      .filter(Boolean);
    const usernames = ids.map((id) => rankeds.find((r) => r.id === id)?.username).filter(Boolean);
    if (usernames.length !== ids.length) {
      const missing = ids.filter((id) => !rankeds.find((r) => r.id === id));
      throw new Error(`ranked_id not found: ${missing.join(', ')}`);
    }
    return usernames;
  }
  return [];
}

function parseRiotId(username) {
  const raw = String(username || '').trim();
  const hash = raw.lastIndexOf('#');
  if (hash === -1) throw new Error(`Invalid Riot ID: ${raw}`);
  return {
    gameName: raw.slice(0, hash).trim(),
    tagLine: raw.slice(hash + 1).trim(),
  };
}

function masteryChartUrl(username) {
  const { gameName, tagLine } = parseRiotId(username);
  const region = TAG_TO_REGION[tagLine.toUpperCase()] || 'las';
  const slug = `${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
  return `https://www.masterychart.com/profile/${region}/${slug}`;
}

async function loadChampionNameToId() {
  const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions = await versionsRes.json();
  const version = versions[0];
  const champsRes = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
  );
  const champs = await champsRes.json();
  const map = new Map();
  for (const champ of Object.values(champs.data)) {
    map.set(String(champ.name).toLowerCase(), Number(champ.key));
    map.set(String(champ.id).toLowerCase(), Number(champ.key));
  }
  // Common aliases
  map.set("nunu", map.get('nunu & willump') || 20);
  map.set("nunu & willump", map.get('nunu & willump') || 20);
  map.set("wukong", map.get('wukong') || 62);
  map.set("renata", map.get('renata glasc') || 888);
  return { version, map };
}

async function fetchMasteriesFromMasteryChart(username, nameToId) {
  const url = masteryChartUrl(username);
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`MasteryChart ${res.status} ${url}`);
  const html = await res.text();

  const byId = new Map();
  const unresolved = [];
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  for (const row of rows) {
    const body = row[1];
    const keys = [...body.matchAll(/sorttable_customkey="([^"]+)"/g)].map((x) => x[1]);
    if (keys.length < 3) continue;

    const champName = keys[0];
    const level = Number(keys[1]);
    const points = Number(keys[2]);
    if (!champName || !Number.isFinite(level) || level < 1) continue;

    const cidAttr = body.match(/data-cid="(\d+)"/);
    let championId = cidAttr ? Number(cidAttr[1]) : null;
    if (!championId) {
      championId =
        nameToId.get(champName.toLowerCase()) ||
        nameToId.get(champName.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
        null;
    }
    if (!championId) {
      unresolved.push(champName);
      continue;
    }

    byId.set(championId, {
      champion_id: championId,
      champion_level: level,
      champion_points: Number.isFinite(points) ? points : 0,
    });
  }

  const masteries = [...byId.values()].sort(
    (a, b) => b.champion_points - a.champion_points || b.champion_level - a.champion_level
  );

  if (masteries.length === 0) {
    throw new Error(`No masteries parsed from ${url}`);
  }

  return { url, masteries, unresolved };
}

function summarize(masteries, n = 8) {
  return masteries
    .slice(0, n)
    .map((m) => `  id=${m.champion_id} lv${m.champion_level} pts=${m.champion_points}`)
    .join('\n');
}

function backupMasteries() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(BACKUP_DIR, `masteries-${stamp}.json`);
  fs.copyFileSync(MASTERIES_PATH, dest);
  return dest;
}

async function main() {
  const ONLY = readOnlyAccounts();
  if (ONLY.length === 0) {
    console.error('Need --ranked-id=51 or --only=...');
    process.exit(1);
  }

  const masteriesFile = JSON.parse(fs.readFileSync(MASTERIES_PATH, 'utf8'));
  const rankeds = JSON.parse(fs.readFileSync(RANKEDS_PATH, 'utf8'));

  console.log(`Mode: ${APPLY ? 'APPLY (will write)' : 'DRY-RUN (no write)'}`);
  console.log(`Source: MasteryChart`);
  console.log(`Accounts: ${ONLY.join(', ')}\n`);

  const { version, map: nameToId } = await loadChampionNameToId();
  console.log(`Data Dragon version: ${version}\n`);

  let changed = 0;
  for (const username of ONLY) {
    const ranked = rankeds.find((r) => r.username === username);
    if (!ranked) {
      console.error(`✗ Not in rankeds.json: ${username}`);
      continue;
    }

    const idx = masteriesFile.findIndex(
      (e) => e.ranked_id === ranked.id || e.username === username
    );
    const previous = idx >= 0 ? masteriesFile[idx].masteries : [];

    console.log(`→ Fetching ${username} (ranked_id=${ranked.id})...`);
    const live = await fetchMasteriesFromMasteryChart(username, nameToId);
    console.log(`  URL: ${live.url}`);
    console.log(`  Before: ${previous.length} champ masteries`);
    console.log(summarize([...previous].sort((a, b) => b.champion_points - a.champion_points || b.champion_level - a.champion_level)));
    console.log(`  After:  ${live.masteries.length} champ masteries`);
    console.log(summarize(live.masteries));
    if (live.unresolved.length) {
      console.warn(`  Unresolved names: ${live.unresolved.join(', ')}`);
    }

    const entry = {
      ranked_id: ranked.id,
      username,
      masteries: live.masteries,
    };
    if (idx >= 0) masteriesFile[idx] = entry;
    else masteriesFile.push(entry);
    changed += 1;
  }

  if (!APPLY) {
    console.log(`\nDry-run done (${changed} account(s)). Re-run with --apply to write.`);
    return;
  }

  const backup = backupMasteries();
  fs.writeFileSync(MASTERIES_PATH, `${JSON.stringify(masteriesFile, null, 2)}\n`, 'utf8');
  console.log(`\n✓ Wrote masteries.json (${changed} updated)`);
  console.log(`  Backup: ${backup}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
