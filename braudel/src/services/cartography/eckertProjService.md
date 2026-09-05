# Service de Reprojection Eckert IV — `eckertProjService.ts`

Ce service encapsule le moteur de reprojection **Eckert IV (`ESRI:54012`)** basé sur la bibliothèque `backproj` et son intégration MapLibre `maplibre-proj` (spécification [`eckert.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/eckert.md)).

---

## 1. Rôle et Architecture

Le service met en œuvre la technique dite du **"Dirty Reprojector"** pour permettre à MapLibre GL JS d'afficher le planisphère équivalent d'Eckert IV tout en conservant son pipeline de rendu interne Web Mercator :

```mermaid
graph TD
    A["Coordonnées WGS84 [lon, lat]"] -->|Wasm PROJ 9| B["Mètres Projetés Eckert IV (ESRI:54012)"]
    B -->|Mise à l'échelle uniforme globale Sx = Sy| C["Mètres Mercator"]
    C -->|Inverse Mercator Wasm| D["Coordonnées Fake Mercator [fakeLon, fakeLat]"]
    D -->|Moteur WebGL MapLibre (projection: mercator)| E["Planisphère Eckert IV Rendu à l'Écran"]
```

---

## 2. Constantes et Spécifications

- **Code CRS Cible** : `ESRI:54012` (World Eckert IV).
- **Définition PROJ** : `+proj=eck4 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs`.
- **Mode d'Échelle** : Global (affine uniforme $S_x = S_y, O_x = O_y = 0$), préservant strictement les rapports de forme et les surfaces relatives.

---

## 3. Méthodes Publiques

| Méthode | Signature | Rôle |
|---|---|---|
| `init()` | `() => Promise<Transformer>` | Initialise PROJ WebAssembly et compile le `Transformer` réutilisable. |
| `getTransformer()` | `() => Transformer \| null` | Renvoie le transformateur en mémoire cache. |
| `realToFakeMercator(coord)` | `(coord: [number, number]) => Promise<[number, number]>` | Transforme un point réel `[lon, lat]` en coordonnées fake Mercator pour injection MapLibre. |
| `fakeMercatorToReal(coord)` | `(coord: [number, number]) => Promise<[number, number]>` | Convertit des coordonnées récupérées depuis MapLibre (clic, `queryRenderedFeatures`) vers `[lon, lat]` réels. |
| `transformCoordinates(coords)` | `(coords: [number, number][]) => Promise<[number, number][]>` | Transformation par lot de coordonnées réelles. |
| `reprojectGeoJSON(geojson)` | `(geojson: T) => Promise<T>` | Reprojette récursivement une géométrie ou `FeatureCollection` GeoJSON. |
| `reprojectMapStyle(style, options)` | `(style: StyleSpecification) => Promise<ReprojectResult>` | Réécrit les sources d'un style MapLibre et installe les protocoles de tuiles vectorielles. |
| `shutdown()` | `() => Promise<void>` | Nettoie les protocoles, termine le pool de workers WebAssembly et libère la mémoire. |

---

## 4. Points d'Attention

1. **Sources Vectorielles vs Raster** : `maplibre-proj` reprojette à la volée les sources de type `geojson` et `vector` (MVT). Les sources raster de relief (`raster-dem`) ne sont pas altérables par déformation géométrique de sommets.
2. **Réutilisation du Transformateur** : La compilation du transformateur PROJ est conservée en mémoire singleton pour éviter les latences de compilation lors des bascules d'état.
