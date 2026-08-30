# Documentation — Rendu GeoJSON des Entités (`mapGeojsonRenderer.ts`)

## Rôle & Responsabilité
`mapGeojsonRenderer.ts` génère dynamiquement la `FeatureCollection` GeoJSON injectée dans la source MapLibre `braudel-entities` à chaque changement de date de la timeline ou lors des captures d'exportations.

## Fonctionnalités Clés
- **Filtrage temporel robuste** : Gère de façon transparente les plages temporelles sous forme d'objet (`{ validFrom, validTo }`) et de tableau (`[startYear, endYear]`), assurant qu'aucune entité ou calque historique importé n'est rejeté lors d'un snapshot à date médiane.
- **Support des relations spatiales** : Lie les entités spatialisées par des segments `LineString` orientés.
- **Rendu vectoriel stylisé** : Attribue les styles visuels (couleur de fond `fillColor`, contour `strokeColor`, opacités) pour les calques `braudel-polygons`, `braudel-lines` et `braudel-points`.
