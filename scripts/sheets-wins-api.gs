/**
 * Bridyam Majesties - Google Sheets API
 *
 * Tabs:
 *   ACCOUNTS  → ACCOUNT | LV | ESSENCER | WINS | HONOR | SOLO | FLEX
 *               | INIT_LV | INIT_SOLO | INIT_FLEX | INIT_MASTERY
 *   ESSENCERS → ESSENCER | PET | LEVEL
 *   MASTERY   → ranked_id | username | champion_id | champion_level | champion_points
 *   FEED      → feed events
 *   SKINS     → ranked_id | username | skin_name | champ_name | rarity | image_url | skin_lines
 *
 * INIT_* = season baseline frozen once via action: 'freezeBaselines'
 * Paste → Save → Deploy → Manage deployments → Edit → New version → Deploy
 * (SKINS tab is auto-created on first append if missing)
 */

const ACCOUNTS_SHEET = 'ACCOUNTS';
const ESSENCERS_SHEET = 'ESSENCERS';
const MASTERY_SHEET = 'MASTERY';
const FEED_SHEET = 'FEED';
const SKINS_SHEET = 'SKINS';

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || null;
}

function norm_(value) {
  return String(value || '').trim().toUpperCase();
}

function isAccountRow_(value) {
  const v = String(value || '').trim();
  return v.includes('#') || v.toUpperCase().startsWith('GEM ');
}

function isClaimed_(value) {
  const v = String(value || '').trim();
  return v !== '' && v !== '-';
}

function findCol_(headers, exactNames, fuzzyIncludes) {
  for (const name of exactNames) {
    const idx = headers.indexOf(name);
    if (idx !== -1) return idx;
  }
  if (fuzzyIncludes) {
    for (let i = 0; i < headers.length; i++) {
      for (const part of fuzzyIncludes) {
        if (headers[i].includes(part)) return i;
      }
    }
  }
  return -1;
}

function buildHeaders_(values) {
  const row1 = (values[0] || []).map(norm_);
  const row2 = (values[1] || []).map(norm_);
  const merged = [];
  const width = Math.max(row1.length, row2.length);
  for (let i = 0; i < width; i++) {
    merged.push(row1[i] || row2[i] || '');
  }
  return merged;
}

