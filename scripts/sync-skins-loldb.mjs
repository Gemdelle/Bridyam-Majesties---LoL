/**
 * Sync owned skins from LoLDB profiles into public/data/account-skins.json
 *
 * SAFE BY DEFAULT: dry-run unless --apply
 *
 * Usage:
 *   node scripts/sync-skins-loldb.mjs --ranked-id=51
 *   node scripts/sync-skins-loldb.mjs --all --apply
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RANKEDS_PATH = path.join(ROOT, 'public', 'data', 'rankeds.json');
const OUT_PATH = path.join(ROOT, 'public', 'data', 'account-skins.json');
const BACKUP_DIR = path.join(ROOT, 'public', 'data', 'backups');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ALL = args.includes('--all');
const rankedIdArg = args.find((a) => a.startsWith('--ranked-id='));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function tagToLolDbRegion(tag) {
  const t = String(tag || '').toUpperCase();
  if (t === 'GEM' || t === 'LAS' || t === 'LA2') return 'la2';
  if (t === 'LAN' || t === 'LA1') return 'la1';
  return 'la2';
}

function lolDbProfileUrl(username) {
  const hash = username.lastIndexOf('#');
  const gameName = username.slice(0, hash).trim();
  const tag = username.slice(hash + 1).trim();
  const region = tagToLolDbRegion(tag);
  const slug = `${gameName}-${tag}`.toLowerCase().replace(/\s+/g, '%20');
  return `https://loldb.info/profiles/${region}/${slug}`;
}

function extractOwnedSkins(html) {
  // LoLDB RSC payload escapes quotes: \"skins\":{\"owned\":[...
  const markers = ['\\"skins\\":{\\"owned\\":[', '"skins":{"owned":['];
  let start = -1;
  let marker = '';
  for (const m of markers) {
    const idx = html.indexOf(m);
    if (idx !== -1) {
      start = idx;
      marker = m;
      break;
    }
  }
  if (start === -1) return [];

  const from = start + (marker.startsWith('\\') ? '\\"skins\\":'.length : '"skins":'.length);
  // Walk escaped or plain JSON object
  let depth = 0;
  let end = -1;
  let inString = false;
  let escaped = false;

  for (let p = from; p < html.length; p++) {
    const ch = html[p];
    // In escaped RSC blobs, strings look like \"...\"
    if (marker.startsWith('\\')) {
      if (!inString) {
        if (ch === '{' && html[p - 1] !== '\\') {
          // unescaped { unlikely; braces are not escaped
        }
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            end = p + 1;
            break;
          }
        }
      }
    } else {
      if (ch === '"' && !escaped) inString = !inString;
      escaped = inString && ch === '\\' && !escaped;
      if (!inString) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            end = p + 1;
            break;
          }
        }
      }
    }
  }

  // Simpler approach for escaped payload: unescape slice then parse
  if (marker.startsWith('\\')) {
    // Find matching closing by counting { } ignoring those inside strings carefully
    depth = 0;
    end = -1;
    for (let p = from; p < html.length; p++) {
      const ch = html[p];
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          end = p + 1;
          break;
        }
      }
    }
    if (end === -1) return [];
    const raw = html.slice(from, end);
    // Convert \" -> " and \\ -> \
    const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    try {
      const parsed = JSON.parse(unescaped);
      return (parsed.owned || []).map((s) => ({
        name: s.name,
        champName: s.champName,
        rarity: s.rarity || '',
        imageUrl: s.imageUrl || '',
        skinLines: (s.skinLines || []).map((x) => String(x).toLowerCase()),
      }));
    } catch (e) {
      console.warn('Failed to parse escaped skins JSON', e.message);
      return [];
    }
  }

  if (end === -1) return [];
  try {
    const parsed = JSON.parse(html.slice(from, end));
    return (parsed.owned || []).map((s) => ({
      name: s.name,
      champName: s.champName,
      rarity: s.rarity || '',
      imageUrl: s.imageUrl || '',
      skinLines: (s.skinLines || []).map((x) => String(x).toLowerCase()),
    }));
  } catch {
    return [];
  }
}

async function fetchAccountSkins(username) {
  const url = lolDbProfileUrl(username);
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`LoLDB ${res.status} ${url}`);
  const html = await res.text();
  const skins = extractOwnedSkins(html);
  return { url, skins };
}

function selectAccounts(rankeds) {
  if (ALL) return rankeds;
  if (rankedIdArg) {
    const ids = rankedIdArg
      .slice('--ranked-id='.length)
      .split(',')
      .map((s) => Number(s.trim()))
      .filter(Boolean);
    return rankeds.filter((r) => ids.includes(r.id));
  }
  throw new Error('Pass --all or --ranked-id=51');
}

async function main() {
  const rankeds = JSON.parse(fs.readFileSync(RANKEDS_PATH, 'utf8'));
  const targets = selectAccounts(rankeds);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'} | accounts: ${targets.length}`);

  let existing = { updatedAt: null, accounts: [] };
  if (fs.existsSync(OUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
  }
  const byId = new Map((existing.accounts || []).map((a) => [a.ranked_id, a]));

  for (const ranked of targets) {
    const username = ranked.username;
    console.log(`→ ${username} (id=${ranked.id})`);
    try {
      const live = await fetchAccountSkins(username);
      console.log(`  ${live.skins.length} skins | ${live.url}`);
      if (live.skins[0]) {
        console.log(
          `  e.g. ${live.skins
            .slice(0, 3)
            .map((s) => s.name)
            .join(', ')}`
        );
      }
      byId.set(ranked.id, {
        ranked_id: ranked.id,
        username,
        skins: live.skins,
      });
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
    }
    await sleep(400);
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    source: 'loldb',
    accounts: [...byId.values()].sort((a, b) => a.ranked_id - b.ranked_id),
  };

  if (!APPLY) {
    console.log('\nDry-run done. Re-run with --apply to write account-skins.json');
    return;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (fs.existsSync(OUT_PATH)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(OUT_PATH, path.join(BACKUP_DIR, `account-skins-${stamp}.json`));
  }
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`\n✓ Wrote ${OUT_PATH} (${payload.accounts.length} accounts)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
