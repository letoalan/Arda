# Spécification du Continent Builder

## 1. Flux de travail (Workflow)
1. **Création** : L'utilisateur clique sur "Nouveau Monde Fictif" depuis l'écran d'accueil (`WelcomeScreen`).
2. **Routage** : L'application détecte que le `worldType` est `fictional` et qu'il n'y a aucune entité géographique définie. L'utilisateur est redirigé vers `ContinentBuilderView`.
3. **Dessin (Lot 1)** : L'utilisateur trace des polygones libres sur un `<canvas>` représentant une carte du monde en projection équirectangulaire (2D plate). Les données sont stockées sous forme de `ContinentDraft` (coordonnées en pixels).
4. **Validation et Conversion (Lot 2)** : Lorsque l'utilisateur valide ses tracés, les `ContinentDraft` sont convertis en coordonnées géographiques (longitude/latitude) pour générer une `FeatureCollection<GeoJSON.Polygon>`.
5. **Générations de tuiles vectorielles MVT (Lot 3)** : Le GeoJSON est traité localement (ex: via `geojson-vt`) pour produire des tuiles vectorielles (littoraux).
6. **Modèle Numérique d'Élévation (DEM) et Tuiles Raster (Lot 5)** : Une grille d'altitude est calculée (fractal noise + distance à la côte) via `generateSyntheticDEM`. Cette grille est encodée en images PNG Terrain-RGB via `generateDEMTilesFromElevationGrid`.
7. **Affichage MapLibre (Lots 4 & 5)** : L'application bascule sur la vue carte principale avec un style spécifique (`fictional-world-style`). Deux protocoles custom (`mvt-memory-continents` et `dem-memory-continents`) servent respectivement les lignes de côtes et le relief (hillshade) directement depuis la mémoire du navigateur, offrant une topographie réaliste immédiate.

## 2. Types TypeScript

```typescript
// Représentation temporaire pendant la phase de dessin sur le canvas
export type ContinentDraft = {
  id: string; // UUID
  points: { x: number; y: number }[]; // Coordonnées en pixels par rapport au canvas
  name?: string; // Nom optionnel du continent
};

// Extension possible du schéma World pour stocker l'état (si on ne passe pas par les Entités classiques)
// Dans Braudel, nous stockons le GeoJSON directement dans l'état ou sous forme d'entités de type 'continent'.
export type ContinentEntity = {
  id: string;
  type: 'continent';
  name: string;
  geometry: GeoJSON.Polygon;
  properties: Record<string, any>;
};
```

## 3. Interfaces des Fonctions Clés

```typescript
/**
 * Convertit un ensemble de brouillons dessinés (pixels) en FeatureCollection GeoJSON (lon/lat)
 * @param drafts Les continents dessinés
 * @param canvasWidth Largeur du canvas de dessin
 * @param canvasHeight Hauteur du canvas de dessin
 */
export function draftsToGeoJSON(
  drafts: ContinentDraft[],
  canvasWidth: number,
  canvasHeight: number
): GeoJSON.FeatureCollection<GeoJSON.Polygon>;

/**
 * Génère des tuiles vectorielles (MVT) à la volée à partir d'un GeoJSON
 * @param geojson Les continents au format GeoJSON
 * @param maxZoom Niveau de zoom maximum pour la génération de tuiles
 */
export function generateMVTFromGeoJSON(
  geojson: GeoJSON.FeatureCollection,
  maxZoom: number
): Map<number, Map<string, ArrayBuffer>>; // Map imbriquée : zoom -> tileKey (x_y) -> ArrayBuffer (MVT)

/**
 * Génère un modèle numérique d'élévation synthétique à partir du GeoJSON.
 */
export function generateSyntheticDEM(
  geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon>,
  width: number,
  height: number,
  seed?: string
): Float32Array;

/**
 * Découpe une grille globale d'altitude en tuiles d'images Terrain-RGB (PNG).
 */
export function generateDEMTilesFromElevationGrid(
  elevationGrid: Float32Array,
  gridWidth: number,
  gridHeight: number,
  maxZoom: number,
  encoding: 'mapbox' | 'terrarium'
): Promise<Map<number, Map<string, ArrayBuffer>>>; // zoom -> tileKey -> ArrayBuffer (PNG)
```
