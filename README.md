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

Tu peux ensuite charger `hal-publications.json` et remplacer/compléter les entrées de la section `publications` dans `index.html`.

Exemple minimal (dans `init()`):

```js
const data = await fetch("data.json").then(res => res.json());

// Optionnel : fusion HAL
const halPublications = await fetch("hal-publications.json")
  .then(res => (res.ok ? res.json() : []))
  .catch(() => []);

const publicationsNode = data.nodes.find(n => n.id === "publications");
if (publicationsNode && Array.isArray(halPublications) && halPublications.length) {
  publicationsNode.summary = `${halPublications.length} publication(s) synchronisée(s) depuis HAL.`;
}
```

### Pourquoi cette approche ?

- Évite les blocages CORS / anti-bot possibles côté navigateur.
- Évite de dépendre de l’API HAL à chaque visite.
- Tu maîtrises le format final côté site.
