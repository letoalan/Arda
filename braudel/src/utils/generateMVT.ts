import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import { FeatureCollection } from 'geojson';

export function generateMVTFromGeoJSON(
  geojson: FeatureCollection,
  maxZoom: number
): Map<number, Map<string, ArrayBuffer>> {
  // 1. Initialiser l'index geojson-vt
  const tileIndex = geojsonvt(geojson, {
    maxZoom: maxZoom,
    indexMaxZoom: maxZoom,
    indexMaxPoints: 0, // Ne pas regrouper
    tolerance: 3,
  });

  const mvtMap = new Map<number, Map<string, ArrayBuffer>>();

  // 2. Récupérer toutes les coordonnées de tuiles qui contiennent des données
  // @ts-ignore : Les types de geojson-vt ne documentent pas toujours tileCoords, mais il existe.
  const tileCoords = tileIndex.tileCoords as { z: number; x: number; y: number }[];

  if (!tileCoords) {
    console.warn("tileCoords non disponible sur l'index geojson-vt. La génération MVT a échoué.");
    return mvtMap;
  }

  // 3. Générer le buffer MVT pour chaque tuile et le stocker
  for (const { z, x, y } of tileCoords) {
    const tile = tileIndex.getTile(z, x, y);
    if (!tile) continue;

    // Création du buffer PBF
    // vtpbf prend un objet associant le nom du layer à l'objet tuile
    const buffer = vtpbf.fromGeojsonVt({ 'continents': tile as any });

    // Stockage dans notre structure imbriquée
    if (!mvtMap.has(z)) {
      mvtMap.set(z, new Map<string, ArrayBuffer>());
    }
    
    // Convertir Uint8Array (ou Buffer) en ArrayBuffer pur
    let arrayBuffer: ArrayBuffer;
    if (buffer.buffer instanceof ArrayBuffer && buffer.byteLength === buffer.buffer.byteLength) {
      arrayBuffer = buffer.buffer;
    } else {
      const u8 = new Uint8Array(buffer.buffer as unknown as ArrayBuffer, buffer.byteOffset, buffer.byteLength);
      const copy = new Uint8Array(u8.byteLength);
      copy.set(u8);
      arrayBuffer = copy.buffer;
    }

    mvtMap.get(z)!.set(`${x}_${y}`, arrayBuffer);
  }

  return mvtMap;
}