function readAccountRows_() {
  const sheet = getSheet_(ACCOUNTS_SHEET);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = buildHeaders_(values);
  const accountIdx = findCol_(headers, ['ACCOUNT'], ['ACCOUNT']);
  const lvIdx = findCol_(headers, ['LV', 'LEVEL'], ['LV', 'LEVEL']);
  const essencerIdx = findCol_(headers, ['ESSENCER'], ['ESSENCER']);
  const winsIdx = findCol_(headers, ['WINS'], ['WIN']);
  const honorIdx = findCol_(headers, ['HONOR'], ['HONOR']);
  const soloIdx = findCol_(headers, ['SOLO', 'SOLOQ'], ['SOLO']);
  const flexIdx = findCol_(headers, ['FLEX'], ['FLEX']);
  const initLvIdx = findCol_(headers, ['INIT_LV', 'INITLV', 'BASELINE_LV'], ['INIT_LV', 'INIT LV']);
  const initSoloIdx = findCol_(headers, ['INIT_SOLO', 'INITSOLO', 'BASELINE_SOLO'], ['INIT_SOLO', 'INIT SOLO']);
  const initFlexIdx = findCol_(headers, ['INIT_FLEX', 'INITFLEX', 'BASELINE_FLEX'], ['INIT_FLEX', 'INIT FLEX']);
  const initMasteryIdx = findCol_(headers, ['INIT_MASTERY', 'INITMASTERY', 'BASELINE_MASTERY'], ['INIT_MASTERY', 'INIT MASTERY']);

  if (accountIdx === -1) {
    throw new Error('Missing ACCOUNT column. Headers: ' + headers.join(' | '));
  }

  let start = 1;
  while (start < values.length && !isAccountRow_(values[start][accountIdx])) {
    start += 1;
  }

  const rows = [];
  for (let i = start; i < values.length; i++) {
    const account = String(values[i][accountIdx] || '').trim();
    if (!account || !isAccountRow_(account) || account.toUpperCase() === 'GEM') continue;

    const rawEssencer = essencerIdx >= 0 ? String(values[i][essencerIdx] || '').trim() : '';

    rows.push({
      row: i + 1,
      account,
      lv: lvIdx >= 0 ? Number(values[i][lvIdx]) || 0 : 0,
      essencer: isClaimed_(rawEssencer) ? rawEssencer : '-',
      wins: winsIdx >= 0 ? Number(values[i][winsIdx]) || 0 : 0,
      honor: honorIdx >= 0 ? Number(values[i][honorIdx]) || 0 : 0,
      solo: soloIdx >= 0 ? String(values[i][soloIdx] || '').trim() : 'unranked',
      flex: flexIdx >= 0 ? String(values[i][flexIdx] || '').trim() : 'unranked',
      init_lv: initLvIdx >= 0 && values[i][initLvIdx] !== '' && values[i][initLvIdx] !== null
        ? Number(values[i][initLvIdx]) || 0
        : null,
      init_solo: initSoloIdx >= 0 ? String(values[i][initSoloIdx] || '').trim() : '',
      init_flex: initFlexIdx >= 0 ? String(values[i][initFlexIdx] || '').trim() : '',
      init_mastery: initMasteryIdx >= 0 && values[i][initMasteryIdx] !== '' && values[i][initMasteryIdx] !== null
        ? Number(values[i][initMasteryIdx]) || 0
        : null
    });
  }
  return rows;
}

/** Ensure INIT_* header columns exist on ACCOUNTS (appended to header row 1). */
function ensureInitColumns_(sheet, values) {
  const headerRow = 1;
  const headers = (values[0] || []).map(function (h) { return String(h || '').trim(); });
  const needed = ['INIT_LV', 'INIT_SOLO', 'INIT_FLEX', 'INIT_MASTERY'];
  const normHeaders = headers.map(norm_);
  let changed = false;

  needed.forEach(function (name) {
    if (normHeaders.indexOf(norm_(name)) === -1) {
      headers.push(name);
      normHeaders.push(norm_(name));
      changed = true;
    }
  });

  if (changed) {
    sheet.getRange(headerRow, 1, 1, headers.length).setValues([headers]);
  }

  return buildHeaders_(sheet.getDataRange().getValues());
}

/** Sum champion_level per username (lowercase) from MASTERY tab. */
function masterySumByUsername_() {
  const rows = readMasteryRows_();
  const map = {};
  rows.forEach(function (r) {
    const key = String(r.username || '').trim().toLowerCase();
    if (!key) return;
    map[key] = (map[key] || 0) + (Number(r.champion_level) || 0);
  });
  return map;
}

/**
 * Freeze current LV / SOLO / FLEX / mastery sum as season baselines.
 * By default only fills empty INIT cells (safe to re-run).
 * Pass force: true to overwrite all baselines.
 */
