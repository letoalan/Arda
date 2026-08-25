import { GeojsonCatalogEntry, GeojsonFamily } from '../../core/schema/geojson-catalog';

/**
 * Registre unifié des fonds GeoJSON historiques, contemporains, administratifs et maritimes.
 * Toutes les entrées sont reliées à des fichiers réels locaux (/data/*.geojson) ou distants (OpenData GitHub).
 */
export const GEOJSON_CATALOG_REGISTRY: GeojsonCatalogEntry[] = [
  // ─── 1. FAMILLE HISTORIQUE ───
  {
    id: 'hist-world-3000bc',
    label: 'Monde antique (-3000 av. J.-C.)',
    url: '/data/6-world_bc3000.geojson',
    family: 'historical',
    geographicScope: 'world',
    temporalRange: [-3000, -2000],
    referenceYear: -3000,
    geometryKind: 'polygon',
    source: 'Géopolitica / Braudel Core',
    license: 'CC-BY-SA 4.0',
    precision: 'standard',
    recommendedUse: 'narrative',
    sizeBytes: 3530339
  },
  {
    id: 'hist-rome-117ad',
    label: 'Monde antique & Empire Romain (100 ap. J.-C.)',
    url: '/data/18-world_100.geojson',
    family: 'historical',
    geographicScope: 'continent',
    temporalRange: [1, 300],
    referenceYear: 100,
    geometryKind: 'polygon',
    source: 'Géopolitica / Braudel Core',
    license: 'CC-BY 3.0',
    precision: 'detailed',
    recommendedUse: 'analysis',
    sizeBytes: 5275747
  },
  {
    id: 'hist-world-1800',
    label: 'Monde à l\'Aube du XIXe Siècle (1800)',
    url: '/data/39-world_1800.geojson',
    family: 'historical',
    geographicScope: 'world',
    temporalRange: [1780, 1814],
    referenceYear: 1800,
    geometryKind: 'polygon',
    source: 'Géopolitica / Braudel Core',
    license: 'Open Data',
    precision: 'standard',
    recommendedUse: 'narrative',
    sizeBytes: 7650510
  },
  {
    id: 'hist-europe-1815',
    label: 'Europe du Congrès de Vienne (1815)',
    url: '/data/40-world_1815.geojson',
    family: 'historical',
    geographicScope: 'continent',
    temporalRange: [1815, 1848],
    referenceYear: 1815,
    geometryKind: 'polygon',
    source: 'Géopolitica / Braudel Core',
    license: 'Open Data',
    precision: 'detailed',
    recommendedUse: 'pedagogy',
    sizeBytes: 10909745
  },

  // ─── 2. FAMILLE CONTEMPORAINE ───
  {
    id: 'cont-world-2024',
    label: 'Frontières Internationales Contemporaines (2024)',
    url: '/data/49-world_2024.geojson',
    family: 'contemporary',
    geographicScope: 'world',
    temporalRange: [2000, 2030],
    referenceYear: 2024,
    geometryKind: 'polygon',
    source: 'Géopolitica / Natural Earth',
    license: 'Public Domain',
    precision: 'standard',
    recommendedUse: 'analysis',
    sizeBytes: 92075718
  },

  // ─── 3. FAMILLE ADMINISTRATIVE / SUBDIVISIONS ───
  {
    id: 'admin-fr-regions',
    label: 'Régions & Départements de France',
    url: 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson',
    family: 'administrative',
    geographicScope: 'country',
    referenceYear: 2024,
    geometryKind: 'polygon',
    source: 'INSEE / France GeoJSON (Etalab)',
    license: 'LO 2.0',
    precision: 'detailed',
    recommendedUse: 'analysis',
    sizeBytes: 1200000
  },
  {
    id: 'admin-us-states',
    label: 'États Fédérés des États-Unis',
    url: 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json',
    family: 'administrative',
    geographicScope: 'country',
    referenceYear: 2024,
    geometryKind: 'polygon',
    source: 'US Census Bureau / PublicaMundi',
    license: 'Public Domain',
    precision: 'standard',
    recommendedUse: 'pedagogy',
    sizeBytes: 450000
  },

  // ─── 4. FAMILLE MARITIME & ESPACES STRATÉGIQUES ───
  {
    id: 'mar-eez-world',
    label: 'Zones Économiques Exclusives (ZEE)',
    url: '/data/50-zee.geojson',
    family: 'maritime',
    geographicScope: 'world',
    referenceYear: 2024,
    geometryKind: 'polygon',
    source: 'VLIZ Marine Regions / Braudel',
    license: 'CC-BY 4.0',
    precision: 'standard',
    recommendedUse: 'analysis',
    sizeBytes: 23278626
  }
];

export function getCatalogEntries(family?: GeojsonFamily): GeojsonCatalogEntry[] {
  if (!family) return GEOJSON_CATALOG_REGISTRY;
  return GEOJSON_CATALOG_REGISTRY.filter(entry => entry.family === family);
}

export function searchCatalogEntries(query: string): GeojsonCatalogEntry[] {
  const q = query.toLowerCase();
  return GEOJSON_CATALOG_REGISTRY.filter(entry => 
    entry.label.toLowerCase().includes(q) || 
    entry.id.toLowerCase().includes(q) ||
    entry.source.toLowerCase().includes(q)
  );
}
