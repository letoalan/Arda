// services/import/geojson-catalog-service.ts

import { GeojsonCatalogEntry, GeojsonFamily } from '../../core/schema/geojson-catalog';
import { GEOPOLITICA_SOURCES } from './geopoliticaRegistry';

/**
 * Registre unifié des fonds GeoJSON historiques, contemporains, administratifs et maritimes.
 * Toutes les entrées sont reliées à des fichiers réels locaux (/data/*.geojson) ou distants (OpenData).
 */
const baseUrl = import.meta.env?.BASE_URL || '/';
const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

const HISTORICAL_LABELS: Record<number, string> = {
  [-123000]: "Monde préhistorique (-123 000 av. J.-C. - Paléolithique)",
  [-10000]: "Monde au Mésolithique (-10 000 av. J.-C.)",
  [-8000]: "Monde au Néolithique Ancien (-8 000 av. J.-C.)",
  [-5000]: "Monde au Néolithique Moyen (-5 000 av. J.-C.)",
  [-4000]: "Monde proto-urbain (-4 000 av. J.-C. - Premières cités)",
  [-3000]: "Monde antique (-3000 av. J.-C. - Premières civilisations)",
  [-2000]: "Monde antique à l'Âge du Bronze (-2000 av. J.-C.)",
  [-1500]: "Méditerranée et Moyen-Orient antique (-1500 av. J.-C.)",
  [-1000]: "Monde antique à l'Âge du Fer (-1000 av. J.-C.)",
  [-700]: "Monde antique (-700 av. J.-C. - Époque archaïque)",
  [-500]: "Monde classique (-500 av. J.-C. - Guerres médiques & Grèce)",
  [-400]: "Monde classique (-400 av. J.-C.)",
  [-323]: "Empire d'Alexandre le Grand (-323 av. J.-C. - Époque hellénistique)",
  [-300]: "Monde hellénistique (-300 av. J.-C.)",
  [-200]: "Monde méditerranéen & Dynastie Han (-200 av. J.-C.)",
  [-100]: "République Romaine tardive (-100 av. J.-C.)",
  [-1]: "Monde au tournant de notre ère (An 1 av. J.-C.)",
  [100]: "Monde antique & Empire Romain (100 ap. J.-C. - Apogée de Rome)",
  [200]: "Monde romain sous les Sévères (200 ap. J.-C.)",
  [300]: "Monde sous la Tétrarchie romaine (300 ap. J.-C.)",
  [400]: "Empire Romain d'Occident et d'Orient (400 ap. J.-C.)",
  [600]: "Monde byzantin & Émergence de l'Islam (600 ap. J.-C.)",
  [700]: "Califats islamiques & Royaumes barbares (700 ap. J.-C.)",
  [800]: "Empire Carolingien & Califat Abbasside (800 ap. J.-C. - Charlemagne)",
  [900]: "Monde au Xe siècle (900 ap. J.-C. - Âge des Vikings)",
  [1100]: "Monde au temps des Croisades (1100 ap. J.-C.)",
  [1200]: "Monde médiéval à l'aube des Mongols (1200 ap. J.-C.)",
  [1279]: "Apogée de l'Empire Mongol & Dynastie Yuan (1279 ap. J.-C.)",
  [1300]: "Monde au XIVe siècle (1300 ap. J.-C.)",
  [1400]: "Monde à la fin du Moyen Âge (1400 ap. J.-C. - Empires d'Asie & Europe)",
  [1492]: "Monde à l'Âge des Grandes Découvertes (1492 ap. J.-C. - Amérique)",
  [1500]: "Monde à la Renaissance (1500 ap. J.-C.)",
  [1530]: "Monde sous Charles Quint & Soliman le Magnifique (1530)",
  [1600]: "Monde au début du XVIIe siècle (1600)",
  [1650]: "Monde après les Traités de Westphalie (1650)",
  [1700]: "Monde au Siècle des Lumières (1700)",
  [1715]: "Monde après la mort de Louis XIV (1715)",
  [1783]: "Monde au Traité de Paris & Indépendance des États-Unis (1783)",
  [1800]: "Monde à l'Aube du XIXe Siècle (1800 - Époque napoléonienne)",
  [1815]: "Europe du Congrès de Vienne & Monde en 1815",
  [1880]: "Monde à l'Époque Coloniale & Industrielle (1880)",
  [1900]: "Monde à la Belle Époque (1900)",
  [1914]: "Monde à la veille de la Première Guerre Mondiale (1914)",
  [1920]: "Monde au lendemain de la Grande Guerre (1920 - SDN)",
  [1938]: "Monde à la veille de la Seconde Guerre Mondiale (1938)",
  [1945]: "Monde au sortir de la Seconde Guerre Mondiale (1945 - ONU)",
  [1960]: "Monde pendant la Guerre Froide & Décolonisation (1960)",
  [1994]: "Monde post-Guerre Froide (1994)",
  [2024]: "Frontières Internationales Contemporaines (2024)",
};