function freezeBaselines_(force) {
  const sheet = getSheet_(ACCOUNTS_SHEET);
  if (!sheet) {
    return { ok: false, error: 'tab ACCOUNTS no encontrada', frozen: 0 };
  }

  let values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { ok: false, error: 'ACCOUNTS vacío', frozen: 0 };
  }

  const headers = ensureInitColumns_(sheet, values);
  values = sheet.getDataRange().getValues();

  const accountIdx = findCol_(headers, ['ACCOUNT'], ['ACCOUNT']);
  const lvIdx = findCol_(headers, ['LV', 'LEVEL'], ['LV', 'LEVEL']);
  const soloIdx = findCol_(headers, ['SOLO', 'SOLOQ'], ['SOLO']);
  const flexIdx = findCol_(headers, ['FLEX'], ['FLEX']);
  const initLvIdx = findCol_(headers, ['INIT_LV', 'INITLV'], ['INIT_LV']);
  const initSoloIdx = findCol_(headers, ['INIT_SOLO', 'INITSOLO'], ['INIT_SOLO']);
  const initFlexIdx = findCol_(headers, ['INIT_FLEX', 'INITFLEX'], ['INIT_FLEX']);
  const initMasteryIdx = findCol_(headers, ['INIT_MASTERY', 'INITMASTERY'], ['INIT_MASTERY']);

  if (accountIdx === -1 || initLvIdx === -1) {
    return { ok: false, error: 'No se pudieron crear columnas INIT_*', frozen: 0 };
  }

  const masteryByUser = masterySumByUsername_();
  let frozen = 0;
  let skipped = 0;

  for (let i = 1; i < values.length; i++) {
    const account = String(values[i][accountIdx] || '').trim();
    if (!account || !isAccountRow_(account) || account.toUpperCase() === 'GEM') continue;

    const existingInit = values[i][initLvIdx];
    const hasBaseline = existingInit !== '' && existingInit !== null && existingInit !== undefined;
    if (hasBaseline && !force) {
      skipped += 1;
      continue;
    }

    const lv = lvIdx >= 0 ? Number(values[i][lvIdx]) || 0 : 0;
    const solo = soloIdx >= 0 ? String(values[i][soloIdx] || '').trim() || 'unranked' : 'unranked';
    const flex = flexIdx >= 0 ? String(values[i][flexIdx] || '').trim() || 'unranked' : 'unranked';
    const masterySum = masteryByUser[account.toLowerCase()] || 0;

    sheet.getRange(i + 1, initLvIdx + 1).setValue(lv);
    if (initSoloIdx >= 0) sheet.getRange(i + 1, initSoloIdx + 1).setValue(solo);
    if (initFlexIdx >= 0) sheet.getRange(i + 1, initFlexIdx + 1).setValue(flex);
    if (initMasteryIdx >= 0) sheet.getRange(i + 1, initMasteryIdx + 1).setValue(masterySum);
    frozen += 1;
  }

  return { ok: true, frozen: frozen, skipped: skipped, force: !!force };
}

function readEssencerRows_() {
  const sheet = getSheet_(ESSENCERS_SHEET);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = buildHeaders_(values);
  const essencerIdx = findCol_(headers, ['ESSENCER'], ['ESSENCER']);
  const petIdx = findCol_(headers, ['PET', 'SPECIES', 'PET SPECIES'], ['PET', 'SPECIES']);
  const levelIdx = findCol_(headers, ['LEVEL', 'LV', 'STAGE'], ['LEVEL', 'STAGE']);

  if (essencerIdx === -1) return [];

  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const essencer = String(values[i][essencerIdx] || '').trim();
    if (!isClaimed_(essencer)) continue;

    rows.push({
      row: i + 1,
      essencer,
      pet: petIdx >= 0 ? String(values[i][petIdx] || '').trim() : '',
      level: levelIdx >= 0 ? Number(values[i][levelIdx]) || 1 : 1
    });
  }
  return rows;
}

function masteryKey_(rankedId, championId) {
  return String(Number(rankedId) || 0) + '|' + String(Number(championId) || 0);
}

