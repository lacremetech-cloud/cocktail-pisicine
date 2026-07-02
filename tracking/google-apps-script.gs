/**
 * Cocktail Piscine — Leads + Statistiques (Funnels A & B) dans Google Sheets.
 *
 * Écrit chaque lead dans l'onglet "Leads" ET compte les visites / conversions
 * dans l'onglet "Stats" (une ligne par jour). Fournit aussi une petite API de
 * stats (lue par la page /stats du site).
 *
 * ── MISE À JOUR depuis la v1 ────────────────────────────────────────────
 * Si vous aviez déjà collé la v1 : remplacez TOUT le code par celui-ci, puis
 *   Déployer ▸ Gérer les déploiements ▸ (crayon) Modifier ▸ Version = "Nouvelle version" ▸ Déployer.
 * ⚠️ Gardez le MÊME déploiement → l'URL /exec ne change pas (rien à recoller côté site).
 *
 * ── INSTALLATION (si première fois) ─────────────────────────────────────
 * 1. sheets.new → "Extensions ▸ Apps Script" → collez ce code → Enregistrer.
 * 2. Déployer ▸ Nouveau déploiement ▸ Application Web
 *      - Exécuter en tant que : Moi
 *      - Qui a accès : Tout le monde
 * 3. Copiez l'URL /exec → collez-la dans les funnels (endpoint) et dans /stats.
 */

var STATS_TOKEN = 'occi34';   // clé simple pour lire les stats depuis la page /stats

var LEAD_HEADERS = [
  'Date','Funnel','Nom','Téléphone','Email','Code postal',
  'Type piscine','Accès terrain','Délai','Budget','Propriétaire',
  'RDV date','RDV créneau','Estimation (€)','Fourchette','Page','Brut JSON'
];
var STATS_HEADERS = ['Date','Visites landing','Quiz démarrés','Quiz complétés','Taux (%)'];

/* ------------------------------ POST ------------------------------ */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = {};
    try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }

    // 1) Événements de mesure (pageviews) — pas de lead
    if (data.type === 'view') {
      if (data.funnel === 'landing') bumpStat_(1);        // colonne "Visites landing"
      else bumpStat_(2);                                  // colonne "Quiz démarrés"
      return json_({ ok: true, counted: 'view' });
    }

    // 2) Lead (quiz complété ou WhatsApp)
    var sheet = getLeadSheet_();
    var fourchette = (data.estimLow && data.estimHigh) ? (data.estimLow + ' – ' + data.estimHigh) : '';
    sheet.appendRow([
      data.submitted_at || new Date().toISOString(),
      data.funnel || '', data.nom || '',
      "'" + (data.tel || ''), data.email || '', "'" + (data.cp || ''),
      data.type || '', data.acces || '', data.delai || '', data.budget || '', data.proprietaire || '',
      data.rdvDateLabel || data.rdvDate || '', data.rdvTimeLabel || data.rdvTime || '',
      data.estimCenter || '', fourchette,
      data.page || '', JSON.stringify(data)
    ]);
    // un lead issu du quiz = une conversion
    var f = (data.funnel || '');
    if (f.indexOf('A') === 0 || f.indexOf('quiz') >= 0) bumpStat_(3);  // "Quiz complétés"

    return json_({ ok: true, counted: 'lead' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------ GET (API stats + contrôle) ------------------------------ */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.stats) {
    if (p.token !== STATS_TOKEN) return reply_(p, { ok: false, error: 'token' });
    return reply_(p, getStats_());
  }
  return reply_(p, { status: 'ok', hint: 'Endpoint leads Cocktail Piscine actif.' });
}

// JSONP si ?callback=xxx (pour contourner CORS depuis la page /stats), sinon JSON.
function reply_(p, obj) {
  var body = JSON.stringify(obj);
  if (p.callback) {
    return ContentService.createTextOutput(p.callback + '(' + body + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------ Feuilles ------------------------------ */
function getLeadSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Leads');
  if (!sheet) {
    sheet = ss.insertSheet('Leads');
    sheet.appendRow(LEAD_HEADERS);
    sheet.getRange(1,1,1,LEAD_HEADERS.length).setFontWeight('bold').setBackground('#e9f2ff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getStatsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Stats');
  if (!sheet) {
    sheet = ss.insertSheet('Stats');
    sheet.appendRow(STATS_HEADERS);
    sheet.getRange(1,1,1,STATS_HEADERS.length).setFontWeight('bold').setBackground('#e9f2ff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// col : 1=Visites landing, 2=Quiz démarrés, 3=Quiz complétés (décalage +2 dans la feuille)
function bumpStat_(col) {
  var sheet = getStatsSheet_();
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var values = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === today) { rowIndex = i + 1; break; }
  }
  if (rowIndex === -1) {
    sheet.appendRow([today, 0, 0, 0, 0]);
    rowIndex = sheet.getLastRow();
  }
  var cell = sheet.getRange(rowIndex, col + 1); // +1 : la colonne 1 = Date
  cell.setValue((Number(cell.getValue()) || 0) + 1);
  // recalcule le taux du jour
  var v = Number(sheet.getRange(rowIndex, 2).getValue()) || 0;
  var c = Number(sheet.getRange(rowIndex, 4).getValue()) || 0;
  sheet.getRange(rowIndex, 5).setValue(v ? Math.round((c / v) * 1000) / 10 : 0);
}

function getStats_() {
  var sheet = getStatsSheet_();
  var values = sheet.getDataRange().getValues();
  var totalV = 0, totalStart = 0, totalC = 0;
  var days = [];
  for (var i = 1; i < values.length; i++) {
    var d = String(values[i][0]);
    var v = Number(values[i][1]) || 0, s = Number(values[i][2]) || 0, c = Number(values[i][3]) || 0;
    totalV += v; totalStart += s; totalC += c;
    days.push({ date: d, visites: v, demarres: s, completes: c, taux: v ? Math.round((c / v) * 1000) / 10 : 0 });
  }
  days = days.slice(-14); // 14 derniers jours
  return {
    ok: true,
    visites: totalV,
    quizDemarres: totalStart,
    quizCompletes: totalC,
    tauxConversion: totalV ? Math.round((totalC / totalV) * 1000) / 10 : 0,   // complétés / visiteurs landing
    tauxQuiz: totalStart ? Math.round((totalC / totalStart) * 1000) / 10 : 0,  // complétés / quiz démarrés
    jours: days
  };
}
