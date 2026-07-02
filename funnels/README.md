# Funnels — Cocktail Piscine (Occi Piscines 34)

Deux funnels d'acquisition en **A/B test**, prêts à héberger (HTML autonome, zéro dépendance).

| Funnel | Fichier | Rôle | Conversion finale |
|---|---|---|---|
| **A** | [`funnel-a-quiz.html`](funnel-a-quiz.html) | Quiz-estimateur qui **qualifie + fait prendre RDV** | Créneau de RDV conseil réservé (catalogue = bonus) |
| **B** | [`funnel-b-whatsapp.html`](funnel-b-whatsapp.html) | **Conversationnel WhatsApp** — CPL bas, setting intégré | Ouverture d'une conversation WhatsApp pré-qualifiée |

Les deux reprennent l'identité de marque (coque française, 40 ans, 7 usines, ~50 modèles, **double garantie décennale**, équipe locale de Jacou notée 5/5) et alignent la promesse avec le site officiel `cocktailpiscine.com`.

---

## Funnel A — Quiz → prise de RDV

Parcours : **7 étapes** → confirmation.
1. Type de piscine  2. Accès terrain  3. Délai  4. Budget  5. Propriétaire + code postal
6. Coordonnées (nom, tél, email)  7. **Choix du créneau de RDV** (jour + matin/midi/après-midi)
→ Écran de confirmation : RDV pré-réservé + **estimation indicative chiffrée** + catalogue offert en bonus.

- La qualification (propriétaire ✓ / terrain ✓ / budget ✓ / délai ✓) et le booking sont **fusionnés** : le lead arrive déjà chaud avec un créneau.
- L'estimation est calculée côté client à partir du type + budget (fourchette ±, arrondie). Purement indicative.

## Funnel B — Conversationnel WhatsApp

Mini-conversation façon chat (3 micro-questions : type · délai · propriétaire) → prénom + tél → **bouton WhatsApp**.
Le message WhatsApp est **pré-rempli et pré-qualifié** (`wa.me/<numéro>?text=…`), donc le setting démarre chaud, sans re-questionner le prospect.

- Idéal aussi tel quel en campagne **« Click to WhatsApp »** native Meta (l'ad peut pointer directement vers `wa.me/...`, la page sert de bridge de qualification pour baisser le CPL et filtrer).
- Le tél est capté en secours (si WhatsApp coupe) et peut être loggé au CRM via l'endpoint.

---

## Intégration (à faire avant lancement)

### 1. Endpoint de capture des leads
Dans chaque fichier, en haut du `<script>` :

```js
// Funnel A
window.LEAD_CONFIG = { funnel:"A-quiz-rdv", endpoint:"", redirectOnSuccess:"" };
// Funnel B
window.WA_CONFIG   = { funnel:"B-whatsapp", phone:"33600000000", endpoint:"" };
```

- `endpoint` : URL POST (webhook **Zapier/Make**, **Google Sheets** via Apps Script, ou CRM). Reçoit un JSON avec toutes les réponses + coordonnées + estimation.
  Laisser **vide** = mode démo (le lead est loggé dans la console, le funnel fonctionne quand même).
- `redirectOnSuccess` *(Funnel A, optionnel)* : URL d'une page « merci » externe. Si vide → écran de confirmation intégré.

**Payload envoyé (exemple Funnel A) :**
```json
{
  "funnel":"A-quiz-rdv","type":"fond-plat","acces":"oui-facile","delai":"3mois",
  "budget":"15-20","proprietaire":"oui","cp":"34830",
  "nom":"Camille Durand","tel":"06 12 34 56 78","email":"camille@email.fr",
  "rdvDate":"2026-07-05","rdvDateLabel":"sam 5 juil.","rdvTime":"matin","rdvTimeLabel":"Matin 9 h – 12 h",
  "estimLow":15000,"estimCenter":16000,"estimHigh":18000,
  "page":"https://…","submitted_at":"2026-07-02T…Z"
}
```

### 2. Numéro WhatsApp (Funnel B) — OBLIGATOIRE
Remplacer `WA_CONFIG.phone` par le numéro de l'agence au **format international sans `+`** (ex. `33612345678`).

### 3. Meta Pixel
En bas de chaque fichier, décommenter le bloc `META PIXEL` et remplacer `PIXEL_ID`.
Events déjà câblés (via `fbq` **et** `dataLayer` pour GTM) :

| | Funnel A | Funnel B |
|---|---|---|
| Chargement | `PageView` | `PageView` |
| Complétion | `Lead` + `Schedule` (RDV) | `Lead` |
| — | | `Contact` (clic WhatsApp) |

Configurer la **conversion Meta** sur `Schedule` (Funnel A) et `Contact` (Funnel B) pour optimiser sur le lead chaud, pas juste le clic.

### 4. Hébergement
Fichiers 100 % autonomes (CSS/JS inline) → déposer sur n'importe quel hébergeur statique
(Netlify, Vercel, GitHub Pages, o2switch, ou une page du site existant). Aucune build step.

---

## À tester (protocole A/B)
Router 50/50 le trafic ads entre A et B, puis comparer, par le doc stratégie §6 :
**CPL · taux lead→RDV · taux RDV→devis · taux devis→signature · CAC · net après ads.**
Garder le gagnant, killer le perdant. Règle d'or : rappel < 1 h en horaire ouvré.