// Construction dynamique de toutes les 49 entrées géopolitiques historiques avec bornes temporelles exactes
const sortedSources = [...GEOPOLITICA_SOURCES].sort((a, b) => a.referenceYear - b.referenceYear);

const geopoliticaEntries: GeojsonCatalogEntry[] = sortedSources.map((source, index) => {
  const isContemporary = source.referenceYear >= 1990;
  const enrichedLabel = HISTORICAL_LABELS[source.referenceYear] || source.label;
  
  // La plage temporelle s'étend précisément jusqu'à la période historique suivante (ou +50 ans si dernière)
  const nextSourceYear = index + 1 < sortedSources.length
    ? sortedSources[index + 1].referenceYear
    : source.referenceYear + 50;

  return {
    id: `geopolitica-${source.id}`,
    label: enrichedLabel,
    url: source.url,
    family: isContemporary ? 'contemporary' : 'historical',
    geographicScope: 'world',
    temporalRange: [source.referenceYear, nextSourceYear],
    referenceYear: source.referenceYear,
    geometryKind: 'polygon',
    source: 'Géopolitica Core',
    license: 'CC-BY-SA 4.0',
    precision: 'detailed',
    recommendedUse: 'analysis',
  };
});


// Registre complet unifié
export const GEOJSON_CATALOG_REGISTRY: GeojsonCatalogEntry[] = [
  ...geopoliticaEntries,

  // ─── FAMILLE ADMINISTRATIVE / SUBDIVISIONS ───
  {
    id: 'admin-fr-regions',
    label: 'Régions & Départements de France',
    url: 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson',
    family: 'administrative',
    geographicScope: 'country',
    referenceYear: 2024,
    temporalRange: [1950, 2030],
    geometryKind: 'polygon',
    source: 'INSEE / France GeoJSON (Etalab)',
    license: 'LO 2.0',
    precision: 'detailed',
    recommendedUse: 'analysis',
    sizeBytes: 1200000,
  },
  {
    id: 'admin-us-states',
    label: 'États Fédérés des États-Unis (USA)',
    url: 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json',
    family: 'administrative',
    geographicScope: 'country',
    referenceYear: 2024,
    temporalRange: [1776, 2030],
    geometryKind: 'polygon',
    source: 'US Census Bureau / PublicaMundi',
    license: 'Public Domain',
    precision: 'standard',
    recommendedUse: 'pedagogy',
    sizeBytes: 450000,
  },

  // ─── FAMILLE MARITIME & ESPACES STRATÉGIQUES ───
  {
    id: 'mar-eez-world',
    label: 'Zones Économiques Exclusives Mondiales (ZEE)',
    url: `${cleanBase}data/50-zee.geojson`,
    family: 'maritime',
    geographicScope: 'world',
    referenceYear: 2024,
    temporalRange: [1982, 2030],
    geometryKind: 'polygon',
    source: 'VLIZ Marine Regions / Braudel',
    license: 'CC-BY 4.0',
    precision: 'standard',
    recommendedUse: 'analysis',
    sizeBytes: 23278626,
  },
];

/**
 * Récupère les entrées du catalogue filtrées par famille et par requête textuelle.
 */
export function getCatalogEntries(family?: GeojsonFamily, query?: string): GeojsonCatalogEntry[] {
  let entries = GEOJSON_CATALOG_REGISTRY;

  if (family && family !== ('all' as any)) {
    entries = entries.filter((entry) => entry.family === family);
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    const isNumberQuery = !isNaN(Number(q));
    const queryNum = isNumberQuery ? parseInt(q, 10) : null;

    entries = entries.filter((entry) => {
      const yearStr = entry.referenceYear !== undefined ? String(entry.referenceYear) : '';
      const absYearStr = entry.referenceYear !== undefined ? String(Math.abs(entry.referenceYear)) : '';

      const matchText =
        entry.label.toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q) ||
        entry.source.toLowerCase().includes(q) ||
        entry.geographicScope.toLowerCase().includes(q) ||
        entry.family.toLowerCase().includes(q);

      const matchYear =
        yearStr === q ||
        absYearStr === q ||
        (queryNum !== null && entry.referenceYear === queryNum) ||
        (entry.temporalRange && queryNum !== null && queryNum >= entry.temporalRange[0] && queryNum <= entry.temporalRange[1]);

      return matchText || matchYear;
    });
  }

  return entries;
}


/**
 * Extrait les entités temporelles du catalogue avec bornage séquentiel strict pour le moteur de rupture temporelle.
 */
export function getCatalogTemporalEntities(): { id: string; temporalRange: [number, number] }[] {
  return sortedSources.map((source, index) => {
    const nextSourceYear =
      index + 1 < sortedSources.length
        ? sortedSources[index + 1].referenceYear
        : source.referenceYear + 50;
    return {
      id: source.id,
      temporalRange: [source.referenceYear, nextSourceYear] as [number, number],
    };
  });
}



/**
 * Recherche plein texte dans le catalogue GeoJSON.
 */
export function searchCatalogEntries(query: string, family?: GeojsonFamily): GeojsonCatalogEntry[] {
  return getCatalogEntries(family, query);
}
