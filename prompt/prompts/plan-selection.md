# Plan d'implémentation — Sélection et Prévisualisation des Couches GeoJSON
## Projet ARDA / Braudel / Tolkien

## Objectif

Permettre à l'utilisateur de choisir précisément les objets (features) à importer sur la carte, quelle que soit la source (Fonds Géopolitica ou Catalogue Unifié téléchargeable), après une étape de prévisualisation obligatoire. Aucun objet non sélectionné ne doit apparaître sur la carte.

---

## Principe directeur

Découpler le téléchargement/parsing d'un fond GeoJSON de son rendu sur la carte. Le pipeline actuel va directement du fetch au rendu final via `addLayerToMap`, sans étape de sélection fine au niveau des features. Le nouveau flux insère une étape intermédiaire de sélection d'objets entre le parsing et la normalisation en entités Braudel.

---

## Nouveau pipeline cible

Pipeline actuel :
fetch → parsing JSON → normalisation en entités → persistance IndexedDB → store Zustand → rendu MapLibre

Nouveau pipeline :

1. Fetch (identique, via `fetch(url)`)
2. Parsing JSON + extraction des features (identique)
3. **[NOUVEAU] Indexation légère** : chaque feature reçoit un identifiant temporaire et des métadonnées résumées (nom, type, période, source, taille approx.), sans normalisation complète.
4. **[NOUVEAU] Prévisualisation interactive** : l'utilisateur coche les objets qu'il veut importer, avec filtres et aperçu carte.
5. **[NOUVEAU] Validation** : résumé final (nombre, période, poids, chevauchements) avant confirmation.
6. Normalisation en entités Braudel — uniquement pour les objets sélectionnés.
7. Persistance IndexedDB (batch de 50, logique conservée).
8. Store Zustand mis à jour avec seulement les entités choisies.
9. Rendu MapLibre — la source GeoJSON de la carte ne contient que les entités sélectionnées.

---

## Phase 1 — Indexation légère (couche d'abstraction commune)

**Objectif** : unifier la représentation des objets, qu'ils viennent d'un fichier local Géopolitica ou d'une source distante du Catalogue Unifié.

- Créer un type `ImportCandidate` commun :
  ```typescript
  type ImportCandidate = {
    tempId: string;
    name: string;
    sourceId: string;
    sourceType: 'geopolitica' | 'catalogue';
    family?: GeojsonFamily;
    referenceYear?: number;
    validFrom?: number;
    validTo?: number;
    geometryType: string;
    approxSizeKB: number;
    rawFeatureRef: GeoJSON.Feature;
  };
  ```
