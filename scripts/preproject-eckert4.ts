// scripts/preproject-eckert4.ts
/**
 * Script de build Node.js (Phase 2 eckert.md)
 * Pré-projette les fichiers GeoJSON sources en coordonnées Eckert IV (fake Mercator)
 * pour consommation directe sans surcharge de calcul au runtime.
 *
 * Usage:
 *   npx.cmd tsx scripts/preproject-eckert4.ts <input.geojson> [output.geojson]
 */

import fs from 'fs';
import path from 'path';
import { initProj, buildTransformer, reprojectGeoJSON, shutdownTileWorkers } from 'backproj';

const ECKERT_IV_CRS = 'ESRI:54012';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/preproject-eckert4.ts <input.geojson> [output.geojson]');
    console.log('Exemple: npx tsx scripts/preproject-eckert4.ts public/data/18-world_100.geojson public/data/eckert4/18-world_100.geojson');
    process.exit(0);
  }

  const inputPath = path.resolve(process.cwd(), args[0]);
  if (!fs.existsSync(inputPath)) {
    console.error(`Fichier source introuvable: ${inputPath}`);
    process.exit(1);
  }

  let outputPath = args[1]
    ? path.resolve(process.cwd(), args[1])
    : inputPath.replace(/\.geojson$/i, '_eckert4.geojson');

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[Preproject Eckert IV] Lecture: ${inputPath}`);
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const sourceGeoJSON = JSON.parse(rawData);

  console.log(`[Preproject Eckert IV] Initialisation Wasm PROJ (CRS: ${ECKERT_IV_CRS})...`);
  await initProj();
  const transformer = await buildTransformer(ECKERT_IV_CRS);

  console.log(`[Preproject Eckert IV] Reprojection des géométries...`);
  const t0 = performance.now();
  const reprojected = await reprojectGeoJSON(sourceGeoJSON, transformer);
  const duration = Math.round(performance.now() - t0);

  fs.writeFileSync(outputPath, JSON.stringify(reprojected));
  console.log(`[Preproject Eckert IV] Enregistré avec succès dans ${outputPath} (${duration} ms)`);

  await shutdownTileWorkers();
  process.exit(0);
}

main().catch(err => {
  console.error('[Preproject Eckert IV] Erreur fatale:', err);
  process.exit(1);
});
