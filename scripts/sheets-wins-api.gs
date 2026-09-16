/**
 * Bridyam Majesties - Google Sheets Accounts API
 *
 * Tab: ACCOUNTS
 * Columns: ACCOUNT | LV | ESSENCER | WINS | HONOR | SOLO | FLEX
 *
 * Paste into Apps Script → Save → Deploy → Manage → New version → Deploy
 */

const SHEET_NAME = 'ACCOUNTS';

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
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

function readRows_() {
  const sheet = getSheet_();
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

function doGet() {
  try {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: readRows_() }))
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
    const account = String(body.account || '').trim();
    if (!account) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'account requerido' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getSheet_();
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
