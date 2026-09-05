# Implémentation Option A : Couche Alpha Préalable pour les Fonds Géopolitiques

Mise en place de la **Couche Alpha** (« Fond Géopolitique (Alpha) »), créée automatiquement comme socle fondamental avant toute création de couches thématiques par l'utilisateur.

---

## 1. Description & Objectifs

Actuellement, l'importation de fonds géopolitiques historiques depuis le catalogue (`GeopoliticaPanel`) injecte des entités associées à un identifiant orphelin (`'layer-1'`) sans qu'aucune couche ne soit enregistrée dans `world.layers` ni dans IndexedDB.

L'**Option A** apporte les améliorations suivantes :
1. **Création native & automatique de la Couche Alpha** (`order: 0`, `type: 'political'`, `name: 'Fond Géopolitique (Alpha)'`) lors de l'instanciation de tout nouveau monde (`createRealWorld`).
2. **Auto-réparation rétrocompatible** à l'ouverture des mondes existants dans IndexedDB (`handleInitFromDB`) : si `layers` est vide, la couche Alpha est générée et les entités orphelines lui sont rattachées.
3. **Ciblage par défaut dans les flux d'import** ([`GeopoliticaPanel.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/GeopoliticaPanel.tsx), [`ImportPreviewModal.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/components/geojson/ImportPreviewModal.tsx)).
4. **Visibilité & gouvernance dans l'IHM** ([`LayerPanel.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/LayerPanel.tsx)) : badge distinctif « Alpha », compteur d'entités en temps réel, possibilité d'activer/masquer l'ensemble du fond géopolitique en un clic, et protection anti-suppression intempestive.

---

## 2. Modifications Proposées

### Gestion du Store & Cycle de Vie des Mondes

#### [MODIFY] [storeActions.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/state/storeActions.ts)
- Dans `executeCreateRealWorld` :
  - Générer la couche Alpha via `createLayer(worldRecord.id, 'political', 'Fond Géopolitique (Alpha)', 0)`.
  - Marquer `alphaLayer.meta.isBaseLayer = true`.
  - Persister `alphaLayer` dans la table IndexedDB `layers`.
  - Initialiser `loadedWorld.layers = [alphaLayer]`.
- Dans `executeCreateFictionalWorld` :
  - Générer la couche Alpha `createLayer(worldRecord.id, 'physical', 'Fond Géographique (Alpha)', 0)`.

#### [MODIFY] [worldSlice.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/state/worldSlice.ts) & [slices/worldSlice.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/state/slices/worldSlice.ts)
- Dans `handleInitFromDB` :
  - Si le monde chargé contient `layers.length === 0`, instancier et persister automatiquement la couche Alpha appropriée.
  - Réassigner toute entité dont le `layerId` est orphelin (inexistant dans `layers`) à la couche Alpha.

---

### IHM & Flux d'Importation

#### [MODIFY] [GeopoliticaPanel.tsx](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/GeopoliticaPanel.tsx)
- Mettre à jour `handleConfirmImport` pour cibler en priorité la couche Alpha (`world.layers[0]?.id`) plutôt que la chaîne magique `'layer-1'`.

#### [MODIFY] [ImportPreviewModal.tsx](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/components/geojson/ImportPreviewModal.tsx)
- Sélectionner par défaut la couche Alpha dans la liste déroulante des couches cibles.

#### [MODIFY] [LayerPanel.tsx](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/app/views/LayerPanel.tsx)
- Ajouter un badge visuel épuré « Alpha » à côté du nom de la couche socle.
- Afficher le nombre d'entités rattachées à chaque couche (`X entités`).
- Sécuriser la suppression : avertissement spécifique si tentative de suppression de la couche socle, et interdiction si c'est la seule couche du monde.

---

### Tests Automatisés

#### [MODIFY] [multiworld.test.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/braudel/src/tests/multiworld.test.ts)
- Adapter les assertions de comptage de couches pour refléter la présence de la couche Alpha initiale lors de la création d'un monde (`layers.length === 2` après ajout d'une couche utilisateur au lieu de 1).
- Ajouter un test dédié certifiant que tout nouveau monde possède immédiatement sa couche Alpha avec `order: 0`.

---

## 3. Plan de Vérification

### Tests Automatisés
- Exécution de la suite Vitest complète :
  ```bash
  npx vitest run
  ```
  Vérification que les 256 tests (ou plus avec les nouveaux tests) passent à 100%.
- Validation stricte du typage TypeScript :
  ```bash
  npx tsc --noEmit
  ```

### Vérification Manuelle & Visuelle
- Tester la création d'un nouveau monde dans le navigateur : vérifier la présence immédiate de `Fond Géopolitique (Alpha)` dans `LayerPanel`.
- Importer un fond géopolitique (ex. Al-Idrisi 1154) : vérifier qu'il est rattaché à la couche Alpha et que le bouton `Eye` masque/affiche immédiatement les polygones.
- Créer une couche utilisateur ultérieure : vérifier qu'elle s'ajoute au-dessus avec `order: 1`.

---

## 4. Documentation Wiki-as-Code
Mise à jour synchronisée des fichiers `.md` associés :
- `storeActions.md`, `worldSlice.md`, `GeopoliticaPanel.md`, `ImportPreviewModal.md`, `LayerPanel.md`, `task.md`, `walkthrough.md`.
