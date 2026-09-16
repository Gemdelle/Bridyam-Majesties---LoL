/**
 * Bridyam Majesties - Google Sheets Wins/Essencer API
 *
 * Paste into: Extensions → Apps Script → replace all → Save
 * Then MUST publish a new version:
 *   Deploy → Manage deployments → pencil → Version: New version → Deploy
 *
 * Sheet layout:
 *   Row1: ACCOUNT | SPLIT 2026 | (empty) | WINS
 *   Row2:         | Essenceer  | ESSENCER |
 *
 * ONLY the ESSENCER column counts as claimed owner.
 * SPLIT 2026 is ignored (old/legacy values like Emmy/Gemy there).
 */

const SHEET_NAME = 'Hoja 1'; // change if you rename the tab

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
  const winsIdx = findCol_(headers, ['WINS'], ['WIN']);
  // ONLY the real ESSENCER column (not SPLIT / Essenceer)
  let essencerIdx = headers.indexOf('ESSENCER');
  if (essencerIdx === -1) {
    // fallback: column whose header is exactly ESSENCER after merge
    essencerIdx = findCol_(headers, ['ESSENCER'], null);
  }

  if (accountIdx === -1 || winsIdx === -1) {
    throw new Error('Missing ACCOUNT or WINS. Headers: ' + headers.join(' | '));
  }
  if (essencerIdx === -1) {
    throw new Error('Missing ESSENCER column. Headers: ' + headers.join(' | '));
  }

  let start = 1;
  while (start < values.length && !isAccountRow_(values[start][accountIdx])) {
    start += 1;
  }

  const rows = [];
  for (let i = start; i < values.length; i++) {
    const account = String(values[i][accountIdx] || '').trim();
    if (!account || !isAccountRow_(account) || account.toUpperCase() === 'GEM') continue;

    const rawEssencer = String(values[i][essencerIdx] || '').trim();
    rows.push({
      row: i + 1,
      account,
      essencer: isClaimed_(rawEssencer) ? rawEssencer : '-',
      wins: Number(values[i][winsIdx]) || 0
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
    const wins = Number(body.wins);

    if (!account || Number.isNaN(wins)) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'account y wins requeridos' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    const headers = buildHeaders_(values);
    const accountIdx = findCol_(headers, ['ACCOUNT'], ['ACCOUNT']);
    const winsIdx = findCol_(headers, ['WINS'], ['WIN']);

    let found = false;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][accountIdx] || '').trim() === account) {
        sheet.getRange(i + 1, winsIdx + 1).setValue(wins);
        found = true;
        break;
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: found,
        error: found ? null : 'cuenta no encontrada',
        account,
        wins
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
