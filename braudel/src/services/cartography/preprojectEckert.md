# Pré-déformation Statique & Tuilage — `preprojectEckert.ts`

Ce module implémente la **Phase 2 (Voie de Production)** de la spécification [`eckert.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/eckert.md) : la pré-projection statique des données GeoJSON et leur découpage vectoriel en pyramides de tuiles via `geojson-vt`.

---

## 1. Principe & Performance

Au lieu de ré-exécuter le moteur PROJ Wasm à chaque frame d'affichage ou à chaque interaction de zoom/pan :
1. Les géométries GeoJSON sont projetées une seule fois en coordonnées **fake Mercator** adaptées à Eckert IV via `preprojectGeoJSONForEckert`.
2. Les géométries sont conservées dans un cache mémoire (`eckertGeoJsonCache`) indexé par clé d'époque ou d'identifiant de fichier.
3. Le découpage vectoriel multi-échelles est indexé par `geojson-vt` via `createEckertVectorTileIndex`.
4. MapLibre peut ainsi piocher directement dans cet index de tuiles découpées avec un coût de rendu frame-by-frame strictement nul (0 ms de calcul de reprojection).

---

## 2. API & Signatures

| Fonction | Description |
|---|---|
| `countVertices(geom)` | Compte récursivement le nombre total de sommets d'une géométrie. |
| `preprojectGeoJSONForEckert(geojson, cacheKey?)` | Projette une collection GeoJSON avec mise en cache. |
| `createEckertVectorTileIndex(geojson, options?, cacheKey?)` | Génère l'index `geojson-vt` complet et les métriques de sommets/durée. |
| `clearEckertPreprojectCache()` | Vide le cache mémoire des collections pré-déformées. |

---

## 3. Fil d'Ariane
[cartography.md](./cartography.md) -> **preprojectEckert.md** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
