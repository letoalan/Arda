# Tests Unitaires `basemap-features.test.ts`

Ce fichier de test valide le comportement des graticules (méridiens et parallèles 10°) et des lignes de rhumb (triangulation portulane et roses des vents) à travers l'ensemble des fonds cartographiques :

## Suites de Tests

1. **`Basemap Features — Defaults & Palettes par style`** :
   - Vérifie que chacun des 25 styles cartographiques est géré par `getBasemapFeatureDefaults`.
   - **Règle d'or** : Valide que `portulanRhumbVisible` et `graticuleVisible` sont **strictement à `false` par défaut** sur tous les fonds (aucun calque de rhumb ou de graticule actif au démarrage).
   - Valide les contrastes élevés des palettes sur les thèmes sombres et satellitaires lorsque l'utilisateur les active.

2. **`Store UI Actions — Déconnexion par défaut & activation manuelle par l'utilisateur`** :
   - Vérifie que `setBasemapStyle` conserve toujours `portulanRhumbVisible` et `graticuleVisible` à `false` lors d'un changement de fond.
   - Vérifie l'activation et la désactivation manuelles dans le menu (`setGraticuleVisible`, `setPortulanRhumbVisible`).

3. **`MapLibre Layers — Manipulation des calques Graticule & Rhumb`** :
   - Teste l'initialisation de `initColonialGraticuleLayer` et `initRhumbNetworkLayer`.
   - Valide le masquage strict via `toggleGraticuleGrid(false)` et `toggleRhumbLines(false)`.
   - Valide la mise à jour dynamique des palettes via `updateGraticuleStyle` et `updateRhumbPalette`.
   - **Coche et décoche multiple en 2D comme en 3D** : Vérifie l'enchaînement de 5 cycles consécutifs d'activation/désactivation sans conflit de calques, avec appel systématique de `map.triggerRepaint()` pour un rendu instantané en Mercator (2D) comme en Globe / Pitch (3D).
   - **Auto-réparation / Self-healing** : Vérifie que si une source GeoJSON existe déjà mais que les calques ont été détruits (suite à un rechargement de style MapLibre), un appel à `toggleGraticuleGrid(true)` ou `toggleRhumbLines(true)` recrée automatiquement les calques manquants avec la palette adaptée.
   - **Ordre d'empilement `beforeId`** : Vérifie que les calques de repères (graticules et rhumbs) sont insérés sous `braudel-polygons` pour ne pas masquer les entités historiques créées par l'utilisateur.
   - **Vérification non-bloquante `getStyle()`** : Vérifie que l'initialisation et la bascule s'effectuent sans blocage asynchrone lorsque le style est disponible.
