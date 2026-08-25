// services/import/geopoliticaRegistry.ts

import { GeopoliticaSourceFile } from '../../core/schema/geopoliticaImport';

const rawFilenames = [
  "1-world_bc123000.geojson",
  "2-world_bc10000.geojson",
  "3-world_bc8000.geojson",
  "4-world_bc5000.geojson",
  "5-world_bc4000.geojson",
  "6-world_bc3000.geojson",
  "7-world_bc2000.geojson",
  "8-world_bc1500.geojson",
  "9-world_bc1000.geojson",
  "10-world_bc700.geojson",
  "11-world_bc500.geojson",
  "12-world_bc400.geojson",
  "13-world_bc323.geojson",
  "14-world_bc300.geojson",
  "15-world_bc200.geojson",
  "16-world_bc100.geojson",
  "17-world_bc1.geojson",
  "18-world_100.geojson",
  "19-world_200.geojson",
  "20-world_300.geojson",
  "21-world_400.geojson",
  "22-world_600.geojson",
  "23-world_700.geojson",
  "24-world_800.geojson",
  "25-world_900.geojson",
  "26-world_1100.geojson",
  "27-world_1200.geojson",
  "28-world_1279.geojson",
  "29-world_1300.geojson",
  "30-world_1400.geojson",
  "31-world_1492.geojson",
  "32-world_1500.geojson",
  "33-world_1530.geojson",
  "34-world_1600.geojson",
  "35-world_1650.geojson",
  "36-world_1700.geojson",
  "37-world_1715.geojson",
  "38-world_1783.geojson",
  "39-world_1800.geojson",
  "40-world_1815.geojson",
  "41-world_1880.geojson",
  "42-world_1900.geojson",
  "43-world_1914.geojson",
  "44-world_1920.geojson",
  "45-world_1938.geojson",
  "46-world_1945.geojson",
  "47-world_1960.geojson",
  "48-world_1994.geojson",
  "49-world_2024.geojson",
];

const baseUrl = import.meta.env?.BASE_URL || '/';
const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

export const GEOPOLITICA_SOURCES: GeopoliticaSourceFile[] = rawFilenames.map(filename => {
  const match = filename.match(/\d+-world_(bc)?(\d+)\.geojson/);
  if (!match) {
    return {
      id: filename,
      url: `${cleanBase}data/${filename}`,
      referenceYear: 0,
      label: filename
    };
  }

  const isBC = !!match[1];
  const yearValue = parseInt(match[2], 10);
  const referenceYear = isBC ? -yearValue : yearValue;
  const labelText = isBC ? `${yearValue} av. J.-C.` : `${yearValue} apr. J.-C.`;

  return {
    id: filename.replace('.geojson', ''),
    url: `${cleanBase}data/${filename}`,
    referenceYear,
    label: `Monde en l'an ${labelText}`
  };
});
