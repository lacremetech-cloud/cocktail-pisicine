# Tracking des leads — où arrivent les données du quiz

Les deux funnels envoient chaque prospect en **POST JSON** vers l'URL configurée dans le fichier
(`LEAD_CONFIG.endpoint` pour le Funnel A, `WA_CONFIG.endpoint` pour le Funnel B).
Tant que cette URL est **vide**, le lead est seulement affiché dans la console (mode démo) — le funnel marche quand même.

Pour récupérer les données **dans un tableur / Excel**, choisissez UNE option :

---

## ✅ Option recommandée — Google Sheets (gratuit, direct, exportable Excel)

Le plus simple et sans abonnement. Chaque lead ajoute une ligne dans un Google Sheet,
que vous ouvrez/téléchargez en **Excel (.xlsx)** quand vous voulez.

1. Suivez pas à pas [`google-apps-script.gs`](google-apps-script.gs) (installation en 5 min).
2. Collez l'URL `/exec` obtenue dans les 2 funnels (`endpoint`).
3. `git push` → testez : la ligne apparaît dans l'onglet **Leads**.

**Passer en Excel :** dans le Sheet, `Fichier ▸ Télécharger ▸ Microsoft Excel (.xlsx)`,
ou connectez le Sheet à Excel/OneDrive (`Données ▸ À partir du web`).

Colonnes créées : Date · Funnel · Nom · Téléphone · Email · Code postal · Type · Accès terrain ·
Délai · Budget · Propriétaire · RDV date · RDV créneau · Estimation · Fourchette · Page · Brut JSON.

---

## Alternative A — Vrai Excel en ligne (Microsoft 365)

Si vous voulez écrire directement dans un **fichier Excel Online (OneDrive)** :
- **Make.com** (ou Zapier) : module *Webhooks ▸ Custom webhook* → action *Microsoft Excel ▸ Add a row*.
- Collez l'URL du webhook Make/Zapier dans `endpoint`. Mappez les champs JSON aux colonnes.
- Avantage : fichier Excel natif. Inconvénient : compte Make/Zapier (offre gratuite souvent suffisante au début).

## Alternative B — Directement dans un CRM

Même principe : mettez l'URL webhook de votre CRM (HubSpot, Pipedrive, Brevo…) dans `endpoint`,
ou passez par Make/Zapier pour router le lead vers le CRM **et** la feuille en même temps.

---

## Bon à savoir

- **Notifications instantanées** : dans Make/Zapier, ajoutez une étape *Email* ou *SMS* pour être
  prévenu à chaque lead → rappel < 1 h (le levier P&L de setting, cf. `docs/00-strategie-acquisition.md` §5).
- **Doublon de sécurité** : vous pouvez router le même lead vers Google Sheets **et** un CRM.
- **Champs envoyés** : voir l'exemple de payload dans [`../funnels/README.md`](../funnels/README.md).
- **RGPD** : le formulaire indique déjà que les données servent uniquement à traiter la demande.
  Conservez-les dans un espace à accès restreint et purgez les leads inactifs régulièrement.
