/**
 * Sync champion masteries from Riot API into public/data/masteries.json
 *
 * SAFE BY DEFAULT:
 *   - dry-run (prints diff, does NOT write)
 *   - only updates accounts listed in --only
 *   - backs up masteries.json before any write
 *
 * Usage:
 *   set RIOT_API_KEY=RGAPI-...
 *   node scripts/sync-masteries-riot.mjs --ranked-id=51
 *   node scripts/sync-masteries-riot.mjs --ranked-id=51 --apply
 *   (Windows PowerShell: use single quotes if you pass --only='GEM Depurallire#GEM')
 *
 * Tag → platform (LA2 / LAS):
 *   #GEM → la2
 *   #LAS → la2
 *   override with --platform=la2
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MASTERIES_PATH = path.join(ROOT, 'public', 'data', 'masteries.json');
const RANKEDS_PATH = path.join(ROOT, 'public', 'data', 'rankeds.json');
const BACKUP_DIR = path.join(ROOT, 'public', 'data', 'backups');
const ENV_PATH = path.join(ROOT, '.env');

function loadDotEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

function resolveApiKey() {
  const raw = process.env.RIOT_API_KEY || process.env.RIOT_API_KEY_PERSONAL || '';
  return String(raw).trim().replace(/^["']|["']$/g, '');
}

const API_KEY = resolveApiKey();
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const CHECK_KEY = args.includes('--check-key');
const onlyArg = args.find(a => a.startsWith('--only='));
const rankedIdArg = args.find(a => a.startsWith('--ranked-id='));
const platformArg = args.find(a => a.startsWith('--platform='));
const PLATFORM_OVERRIDE = platformArg ? platformArg.slice('--platform='.length).trim() : null;

function readOnlyAccounts() {
  const fromFlag = onlyArg
    ? onlyArg.slice('--only='.length).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  if (fromFlag.length > 0) return fromFlag;

  if (rankedIdArg) {
    const rankeds = JSON.parse(fs.readFileSync(RANKEDS_PATH, 'utf8'));
    const ids = rankedIdArg.slice('--ranked-id='.length).split(',').map(s => Number(s.trim())).filter(Boolean);
    const usernames = ids
      .map(id => rankeds.find(r => r.id === id)?.username)
      .filter(Boolean);
    if (usernames.length !== ids.length) {
      const missing = ids.filter(id => !rankeds.find(r => r.id === id));
      throw new Error(`ranked_id not found in rankeds.json: ${missing.join(', ')}`);
    }
    return usernames;
  }

  return [];
}

const ONLY = readOnlyAccounts();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function tagToPlatform(tag) {
  const t = String(tag || '').toUpperCase();
  if (PLATFORM_OVERRIDE) return PLATFORM_OVERRIDE;
  // All Bridyam LA accounts live on LA2 routing
  if (t === 'GEM' || t === 'LAS' || t === 'LAN' || t === 'LA1' || t === 'LA2') return 'la2';
  return 'la2';
}

function parseRiotId(username) {
  const raw = String(username || '').trim();
  const hash = raw.lastIndexOf('#');
  if (hash === -1) throw new Error(`Invalid Riot ID (missing #): ${raw}`);
  return {
    gameName: raw.slice(0, hash).trim(),
    tagLine: raw.slice(hash + 1).trim()
  };
}

async function riotGet(url) {
  const res = await fetch(url, {
    headers: {
      'X-Riot-Token': API_KEY,
      Accept: 'application/json'
    }
  });
  if (res.status === 429) {
    const wait = Number(res.headers.get('Retry-After') || 3) * 1000;
    console.warn(`Rate limited, waiting ${wait}ms...`);
    await sleep(wait);
    return riotGet(url);
  }
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) {
      throw new Error(
        `Riot 401 Unauthorized (Unknown apikey)\n${body}\n\n` +
        'Checklist:\n' +
        '  1. Regenerate key at https://developer.riotgames.com/\n' +
        '  2. CMD: set RIOT_API_KEY=RGAPI-xxxx   (NO space after =)\n' +
        '  3. Or create .env in project root: RIOT_API_KEY=RGAPI-xxxx\n' +
        '  4. Run npm in the SAME terminal window after setting the key\n' +
        '  5. Dev keys expire every 24h — copy a fresh one'
      );
    }
    throw new Error(`Riot ${res.status} ${url}\n${body}`);
  }
  return res.json();
}

async function fetchMasteriesForAccount(username) {
  const { gameName, tagLine } = parseRiotId(username);
  const platform = tagToPlatform(tagLine);
  const encodedName = encodeURIComponent(gameName);
  const encodedTag = encodeURIComponent(tagLine);

  const account = await riotGet(
    `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`
  );
  await sleep(80);

  const masteries = await riotGet(
    `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}`
  );

  return {
    puuid: account.puuid,
    gameName: account.gameName,
    tagLine: account.tagLine,
    platform,
    masteries: masteries.map(m => ({
      champion_id: m.championId,
      champion_level: m.championLevel,
      champion_points: m.championPoints
    }))
  };
}

function summarize(masteries, n = 8) {
  return [...masteries]
    .sort((a, b) => b.champion_level - a.champion_level || b.champion_points - a.champion_points)
    .slice(0, n)
    .map(m => `  id=${m.champion_id} lv${m.champion_level} pts=${m.champion_points}`)
    .join('\n');
}

function backupMasteries() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(BACKUP_DIR, `masteries-${stamp}.json`);
  fs.copyFileSync(MASTERIES_PATH, dest);
  return dest;
}

function maskKey(key) {
  if (!key) return '(not set)';
  if (key.length <= 12) return '(too short — check copy/paste)';
  return `${key.slice(0, 8)}...${key.slice(-4)} (${key.length} chars)`;
}

async function main() {
  if (!API_KEY) {
    console.error(
      'Missing RIOT_API_KEY.\n\n' +
      'Option A — CMD (same window, no space after =):\n' +
      '  set RIOT_API_KEY=RGAPI-your-key\n' +
      '  npm run sync:masteries:depurallire\n\n' +
      'Option B — .env file in project root:\n' +
      '  RIOT_API_KEY=RGAPI-your-key\n\n' +
      'Get a key at https://developer.riotgames.com/'
    );
    process.exit(1);
  }

  if (!API_KEY.startsWith('RGAPI-')) {
    console.warn(`Warning: key does not start with RGAPI- (${maskKey(API_KEY)})`);
  } else {
    console.log(`API key: ${maskKey(API_KEY)}`);
  }

  if (CHECK_KEY) {
    await riotGet('https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/GEM%20Depurallire/GEM');
    console.log('✓ API key works');
    return;
  }

  if (ONLY.length === 0) {
    console.error('Refusing to run without --only=... or --ranked-id=... (safety).\nExample:\n  node scripts/sync-masteries-riot.mjs --ranked-id=51');
    process.exit(1);
  }

  const masteriesFile = JSON.parse(fs.readFileSync(MASTERIES_PATH, 'utf8'));
  const rankeds = JSON.parse(fs.readFileSync(RANKEDS_PATH, 'utf8'));

  console.log(`Mode: ${APPLY ? 'APPLY (will write)' : 'DRY-RUN (no write)'}`);
  console.log(`Accounts: ${ONLY.join(', ')}\n`);

  let changed = 0;

  for (const username of ONLY) {
    const ranked = rankeds.find(r => r.username === username);
    if (!ranked) {
      console.error(`✗ Not found in rankeds.json: ${username}`);
      continue;
    }

    const idx = masteriesFile.findIndex(
      e => e.ranked_id === ranked.id || e.username === username
    );
    const previous = idx >= 0 ? masteriesFile[idx].masteries : [];

    console.log(`→ Fetching ${username} (ranked_id=${ranked.id})...`);
    const live = await fetchMasteriesForAccount(username);

    console.log(`  Riot: ${live.gameName}#${live.tagLine} @ ${live.platform}`);
    console.log(`  Before: ${previous.length} champ masteries`);
    console.log(summarize(previous) || '  (empty)');
    console.log(`  After:  ${live.masteries.length} champ masteries`);
    console.log(summarize(live.masteries) || '  (empty)');

    const entry = {
      ranked_id: ranked.id,
      username,
      masteries: live.masteries
    };

    if (idx >= 0) masteriesFile[idx] = entry;
    else masteriesFile.push(entry);

    changed += 1;
    await sleep(120);
  }

  if (!APPLY) {
    console.log(`\nDry-run done (${changed} account(s)). Re-run with --apply to write.`);
    return;
  }

  const backup = backupMasteries();
  fs.writeFileSync(MASTERIES_PATH, JSON.stringify(masteriesFile, null, 2) + '\n', 'utf8');
  console.log(`\n✓ Wrote masteries.json (${changed} updated)`);
  console.log(`  Backup: ${backup}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