function readMasteryRows_() {
  const sheet = getSheet_(MASTERY_SHEET);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = (values[0] || []).map(norm_);
  const rankedIdx = findCol_(headers, ['RANKED_ID', 'RANKEDID'], ['RANKED']);
  const userIdx = findCol_(headers, ['USERNAME', 'ACCOUNT'], ['USER', 'ACCOUNT']);
  const champIdx = findCol_(headers, ['CHAMPION_ID', 'CHAMPIONID', 'CHAMP_ID'], ['CHAMPION', 'CHAMP']);
  const levelIdx = findCol_(headers, ['CHAMPION_LEVEL', 'CHAMPIONLEVEL', 'LEVEL', 'MASTERY'], ['LEVEL', 'MASTERY']);
  const pointsIdx = findCol_(headers, ['CHAMPION_POINTS', 'CHAMPIONPOINTS', 'POINTS'], ['POINTS']);

  if (rankedIdx === -1 || champIdx === -1) {
    throw new Error('MASTERY needs ranked_id + champion_id. Headers: ' + headers.join(' | '));
  }

  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const ranked_id = Number(values[i][rankedIdx]) || 0;
    const champion_id = Number(values[i][champIdx]) || 0;
    if (!ranked_id || !champion_id) continue;

    rows.push({
      row: i + 1,
      ranked_id,
      username: userIdx >= 0 ? String(values[i][userIdx] || '').trim() : '',
      champion_id,
      champion_level: levelIdx >= 0 ? Number(values[i][levelIdx]) || 0 : 0,
      champion_points: pointsIdx >= 0 ? Number(values[i][pointsIdx]) || 0 : 0
    });
  }
  return rows;
}

/**
 * Upsert masteries.
 * mode:
 *   'max' → keep highest level (then highest points)  [API sync]
 *   'set' → overwrite with provided values            [manual UI edit]
 */
function upsertMasteries_(incoming, mode) {
  const sheet = getSheet_(MASTERY_SHEET);
  if (!sheet) {
    return { ok: false, error: 'tab MASTERY no encontrada', updated: 0, inserted: 0 };
  }

  const list = Array.isArray(incoming) ? incoming : [];
  if (!list.length) {
    return { ok: true, updated: 0, inserted: 0, skipped: 0 };
  }

  const values = sheet.getDataRange().getValues();
  if (!values.length) {
    sheet.appendRow(['ranked_id', 'username', 'champion_id', 'champion_level', 'champion_points']);
    values.push(['ranked_id', 'username', 'champion_id', 'champion_level', 'champion_points']);
  }

  const headers = (values[0] || []).map(norm_);
  let rankedIdx = findCol_(headers, ['RANKED_ID', 'RANKEDID'], ['RANKED']);
  let userIdx = findCol_(headers, ['USERNAME', 'ACCOUNT'], ['USER', 'ACCOUNT']);
  let champIdx = findCol_(headers, ['CHAMPION_ID', 'CHAMPIONID', 'CHAMP_ID'], ['CHAMPION', 'CHAMP']);
  let levelIdx = findCol_(headers, ['CHAMPION_LEVEL', 'CHAMPIONLEVEL', 'LEVEL', 'MASTERY'], ['LEVEL', 'MASTERY']);
  let pointsIdx = findCol_(headers, ['CHAMPION_POINTS', 'CHAMPIONPOINTS', 'POINTS'], ['POINTS']);

  // Ensure required columns exist
  if (rankedIdx === -1 || champIdx === -1 || levelIdx === -1) {
    return { ok: false, error: 'MASTERY headers incompletos', updated: 0, inserted: 0 };
  }
  if (userIdx === -1) userIdx = -1;
  if (pointsIdx === -1) pointsIdx = -1;

  const indexByKey = {};
  for (let i = 1; i < values.length; i++) {
    const rid = Number(values[i][rankedIdx]) || 0;
    const cid = Number(values[i][champIdx]) || 0;
    if (!rid || !cid) continue;
    indexByKey[masteryKey_(rid, cid)] = i;
  }

  let updated = 0;
  let inserted = 0;
  let skipped = 0;
  const toAppend = [];

  const useMax = String(mode || 'max').toLowerCase() !== 'set';

  for (let n = 0; n < list.length; n++) {
    const item = list[n] || {};
    const ranked_id = Number(item.ranked_id) || 0;
    const champion_id = Number(item.champion_id) || 0;
    if (!ranked_id || !champion_id) {
      skipped += 1;
      continue;
    }

    const username = String(item.username || '').trim();
    const newLevel = Number(item.champion_level) || 0;
    const newPoints = Number(item.champion_points) || 0;
    const key = masteryKey_(ranked_id, champion_id);
    const rowIdx = indexByKey[key];

    if (rowIdx === undefined) {
      const row = [];
      const width = Math.max(headers.length, 5);
      for (let c = 0; c < width; c++) row[c] = '';
      row[rankedIdx] = ranked_id;
      if (userIdx >= 0) row[userIdx] = username;
      row[champIdx] = champion_id;
      row[levelIdx] = newLevel;
      if (pointsIdx >= 0) row[pointsIdx] = newPoints;
      toAppend.push(row);
      indexByKey[key] = values.length + toAppend.length - 1;
      inserted += 1;
      continue;
    }

    const oldLevel = Number(values[rowIdx][levelIdx]) || 0;
    const oldPoints = pointsIdx >= 0 ? Number(values[rowIdx][pointsIdx]) || 0 : 0;

    let nextLevel = newLevel;
    let nextPoints = newPoints;

    if (useMax) {
      if (newLevel < oldLevel || (newLevel === oldLevel && newPoints <= oldPoints)) {
        skipped += 1;
        continue;
      }
      nextLevel = Math.max(oldLevel, newLevel);
      nextPoints = nextLevel > oldLevel ? newPoints : Math.max(oldPoints, newPoints);
    }

    const sheetRow = rowIdx + 1;
    sheet.getRange(sheetRow, levelIdx + 1).setValue(nextLevel);
    if (pointsIdx >= 0) sheet.getRange(sheetRow, pointsIdx + 1).setValue(nextPoints);
    if (userIdx >= 0 && username) sheet.getRange(sheetRow, userIdx + 1).setValue(username);
    values[rowIdx][levelIdx] = nextLevel;
    if (pointsIdx >= 0) values[rowIdx][pointsIdx] = nextPoints;
    updated += 1;
  }

  if (toAppend.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, toAppend[0].length).setValues(toAppend);
  }

  return { ok: true, updated, inserted, skipped, mode: useMax ? 'max' : 'set' };
}

