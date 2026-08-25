import { Feature, Geometry, Polygon } from 'geojson';

/**
 * Calcule une zone tampon (buffer) simple autour d'une géométrie GeoJSON.
 * Supporte les Points, LineStrings et les Polygones.
 * 
 * @param geometry La géométrie GeoJSON d'origine.
 * @param radiusKm Rayon de la zone tampon en kilomètres.
 * @returns Une entité Polygone GeoJSON représentant la zone tampon.
 */
export function calculateBuffer(geometry: Geometry, radiusKm: number): Feature<Polygon> {
  const DEG_TO_KM = 111.32; // approximativement 111.32 km par degré à l'équateur
  const radiusDeg = radiusKm / DEG_TO_KM;
  
  if (geometry.type === 'Point') {
    const [lon, lat] = geometry.coordinates as [number, number];
    const coordinates: [number, number][] = [];
    const segments = 32;
    
    // Générer un cercle approché de 32 points
    for (let i = 0; i <= segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      // Correction de la distorsion de longitude selon la latitude
      const latCorrection = Math.cos((lat * Math.PI) / 180);
      const dLon = radiusDeg * Math.cos(angle) / (latCorrection || 1);
      const dLat = radiusDeg * Math.sin(angle);
      coordinates.push([lon + dLon, lat + dLat]);
    }
    
    return {
      type: 'Feature',
      properties: { name: `Zone Tampon Point (${radiusKm} km)` },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };
  }
  
  if (geometry.type === 'LineString' || geometry.type === 'Polygon') {
    const coords = (geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates) as [number, number][];
    const bufferPoints: [number, number][] = [];
    
    // Dilater grossièrement chaque segment en dessinant des enveloppes autour de chaque point
    for (const [lon, lat] of coords) {
      const segments = 16;
      for (let i = 0; i <= segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        const latCorrection = Math.cos((lat * Math.PI) / 180);
        const dLon = radiusDeg * Math.cos(angle) / (latCorrection || 1);
        const dLat = radiusDeg * Math.sin(angle);
        bufferPoints.push([lon + dLon, lat + dLat]);
      }
    }
    
    // Calculer une enveloppe convexe (Convex Hull) simplifiée pour fermer la zone tampon
    // Algorithme de Graham Scan simplifié
    bufferPoints.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const lower: [number, number][] = [];
    for (const p of bufferPoints) {
      while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }
    
    const upper: [number, number][] = [];
    for (let i = bufferPoints.length - 1; i >= 0; i--) {
      const p = bufferPoints[i];
      while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }
    
    upper.pop();
    lower.pop();
    const hull = lower.concat(upper);
    if (hull.length > 0) {
      hull.push(hull[0]); // Fermer le polygone
    }
    
    return {
      type: 'Feature',
      properties: { name: `Zone Tampon (${radiusKm} km)` },
      geometry: {
        type: 'Polygon',
        coordinates: [hull]
      }
    };
  }
  
  throw new Error(`Type de géométrie non supporté pour le calcul de buffer : ${geometry.type}`);
}

function crossProduct(o: [number, number], a: [number, number], b: [number, number]): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}
