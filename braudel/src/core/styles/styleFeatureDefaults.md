# Module `styleFeatureDefaults.ts`

Ce module centralise la configuration des fonctionnalités cartographiques par défaut (lignes de rhumb, graticule 10°, frontières politiques) ainsi que l'adaptation dynamique des palettes chromatiques pour l'ensemble des 25 styles cartographiques d'Arda.

## Fonctions Exportées

### 1. `getBasemapFeatureDefaults(styleId: BasemapStyleId): BasemapFeatureDefaults`
Retourne un objet décrivant l'activation par défaut :
- `portulanRhumbVisible: boolean` : **Désactivé systématiquement (`false`)** sur l'ensemble des 25 fonds cartographiques. L'utilisateur active manuellement la coche s'il souhaite afficher les lignes de rhumb et les roses des vents.
- `graticuleVisible: boolean` : **Désactivé systématiquement (`false`)** sur l'ensemble des 25 fonds cartographiques. L'utilisateur active manuellement la coche s'il souhaite afficher les méridiens et parallèles 10°.
- `bordersVisible: boolean` : Activé par défaut sur les cartes contemporaines et modernes, désactivé sur les cartes antiques et médiévales.
- **Coche et décoche multiple 2D / 3D** : Lorsque l'utilisateur coche ou décoche ces options, le système garantit une réactivité immédiate en 2D (Mercator) comme en 3D (Globe, Pitch et Relief) avec rafraîchissement forcé (`triggerRepaint`) et synchronisation instantanée de la palette chromatique.

### 2. `getGraticuleStyleForBasemap(styleId: BasemapStyleId): GraticuleLayerStyle`
Calcule les propriétés graphiques MapLibre pour le graticule vectoriel 10° (`colonial-graticule-lines` et `colonial-graticule-labels`) :
- `lineColor` : Teinte harmonisée (phosphore `#22c55e` pour Wargames, cyan `#38bdf8` pour Positron Lite/Satellite, sépia `#784421` pour Colonial, terre d'ombre `#7a4a20` pour Portulan Catalan, ocre bistre `#855a2a` pour Atlas Maior Blaeu, etc.).
- `lineOpacity` : Niveau de transparence calibré (`0.45` à `0.55`) pour préserver la lisibilité de la topographie tout en assurant un contraste net sur les parchemins et fonds sombres.
- `textColor` : Couleur contrastée pour les étiquettes de méridiens et parallèles.
- `textHaloColor` & `textHaloWidth` : Halo sombre pour les thèmes noirs/nocturnes/satellitaires, halo clair/parchemin pour les thèmes historiques.