function ensureFeedSheet_() {
  let sheet = getSheet_(FEED_SHEET);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(FEED_SHEET);
    sheet.appendRow([
      'id',
      'ranked_id',
      'ranked_username',
      'ranked_name',
      'bloodline',
      'pet_type',
      'pet_stage',
      'action',
      'title',
      'description',
      'metadata',
      'created_at',
      'points'
    ]);
  }
  return sheet;
}

function readFeedRows_(limit) {
  const sheet = ensureFeedSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = (values[0] || []).map(norm_);
  const idIdx = findCol_(headers, ['ID'], ['ID']);
  const rankedIdx = findCol_(headers, ['RANKED_ID', 'RANKEDID'], ['RANKED']);
  const userIdx = findCol_(headers, ['RANKED_USERNAME', 'USERNAME', 'ACCOUNT'], ['USER', 'ACCOUNT']);
  const nameIdx = findCol_(headers, ['RANKED_NAME', 'NAME', 'ESSENCER'], ['NAME', 'ESSENCER']);
  const bloodIdx = findCol_(headers, ['BLOODLINE'], ['BLOOD']);
  const petTypeIdx = findCol_(headers, ['PET_TYPE', 'PETTYPE'], ['PET_TYPE', 'TYPE']);
  const petStageIdx = findCol_(headers, ['PET_STAGE', 'PETSTAGE', 'STAGE'], ['STAGE']);
  const actionIdx = findCol_(headers, ['ACTION'], ['ACTION']);
  const titleIdx = findCol_(headers, ['TITLE'], ['TITLE']);
  const descIdx = findCol_(headers, ['DESCRIPTION', 'DESC'], ['DESC']);
  const metaIdx = findCol_(headers, ['METADATA', 'META'], ['META']);
  const createdIdx = findCol_(headers, ['CREATED_AT', 'CREATED', 'DATE'], ['CREATED', 'DATE']);
  const pointsIdx = findCol_(headers, ['POINTS'], ['POINT']);

  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const action = actionIdx >= 0 ? String(values[i][actionIdx] || '').trim() : '';
    if (!action) continue;

    let metadata = {};
    if (metaIdx >= 0) {
      try {
        metadata = JSON.parse(String(values[i][metaIdx] || '{}'));
      } catch (err) {
        metadata = {};
      }
    }

    rows.push({
      id: idIdx >= 0 ? Number(values[i][idIdx]) || i : i,
      rankedId: rankedIdx >= 0 ? Number(values[i][rankedIdx]) || 0 : 0,
      rankedUsername: userIdx >= 0 ? String(values[i][userIdx] || '').trim() : '',
      rankedName: nameIdx >= 0 ? String(values[i][nameIdx] || '').trim() : '',
      bloodline: bloodIdx >= 0 ? String(values[i][bloodIdx] || '').trim() : '',
      petType: petTypeIdx >= 0 ? String(values[i][petTypeIdx] || '').trim() || null : null,
      petStage: petStageIdx >= 0 ? Number(values[i][petStageIdx]) || null : null,
      action,
      title: titleIdx >= 0 ? String(values[i][titleIdx] || '').trim() : '',
      description: descIdx >= 0 ? String(values[i][descIdx] || '').trim() : '',
      metadata,
      createdAt: createdIdx >= 0 ? String(values[i][createdIdx] || '').trim() : new Date().toISOString(),
      points: pointsIdx >= 0 ? Number(values[i][pointsIdx]) || null : null
    });
  }

  rows.sort(function (a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  const max = Math.max(1, Number(limit) || 100);
  return rows.slice(0, max);
}

function appendFeed_(item) {
  const sheet = ensureFeedSheet_();
  const values = sheet.getDataRange().getValues();
  const nextId = values.length; // header + rows → next id
  const createdAt = item.createdAt || new Date().toISOString();
  sheet.appendRow([
    Number(item.id) || nextId,
    Number(item.rankedId) || 0,
    String(item.rankedUsername || ''),
    String(item.rankedName || ''),
    String(item.bloodline || ''),
    item.petType == null ? '' : String(item.petType),
    item.petStage == null ? '' : Number(item.petStage),
    String(item.action || ''),
    String(item.title || ''),
    String(item.description || ''),
    JSON.stringify(item.metadata || {}),
    createdAt,
    item.points == null ? '' : Number(item.points)
  ]);
  return { ok: true, id: Number(item.id) || nextId, createdAt };
}

/** Manual / victorious / legacy skins shared for everyone */
function ensureSkinsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SKINS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SKINS_SHEET);
    sheet.appendRow([
      'ranked_id',
      'username',
      'skin_name',
      'champ_name',
      'rarity',
      'image_url',
      'skin_lines'
    ]);
  }
  return sheet;
}

