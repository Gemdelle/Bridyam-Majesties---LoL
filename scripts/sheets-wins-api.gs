/**
 * Bridyam Majesties - Google Sheets API
 *
 * Tabs:
 *   ACCOUNTS  → ACCOUNT | LV | ESSENCER | WINS | HONOR | SOLO | FLEX
 *   ESSENCERS → ESSENCER | PET | LEVEL
 *   MASTERY   → ranked_id | username | champion_id | champion_level | champion_points
 *
 * Paste → Save → Deploy → Manage deployments → Edit → New version → Deploy
 */

const ACCOUNTS_SHEET = 'ACCOUNTS';
const ESSENCERS_SHEET = 'ESSENCERS';
const MASTERY_SHEET = 'MASTERY';

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
      flex: flexIdx >= 0 ? String(values[i][flexIdx] || '').trim() : 'unranked'
    });
  }
  return rows;
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

function doGet() {
  try {
    const data = readAccountRows_();
    const essencers = readEssencerRows_();
    const masteries = readMasteryRows_();
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data, essencers, masteries }))
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

    // Upsert masteries (from API sync or UI)
    if (body.action === 'upsertMasteries' || Array.isArray(body.masteries)) {
      const result = upsertMasteries_(body.masteries || [], body.mode || 'max');
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Update essencer pet/level
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

    // Update account row
    const account = String(body.account || '').trim();
    if (!account) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'account, essencer o masteries requerido' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

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
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
