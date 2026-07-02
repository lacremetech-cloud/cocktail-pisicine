/**
 * Cocktail Piscine — Réception des leads (Funnels A & B) dans Google Sheets.
 *
 * Chaque envoi de funnel arrive ici en POST (JSON) et ajoute UNE LIGNE
 * dans l'onglet "Leads". La feuille s'ouvre/s'exporte en Excel (.xlsx).
 *
 * ── INSTALLATION (5 min) ─────────────────────────────────────────────
 * 1. Créez un Google Sheet vide (sheets.new). Nommez-le "Leads Cocktail Piscine".
 * 2. Menu  Extensions ▸ Apps Script.
 * 3. Collez TOUT ce fichier à la place du code par défaut. Enregistrez.
 * 4. Cliquez  Déployer ▸ Nouveau déploiement ▸ type "Application Web".
 *      - Description : "Leads funnels"
 *      - Exécuter en tant que : Moi
 *      - Qui a accès : "Tout le monde"   ← indispensable pour recevoir les POST
 * 5. Autorisez l'accès (écran Google) puis copiez l'URL /exec fournie.
 * 6. Collez cette URL dans les 2 funnels :
 *      - funnels/funnel-a-quiz.html   →  LEAD_CONFIG.endpoint = "https://script.google.com/.../exec"
 *      - funnels/funnel-b-whatsapp.html → WA_CONFIG.endpoint  = "https://script.google.com/.../exec"
 * 7. Redéployez le site (git push) et faites un test : la ligne apparaît dans le Sheet.
 *
 * Astuce Excel : dans le Sheet, Fichier ▸ Télécharger ▸ Microsoft Excel (.xlsx).
 * Ou branchez le Sheet à Excel via "Données ▸ À partir du web" / OneDrive.
 *
 * NB : si vous changez le code, refaites "Gérer les déploiements ▸ Modifier ▸
 * Nouvelle version" (sinon l'ancienne version reste en ligne).
 */

// Colonnes de la feuille, dans l'ordre. Ajoutez-en si besoin.
var HEADERS = [
  'Date', 'Funnel', 'Nom', 'Téléphone', 'Email', 'Code postal',
  'Type piscine', 'Accès terrain', 'Délai', 'Budget', 'Propriétaire',
  'RDV date', 'RDV créneau', 'Estimation (€)', 'Fourchette', 'Page', 'Brut JSON'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // évite les collisions si 2 leads arrivent en même temps
  try {
    var data = {};
    try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }

    var sheet = getSheet_();
    var estim = data.estimCenter ? data.estimCenter : '';
    var fourchette = (data.estimLow && data.estimHigh) ? (data.estimLow + ' – ' + data.estimHigh) : '';

    sheet.appendRow([
      data.submitted_at || new Date().toISOString(),
      data.funnel || '',
      data.nom || '',
      "'" + (data.tel || ''),          // ' force le format texte (garde le 0 initial)
      data.email || '',
      "'" + (data.cp || ''),
      data.type || '',
      data.acces || '',
      data.delai || '',
      data.budget || '',
      data.proprietaire || '',
      data.rdvDateLabel || data.rdvDate || '',
      data.rdvTimeLabel || data.rdvTime || '',
      estim,
      fourchette,
      data.page || '',
      JSON.stringify(data)
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Petit GET de contrôle : ouvrir l'URL /exec dans le navigateur doit afficher {"status":"ok"}.
function doGet() {
  return json_({ status: 'ok', hint: 'Endpoint leads Cocktail Piscine actif.' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Leads');
  if (!sheet) {
    sheet = ss.insertSheet('Leads');
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#e9f2ff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