function readManualSkinRows_() {
  var sheet = getSheet_(SKINS_SHEET) || ensureSkinsSheet_();
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
  var idIdx = headers.indexOf('ranked_id');
  var userIdx = headers.indexOf('username');
  var nameIdx = headers.indexOf('skin_name');
  var champIdx = headers.indexOf('champ_name');
  var rarityIdx = headers.indexOf('rarity');
  var imgIdx = headers.indexOf('image_url');
  var linesIdx = headers.indexOf('skin_lines');
  if (nameIdx === -1 || userIdx === -1) return [];

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var skinName = String(values[i][nameIdx] || '').trim();
    var username = String(values[i][userIdx] || '').trim();
    if (!skinName || !username) continue;
    var linesRaw = linesIdx >= 0 ? String(values[i][linesIdx] || '').trim() : 'legacy';
    var skinLines = [];
    try {
      skinLines = JSON.parse(linesRaw);
      if (!Array.isArray(skinLines)) skinLines = [String(linesRaw)];
    } catch (e) {
      skinLines = linesRaw ? linesRaw.split(',').map(function (s) { return s.trim(); }) : ['legacy'];
    }
    rows.push({
      ranked_id: idIdx >= 0 ? Number(values[i][idIdx]) || 0 : 0,
      username: username,
      skin_name: skinName,
      champ_name: champIdx >= 0 ? String(values[i][champIdx] || '').trim() : '',
      rarity: rarityIdx >= 0 ? String(values[i][rarityIdx] || '').trim() || 'kLegacy' : 'kLegacy',
      image_url: imgIdx >= 0 ? String(values[i][imgIdx] || '').trim() : '',
      skin_lines: skinLines
    });
  }
  return rows;
}

