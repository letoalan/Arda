# Utilitaires Géographiques Custom — `eckertGeoUtils.ts`

Ce module implémente la **Phase 3** de la spécification [`eckert.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/Arda/eckert.md) : la gestion universelle des opérations géographiques (coordonnées, distances réelles, placement de marqueurs, popups, dé-projection des entités sélectionnées) adaptées au mode Eckert IV.

---

## 1. Problématique & Solution

MapLibre GL JS calculant nativement ses interactions en supposant du Web Mercator, les opérations suivantes sont corrigées par ce module :
1. **Placement de Marqueurs & Popups** : `placeMarkerOnMap` adapte le point d'ancrage en coordonnées fake Mercator pour que l'étiquette ou le point s'aligne fidèlement sur la géométrie déformée.
2. **Mesure de Distances** : `calculateGeodesicDistanceKm` calcule la vraie distance orthodromique (grand cercle) entre deux points sans subir les anamorphoses de surface d'Eckert IV ou de Mercator.
3. **Sélection d'Entités & Infobulles** : `unprojectRenderedFeatureCoordinates` reconvertit les coordonnées brutes retournées par `map.queryRenderedFeatures()` vers le système WGS84 d'origine.

---

## 2. API Publique

| Fonction | Rôle |
|---|---|
| `calculateGeodesicDistanceKm(c1, c2)` | Calcul de distance Haversine en km entre deux points `[lon, lat]`. |
| `geoToEckertMapCoord(coord)` | Conversion WGS84 $\to$ coordonnée de placement MapLibre. |
| `eckertMapCoordToGeo(fakeCoord)` | Conversion coordonnée d'événement MapLibre $\to$ WGS84. |
| `placeMarkerOnMap(marker, coord, isEckert)` | Positionne un marqueur/popup selon la projection active. |
| `unprojectRenderedFeatureCoordinates(feature)` | Restaure les coordonnées WGS84 réelles d'une entité cliquée. |
| `formatGeographicCoordinates(lon, lat)` | Formatage textuel conventionnel (`48.8566° N, 2.3522° E`). |

---

## 3. Fil d'Ariane
[cartography.md](./cartography.md) -> **eckertGeoUtils.md** -> [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
