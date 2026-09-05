// src/services/cartography/eckertGeoUtils.ts

import { eckertProjService } from './eckertProjService';

/**
 * Calcule la distance géodésique réelle (formule de Haversine) entre deux coordonnées WGS84 [lon, lat] en kilomètres.
 * Garantit des mesures exactes et non déformées par la projection plane.
 */
export function calculateGeodesicDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371.0088; // Rayon moyen de la Terre en km (IUGG)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Convertit des coordonnées géographiques réelles WGS84 [lon, lat]
 * en coordonnées de positionnement pour MapLibre sous projection Eckert IV.
 */
export async function geoToEckertMapCoord(coord: [number, number]): Promise<[number, number]> {
  return eckertProjService.realToFakeMercator(coord);
}

/**
 * Convertit les coordonnées captées depuis un événement MapLibre (click, mousemove, e.lngLat)
 * vers les coordonnées géographiques réelles WGS84 [lon, lat].
 */
export async function eckertMapCoordToGeo(fakeCoord: [number, number]): Promise<[number, number]> {
  return eckertProjService.fakeMercatorToReal(fakeCoord);
}

/**
 * Positionne un marqueur ou une popup MapLibre à sa position géographique réelle
 * en tenant compte de la projection active.
 */
export async function placeMarkerOnMap(
  markerOrPopup: { setLngLat: (coords: [number, number]) => any },
  realCoord: [number, number],
  isEckertIV: boolean
): Promise<void> {
  if (isEckertIV) {
    const fakeCoord = await geoToEckertMapCoord(realCoord);
    markerOrPopup.setLngLat(fakeCoord);
  } else {
    markerOrPopup.setLngLat(realCoord);
  }
}

/**
 * Dé-projette les coordonnées d'une entité ou d'une géométrie renvoyée par `queryRenderedFeatures`
 * pour restituer ses coordonnées géographiques réelles WGS84 dans les infobulles et panneaux.
 */
export async function unprojectRenderedFeatureCoordinates(
  feature: GeoJSON.Feature
): Promise<GeoJSON.Feature> {
  if (!feature || !feature.geometry) return feature;

  const geom = feature.geometry;

  const unprojectCoord = async (pt: [number, number]): Promise<[number, number]> => {
    return eckertProjService.fakeMercatorToReal(pt);
  };

  const transformCoordsArray = async (coords: any): Promise<any> => {
    if (typeof coords[0] === 'number') {
      return unprojectCoord(coords as [number, number]);
    }
    return Promise.all(coords.map((c: any) => transformCoordsArray(c)));
  };

  if (geom.type === 'GeometryCollection') {
    return feature;
  }

  const transformedCoords = await transformCoordsArray((geom as any).coordinates);

  return {
    ...feature,
    geometry: {
      ...geom,
      coordinates: transformedCoords
    } as any
  };
}

/**
 * Formate des coordonnées géographiques réelles en chaîne lisible (ex: "48.8566° N, 2.3522° E").
 */
export function formatGeographicCoordinates(lon: number, lat: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'O';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}
