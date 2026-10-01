// Backend for the capstone sign-up page.
// Paste this into Extensions > Apps Script in your Google Sheet, then
// Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).

const SHEET_NAME = "Signups";
const EMAIL_ME = true; // email the sheet owner on every sign-up / cancel

const HEADERS = ["Slot ID", "When", "Type", "With", "Name", "Signed up at", "Token"];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_(sh) {
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh
    .getRange(2, 1, n - 1, HEADERS.length)
    .getValues()
    .map((r, i) => ({ row: i + 2, slotId: String(r[0]), token: String(r[6]) }))
    .filter((r) => r.slotId);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// Stop names like "=HYPERLINK(...)" from being run as formulas.
function safe_(v) {
  const s = String(v || "").trim().slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function deleteMine_(sh, rows, token) {
  const mine = rows.filter((r) => r.token === token).sort((a, b) => b.row - a.row);
  mine.forEach((r) => sh.deleteRow(r.row));
  return mine.length > 0;
}

function notify_(subject, body) {
  if (!EMAIL_ME) return;
  try {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, body);
  } catch (e) {}
}

// GET ?token=...  ->  { ok, taken: [slotIds], mine: slotId|null }
function doGet(e) {
  const token = String((e && e.parameter && e.parameter.token) || "");
  const rows = rows_(sheet_());
  const mine = token ? rows.find((r) => r.token === token) : null;
  return json_({ ok: true, taken: rows.map((r) => r.slotId), mine: mine ? mine.slotId : null });
}

// POST { action: "claim" | "cancel", token, slotId, name, when, type, host }
function doPost(e) {
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "bad_request" });
  }
  const token = String(req.token || "");
  if (token.length < 10) return json_({ ok: false, error: "bad_token" });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const rows = rows_(sh);

    if (req.action === "cancel") {
      const removed = deleteMine_(sh, rows, token);
      if (removed) notify_("Capstone sign-up cancelled", "A student cancelled their spot.");
      return json_({ ok: true });
    }

    if (req.action === "claim") {
      const slotId = String(req.slotId || "");
      const name = safe_(req.name);
      if (!slotId) return json_({ ok: false, error: "bad_request" });
      if (!name) return json_({ ok: false, error: "no_name" });
      if (rows.some((r) => r.slotId === slotId && r.token !== token))
        return json_({ ok: false, error: "taken" });

      deleteMine_(sh, rows, token); // switching spots frees the old one
      sh.appendRow([slotId, safe_(req.when), safe_(req.type), safe_(req.host), name, new Date(), token]);
      notify_(
        "Capstone sign-up: " + name,
        name + "\n" + req.type + (req.host ? " with " + req.host : "") + "\n" + req.when,
      );
      return json_({ ok: true });
    }

    return json_({ ok: false, error: "bad_request" });
  } finally {
    lock.releaseLock();
  }
}
