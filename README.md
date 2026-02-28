# cv-cartographie-design

## Logique des identifiants `data.json`

Le fichier `data.json` reste une arborescence plate (`nodes`) pilotée par la clé `parent`.

- Les sections éditoriales et les 4 nœuds de la constellation du hero sont :
  - `publications`
  - `vie_scientifique`
  - `responsabilites_institutionnelles`
  - `enseignements`
- Le rendu des sections est généré automatiquement en récupérant les enfants et petits-enfants de chaque section.
- Les champs optionnels (`summary`, `thumb`) peuvent être ajoutés nœud par nœud sans casser l’existant.

Cette structure permet de garder la visualisation D3 simple en haut de page, tout en conservant un contenu textuel lisible et extensible en dessous.

## Récupérer automatiquement les publications depuis HAL

Oui, c’est possible.

Le plus simple sur ce projet statique est de **synchroniser HAL en amont** (build / script), puis d’afficher un fichier JSON local.

### 1) Exporter depuis HAL

Un script Node est disponible :

```bash
node scripts/sync-hal.mjs --query "authIdHal_s:emeline-cusenier" --output hal-publications.json
```

Options utiles :

- `--rows 200` : nombre maximal de résultats.
- `--query "..."` : requête SOLR HAL personnalisée.
- `HAL_API_BASE` : permet de changer l’URL de l’API (miroir/proxy), ex. `https://api.archives-ouvertes.fr/search/`.

### 2) Brancher les données HAL dans la section Publications

C’est déjà intégré dans `index.html` : le site tente de charger `hal-publications.json` au démarrage.

- Si le fichier est présent, ses entrées sont injectées automatiquement comme enfants de `publications`.
- Si le fichier est absent, le site continue d’utiliser uniquement `data.json` (fallback silencieux).

```js
const halPublications = await fetch("hal-publications.json")
  .then(res => (res.ok ? res.json() : []))
  .catch(() => []);

mergeHalPublications(data.nodes || [], halPublications);
```

### Pourquoi cette approche ?

- Évite les blocages CORS / anti-bot possibles côté navigateur.
- Évite de dépendre de l’API HAL à chaque visite.
- Tu maîtrises le format final côté site.