- Ajouter une fonction `buildCandidateIndex(features, sourceMeta)` qui parcourt les features sans les convertir en entités complètes (pas de `crypto.randomUUID`, pas d'écriture IndexedDB à ce stade).
- Cette fonction doit s'appliquer aussi bien aux fichiers Géopolitica parsés localement qu'aux fichiers du Catalogue Unifié téléchargés via HTTPS, pour que la sélection soit source-agnostique.

**Livrable** : `candidateIndexer.ts` (nouveau fichier partagé).

---

## Phase 2 — Composant de prévisualisation (React)

Créer un nouveau composant `ImportPreviewModal.tsx`, déclenché après le fetch/parsing, avant toute normalisation :

- **Liste des objets** avec case à cocher, regroupée par nom/type/continent selon les métadonnées disponibles (NAME, SUBJECTO, CONTINENT).
- **Filtres rapides** : par période (réutiliser la logique `computeAutomaticRange`), par famille (historical, contemporary, administrative, maritime), par mot-clé.
- **Sélection groupée** : boutons "Tout sélectionner", "Tout désélectionner", "Sélectionner la période visible".
- **Mini-carte de prévisualisation** (MapLibre en mode léger, sans persistance) affichant en surbrillance les objets actuellement cochés, pour une validation visuelle avant import.
- **Compteur dynamique** : nombre d'objets sélectionnés, poids estimé total, plage temporelle couverte.

**Livrable** : `ImportPreviewModal.tsx` (nouveau composant).

---

## Phase 3 — Écran de validation finale

Avant de déclencher la normalisation, afficher un résumé condensé :

- Nombre d'entités à créer.
- Sources d'origine (ex. "42 objets depuis 39-world1800.geojson", "12 objets depuis Natural Earth 2024").
- Alerte si chevauchement temporel entre objets sélectionnés de sources différentes.
- Alerte si poids total dépasse un seuil (ex. 20 Mo), avec rappel du mécanisme de batching existant.
- Bouton final "Confirmer l'import de X objets".

**Livrable** : sous-composant `ImportSummary.tsx` intégré à `ImportPreviewModal.tsx`.

---

## Phase 4 — Normalisation ciblée

Modifier `geopoliticaImporter.ts` et le service catalogue pour n'accepter qu'une liste filtrée de features en entrée, plutôt que le fichier complet :

- Nouvelle signature :
  ```typescript
  function normalizeSelectedFeatures(selectedCandidates: ImportCandidate[]): Entity[]
  ```
- La logique existante de normalisation (`resolveDisplayName`, `temporalRange`, `properties.color`, etc.) reste inchangée, mais s'applique uniquement aux `rawFeatureRef` des candidats cochés.
- Le calcul automatique des plages temporelles (`computeAutomaticRange`) est conservé mais recalculé uniquement sur le sous-ensemble sélectionné, pour éviter des `validTo` incohérents avec des couches non importées.

**Fichiers modifiés** : `geopoliticaImporter.ts`, `geojson-catalog-service.ts`.

---

## Phase 5 — Batching et persistance inchangés, mais ciblés

Le mécanisme de batch de 50 entités avec `setTimeout(insertNextBatch, 0)` reste pertinent et doit simplement recevoir la liste réduite d'entités sélectionnées :

- `store.ts` : `importGeopolitica(selectedEntities: Entity[])` remplace l'import du fichier complet.
- La barre de progression (`importProgress`) reste basée sur le nombre d'entités du sous-ensemble, ce qui la rend plus précise puisqu'elle ne compte plus tout le fichier mais uniquement ce qui a été choisi.

**Fichier modifié** : `store.ts`.

---

## Phase 6 — Rendu MapLibre restreint

Le service `maplibre.ts` doit garantir que `addLayerToMap` ne reçoit que les entités du store liées à l'import validé :

- Vérifier que la source GeoJSON de la carte est reconstruite à partir de `world.entities` (déjà filtré), et non depuis le fichier brut.
- Ajouter un identifiant de lot d'import (`importBatchId`) sur chaque entité pour permettre un retrait ciblé ultérieur ("annuler cet import").

**Fichier modifié** : `maplibre.ts`.

---

## Phase 7 — Traçabilité et retour en arrière

Pour sécuriser l'usage, ajouter :

- Un historique des imports (source, date, nombre d'objets, `importBatchId`).
- Une action "Annuler le dernier import" qui retire du store et d'IndexedDB uniquement les entités portant ce `importBatchId`.

**Fichiers modifiés** : `store.ts`, `indexeddb.ts` (ajout d'une méthode `deleteEntitiesByBatch`).

---

## Tableau récapitulatif des changements par fichier

| Fichier | Changement principal |
|---|---|
| `geopoliticaRegistry.ts` | Aucun changement structurel, reste source de vérité des fonds |
| `geojson-catalog-service.ts` | Ajout d'une fonction d'indexation légère commune avec Géopolitica |
| `geopoliticaImporter.ts` | Nouvelle fonction `normalizeSelectedFeatures`, `computeAutomaticRange` restreint au sous-ensemble |
| `GeopoliticaPanel.tsx` | Ajout de l'appel au nouveau `ImportPreviewModal.tsx` avant tout import |
| `ImportPreviewModal.tsx` (nouveau) | Sélection, filtres, mini-carte, validation |
| `candidateIndexer.ts` (nouveau) | Indexation légère commune aux deux sources |
| `store.ts` | `importGeopolitica` accepte une liste d'entités déjà filtrées, ajout `importBatchId` |
| `maplibre.ts` | `addLayerToMap` alimenté uniquement par `world.entities` filtrées |
| `indexeddb.ts` | Ajout de `deleteEntitiesByBatch`, sinon inchangé |

---

## Ordre de mise en œuvre recommandé

1. Créer le type `ImportCandidate` et la fonction d'indexation légère (base commune aux deux sources).
2. Construire `ImportPreviewModal.tsx` en mode lecture seule (sans encore bloquer l'ancien flux).
3. Brancher l'écran de validation avec résumé chiffré.
4. Modifier `normalizeSelectedFeatures` pour accepter un sous-ensemble.
5. Adapter `store.ts` et `maplibre.ts` pour n'ingérer que les entités validées.
6. Ajouter la traçabilité (`importBatchId`) et l'action d'annulation.
7. Basculer définitivement `GeopoliticaPanel.tsx` sur le nouveau flux, en retirant l'ancien import direct.

Cette séquence permet une livraison progressive : dès l'étape 3, l'utilisateur bénéficie déjà d'une prévisualisation, même si le filtrage fin n'est pas encore branché sur le rendu final.
