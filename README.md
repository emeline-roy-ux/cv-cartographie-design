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