function appendManualSkin_(item) {
  var sheet = ensureSkinsSheet_();
  var username = String(item.username || '').trim();
  var skinName = String(item.skin_name || item.skinName || '').trim();
  if (!username || !skinName) {
    return { ok: false, error: 'username and skin_name required' };
  }
  var values = sheet.getDataRange().getValues();
  var headers = (values[0] || []).map(function (h) { return String(h || '').trim().toLowerCase(); });
  var userIdx = headers.indexOf('username');
  var nameIdx = headers.indexOf('skin_name');
  if (userIdx < 0) userIdx = 1;
  if (nameIdx < 0) nameIdx = 2;

  for (var i = 1; i < values.length; i++) {
    var existingUser = String(values[i][userIdx] || '').trim().toLowerCase();
    var existingName = String(values[i][nameIdx] || '').trim().toLowerCase();
    if (existingUser === username.toLowerCase() && existingName === skinName.toLowerCase()) {
      // Refresh image_url if a better one is provided
      var imgIdx = headers.indexOf('image_url');
      var newImg = String(item.image_url || item.imageUrl || '').trim();
      if (imgIdx >= 0 && newImg) {
        sheet.getRange(i + 1, imgIdx + 1).setValue(newImg);
      }
      return { ok: true, duplicate: true };
    }
  }
  var lines = item.skin_lines || item.skinLines || ['legacy'];
  if (Object.prototype.toString.call(lines) !== '[object Array]') {
    lines = [String(lines)];
  }
  sheet.appendRow([
    Number(item.ranked_id || item.rankedId) || 0,
    username,
    skinName,
    String(item.champ_name || item.champName || ''),
    String(item.rarity || 'kLegacy'),
    String(item.image_url || item.imageUrl || ''),
    JSON.stringify(lines)
  ]);
  return { ok: true, duplicate: false };
}

function doGet(e) {
  try {
    const resource = e && e.parameter && e.parameter.resource;
    if (resource === 'feed') {
      const limit = e && e.parameter && e.parameter.limit ? Number(e.parameter.limit) : 100;
      const feed = readFeedRows_(limit);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, feed }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (resource === 'skins') {
      const skins = readManualSkinRows_();
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, skins }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = readAccountRows_();
    const essencers = readEssencerRows_();
    const masteries = readMasteryRows_();
    const skins = readManualSkinRows_();
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data, essencers, masteries, skins }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');

    // Freeze season baselines (INIT_LV / INIT_SOLO / INIT_FLEX / INIT_MASTERY)
    if (body.action === 'freezeBaselines') {
      const result = freezeBaselines_(!!body.force);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Append feed event
    if (body.action === 'appendFeed' || body.feed) {
      const item = body.feed || body;
      const result = appendFeed_(item);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Append manual skin (victorious / legacy / custom)
    if (body.action === 'appendSkin' || body.skin) {
      const item = body.skin || body;
      const result = appendManualSkin_(item);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Upsert masteries (from API sync or UI)
    if (body.action === 'upsertMasteries' || Array.isArray(body.masteries)) {
      const result = upsertMasteries_(body.masteries || [], body.mode || 'max');
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Update account row FIRST when account is present (wins/lv/honor/elo/essencer claim)
    const account = String(body.account || '').trim();
    if (account) {
      const sheet = getSheet_(ACCOUNTS_SHEET);
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: false, error: 'tab ACCOUNTS no encontrada' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const values = sheet.getDataRange().getValues();
      const headers = buildHeaders_(values);
      const accountIdx = findCol_(headers, ['ACCOUNT'], ['ACCOUNT']);
      const winsIdx = findCol_(headers, ['WINS'], ['WIN']);
      const lvIdx = findCol_(headers, ['LV', 'LEVEL'], ['LV', 'LEVEL']);
      const honorIdx = findCol_(headers, ['HONOR'], ['HONOR']);
      const soloIdx = findCol_(headers, ['SOLO', 'SOLOQ'], ['SOLO']);
      const flexIdx = findCol_(headers, ['FLEX'], ['FLEX']);
      const essencerIdx = findCol_(headers, ['ESSENCER'], ['ESSENCER']);

      let found = false;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][accountIdx] || '').trim() !== account) continue;

        if (body.wins !== undefined && winsIdx >= 0) {
          sheet.getRange(i + 1, winsIdx + 1).setValue(Number(body.wins) || 0);
        }
        if (body.lv !== undefined && lvIdx >= 0) {
          sheet.getRange(i + 1, lvIdx + 1).setValue(Number(body.lv) || 0);
        }
        if (body.honor !== undefined && honorIdx >= 0) {
          sheet.getRange(i + 1, honorIdx + 1).setValue(Number(body.honor) || 0);
        }
        if (body.solo !== undefined && soloIdx >= 0) {
          sheet.getRange(i + 1, soloIdx + 1).setValue(String(body.solo));
        }
        if (body.flex !== undefined && flexIdx >= 0) {
          sheet.getRange(i + 1, flexIdx + 1).setValue(String(body.flex));
        }
        if (body.essencer !== undefined && essencerIdx >= 0) {
          sheet.getRange(i + 1, essencerIdx + 1).setValue(String(body.essencer));
        }
        found = true;
        break;
      }

      return ContentService
        .createTextOutput(JSON.stringify({ ok: found, error: found ? null : 'cuenta no encontrada', account }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Update essencer pet/level (only when not an account update)
    if (body.essencer && (body.pet !== undefined || body.level !== undefined)) {
      const sheet = getSheet_(ESSENCERS_SHEET);
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: false, error: 'tab ESSENCERS no encontrada' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const values = sheet.getDataRange().getValues();
      const headers = buildHeaders_(values);
      const essencerIdx = findCol_(headers, ['ESSENCER'], ['ESSENCER']);
      const petIdx = findCol_(headers, ['PET', 'SPECIES', 'PET SPECIES'], ['PET', 'SPECIES']);
      const levelIdx = findCol_(headers, ['LEVEL', 'LV', 'STAGE'], ['LEVEL', 'STAGE']);
      const target = String(body.essencer).trim();

      let found = false;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][essencerIdx] || '').trim() !== target) continue;
        if (body.pet !== undefined && petIdx >= 0) {
          sheet.getRange(i + 1, petIdx + 1).setValue(String(body.pet));
        }
        if (body.level !== undefined && levelIdx >= 0) {
          sheet.getRange(i + 1, levelIdx + 1).setValue(Number(body.level) || 1);
        }
        found = true;
        break;
      }

      return ContentService
        .createTextOutput(JSON.stringify({ ok: found, error: found ? null : 'essencer no encontrado', essencer: target }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'account, essencer o masteries requerido' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
