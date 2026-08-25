// core/cartography/rhumb_network.ts

import Delaunator from 'delaunator';

export type RhumbCenterTier = 'major' | 'secondary';

export interface RhumbNode {
  id: string;
  name?: string;
  lat: number;
  lon: number;
  tier: RhumbCenterTier;
  minZoom: number;
  color: string;
  hasRose?: boolean;
}

export type RhumbStylePreset = 'medieval' | 'renaissance' | 'custom';

export interface RhumbColorPalette {
  roseCenter: string;
  roseBorder: string;
  defaultEdge: string;
}

export interface RhumbStrokeStyle {
  width: number;
  opacity: number;
}

export const RHUMB_STROKE_STYLES = {
  major: { width: 1.2, opacity: 0.55 },
  secondary: { width: 0.7, opacity: 0.35 },
  principal: { width: 1.1, opacity: 0.55 },
  demi: { width: 0.55, opacity: 0.35 },
  quart: { width: 0.35, opacity: 0.22 },
};

export interface RhumbNetworkConfig {
  nodes?: RhumbNode[];
  stylePreset?: RhumbStylePreset;
  customPalette?: Partial<RhumbColorPalette>;
}

export interface RhumbEdgeProperties {
  edge_id: string;
  source_id: string;
  target_id: string;
  source_color: string;
  target_color: string;
  edge_tier: RhumbCenterTier;
  min_zoom: number;
}

export interface RhumbNodeProperties {
  node_type: 'center' | 'rose';
  center_id: string;
  center_tier: RhumbCenterTier;
  center_color: string;
  min_zoom: number;
  name?: string;
  hasRose: boolean;
}

export interface RhumbGeoJSON {
  lines: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: RhumbEdgeProperties;
      geometry: {
        type: 'LineString';
        coordinates: [number, number][];
      };
    }>;
  };
  nodes: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: RhumbNodeProperties;
      geometry: {
        type: 'Point';
        coordinates: [number, number];
      };
    }>;
  };
}

export interface ExportableRhumbNetwork {
  nodes: RhumbNode[];
  style_preset: RhumbStylePreset;
  geojson_cache: RhumbGeoJSON;
}

// ---------------------------------------------------------------------------
// Palettes historiques
// ---------------------------------------------------------------------------

export const RHUMB_PALETTES: Record<RhumbStylePreset, RhumbColorPalette> = {
  medieval: {
    roseCenter: '#5c2a1a',
    roseBorder: '#b8960b',
    defaultEdge: '#2a2118',
  },
  renaissance: {
    roseCenter: '#6b4e1e',
    roseBorder: '#d4c8a0',
    defaultEdge: '#3a2f1e',
  },
  custom: {
    roseCenter: '#6b4e1e',
    roseBorder: '#d4c8a0',
    defaultEdge: '#2a2118',
  },
};

// ---------------------------------------------------------------------------
// Nœuds portulans historiques (25 centres)
// ---------------------------------------------------------------------------

export const CRETE_ORIGIN: RhumbNode = {
  id: 'center-0-crete',
  name: 'Crète (Nœud 0 Central)',
  lat: 35.2,
  lon: 24.8,
  tier: 'major',
  minZoom: 1,
  color: '#8b3a2f', // Terre de Sienne
  hasRose: true,
};

/**
 * Génère les 25 nœuds historiques du maillage portulan :
 * - Tier 'major' (9 centres) : Crète (nœud 0) + 8 carrefours planétaires mondiaux
 * - Tier 'secondary' (16 centres) : relais régionaux marchands et détroits
 */
export function generateDefaultNodes(): RhumbNode[] {
  return [
    // ── Tier Major (Zoom ≥ 1) ──
    CRETE_ORIGIN,
    { id: 'center-major-azores', name: 'Açores (Atlantique Nord-Est)', lat: 38.5, lon: -28.0, tier: 'major', minZoom: 1, color: '#2f5b8b', hasRose: true },
    { id: 'center-major-greenland', name: 'Sud du Groenland (Cap Farewell)', lat: 59.77, lon: -43.90, tier: 'major', minZoom: 1, color: '#3b7a8a', hasRose: true },
    { id: 'center-major-caribbean', name: 'Caraïbes (Antilles)', lat: 16.0, lon: -75.0, tier: 'major', minZoom: 1, color: '#2f6b8b', hasRose: true },
    { id: 'center-major-magellan', name: 'Détroit de Magellan', lat: -53.5, lon: -70.9, tier: 'major', minZoom: 1, color: '#4a5a6a', hasRose: true },
    { id: 'center-major-cape-hope', name: 'Cap de Bonne-Espérance', lat: -34.35, lon: 18.47, tier: 'major', minZoom: 1, color: '#8b6f2f', hasRose: true },
    { id: 'center-major-bombay', name: 'Bombay (Côte de Malabar)', lat: 18.92, lon: 72.83, tier: 'major', minZoom: 1, color: '#c06030', hasRose: true },
    { id: 'center-major-mascarene', name: 'Mascareignes (Océan Indien Sud)', lat: -22.0, lon: 75.0, tier: 'major', minZoom: 1, color: '#3f6b7a', hasRose: true },
    { id: 'center-major-malacca', name: 'Détroit de Malacca', lat: 2.19, lon: 102.25, tier: 'major', minZoom: 1, color: '#7a5a2f', hasRose: true },
    { id: 'center-major-macao', name: 'Macao / Rivière des Perles', lat: 22.19, lon: 113.54, tier: 'major', minZoom: 1, color: '#9a3a3a', hasRose: true },

    // ── Tier Secondary (Zoom ≥ 3) ──
    { id: 'center-sec-med-west', name: 'Méditerranée Occidentale', lat: 39.5, lon: 4.5, tier: 'secondary', minZoom: 3, color: '#8b4a3f', hasRose: false },
    { id: 'center-sec-caffa', name: 'Caffa / Théodosie (Mer Noire)', lat: 45.03, lon: 35.38, tier: 'secondary', minZoom: 3, color: '#9b5a45', hasRose: false },
    { id: 'center-sec-anvers', name: 'Anvers (Mer du Nord)', lat: 51.22, lon: 4.40, tier: 'secondary', minZoom: 3, color: '#5b6e4e', hasRose: false },
    { id: 'center-sec-lubeck', name: 'Lübeck (Baltique)', lat: 53.87, lon: 10.69, tier: 'secondary', minZoom: 3, color: '#4a6e5a', hasRose: false },
    { id: 'center-sec-saint-petersburg', name: 'Saint-Pétersbourg (Golfe de Finlande)', lat: 59.93, lon: 30.33, tier: 'secondary', minZoom: 3, color: '#4a5e78', hasRose: false },
    { id: 'center-sec-norway', name: 'Norvège (Bergen / Mer de Norvège)', lat: 60.39, lon: 5.32, tier: 'secondary', minZoom: 3, color: '#3d6b70', hasRose: false },
    { id: 'center-sec-faroe', name: 'Îles Féroé (Atlantique Nord)', lat: 62.01, lon: -6.77, tier: 'secondary', minZoom: 3, color: '#4c6c8c', hasRose: false },
    { id: 'center-sec-iceland', name: 'Islande (Reykjavík)', lat: 64.14, lon: -21.94, tier: 'secondary', minZoom: 3, color: '#457a8a', hasRose: false },
    { id: 'center-sec-newfoundland', name: 'Terre-Neuve (Grands Bancs)', lat: 47.56, lon: -52.71, tier: 'secondary', minZoom: 3, color: '#527282', hasRose: false },
    { id: 'center-sec-bermuda', name: 'Bermudes', lat: 32.3, lon: -64.7, tier: 'secondary', minZoom: 3, color: '#3a7ca5', hasRose: false },
    { id: 'center-sec-mexico', name: 'Mexico / Veracruz', lat: 19.43, lon: -99.13, tier: 'secondary', minZoom: 3, color: '#a07830', hasRose: false },
    { id: 'center-sec-lima', name: 'Lima / Callao', lat: -12.04, lon: -77.04, tier: 'secondary', minZoom: 3, color: '#7a4a3f', hasRose: false },
    { id: 'center-sec-atl-equator', name: 'Atlantique Équatorial', lat: 0.0, lon: -25.0, tier: 'secondary', minZoom: 3, color: '#4a6a7a', hasRose: false },
    { id: 'center-sec-tristan', name: 'Tristan da Cunha', lat: -32.0, lon: -15.0, tier: 'secondary', minZoom: 3, color: '#5a4a7a', hasRose: false },
    { id: 'center-sec-zanzibar', name: 'Zanzibar (Côte Swahili)', lat: -6.16, lon: 39.20, tier: 'secondary', minZoom: 3, color: '#7a5a3a', hasRose: false },
    { id: 'center-sec-jeddah', name: 'Djeddah (Mer Rouge / Hedjaz)', lat: 21.48, lon: 39.19, tier: 'secondary', minZoom: 3, color: '#9a6b38', hasRose: false },
    { id: 'center-sec-mascat', name: 'Mascate (Golfe d\'Oman)', lat: 23.59, lon: 58.44, tier: 'secondary', minZoom: 3, color: '#8a6e30', hasRose: false },
    { id: 'center-sec-surat', name: 'Surate (Gujarat)', lat: 21.17, lon: 72.83, tier: 'secondary', minZoom: 3, color: '#b8602a', hasRose: false },
    { id: 'center-sec-arabia', name: 'Mer d\'Arabie', lat: 14.0, lon: 63.0, tier: 'secondary', minZoom: 3, color: '#6b7a3f', hasRose: false },
    { id: 'center-sec-sumatra', name: 'Sumatra', lat: -5.0, lon: 95.0, tier: 'secondary', minZoom: 3, color: '#4a7c3f', hasRose: false },
    { id: 'center-sec-manila', name: 'Manille (Philippines)', lat: 14.59, lon: 120.98, tier: 'secondary', minZoom: 3, color: '#8b5a3f', hasRose: false },
    { id: 'center-sec-tsushima', name: 'Détroit de Tsushima', lat: 34.42, lon: 129.33, tier: 'secondary', minZoom: 3, color: '#5a6a8b', hasRose: false },
    { id: 'center-sec-mariana', name: 'Mariannes', lat: 20.0, lon: 145.0, tier: 'secondary', minZoom: 3, color: '#3a5a4a', hasRose: false },
    { id: 'center-sec-hawaii', name: 'Hawaï', lat: 21.3, lon: -157.8, tier: 'secondary', minZoom: 3, color: '#2f5a7a', hasRose: false },
    { id: 'center-sec-tahiti', name: 'Tahiti / Polynésie', lat: -17.6, lon: -149.4, tier: 'secondary', minZoom: 3, color: '#4a7a6a', hasRose: false },
    { id: 'center-sec-argentine', name: 'Argentine Off', lat: -42.0, lon: -52.0, tier: 'secondary', minZoom: 3, color: '#6a6a5a', hasRose: false },
  ];
}

export const DEFAULT_OCEANIC_RHUMB_CENTERS: RhumbNode[] = generateDefaultNodes();

export const NODE_COLORS: Record<string, string> = DEFAULT_OCEANIC_RHUMB_CENTERS.reduce((acc, c) => {
  acc[c.id] = c.color;
  return acc;
}, {} as Record<string, string>);

export function resolveNodeColor(center: Partial<RhumbNode> & { id: string }): string {
  return center.color || NODE_COLORS[center.id] || '#5a4a3a';
}

// ---------------------------------------------------------------------------
// Triangulation de Delaunay & Extraction des Arêtes Uniques
// ---------------------------------------------------------------------------

export interface RawEdge {
  sourceIndex: number;
  targetIndex: number;
}

/**
 * Effectue la triangulation de Delaunay sur un ensemble de points [lon, lat]
 * et extrait strictement les arêtes uniques des triangles.
 * Complexité : O(n log n).
 * Topologie : ~2 à 3 arêtes par nœud (réseau planaire clairsemé).
 */
export function extractDelaunayEdges(nodes: RhumbNode[]): RawEdge[] {
  if (nodes.length < 3) return [];

  // Convertir en tableau plat de coordonnées [x0, y0, x1, y1, ...]
  const coords: number[] = new Array(nodes.length * 2);
  for (let i = 0; i < nodes.length; i++) {
    coords[i * 2] = nodes[i].lon;
    coords[i * 2 + 1] = nodes[i].lat;
  }

  const delaunay = new Delaunator(coords);
  const edgeSet = new Set<string>();
  const rawEdges: RawEdge[] = [];

  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const key = `${min}-${max}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      rawEdges.push({ sourceIndex: min, targetIndex: max });
    }
  };

  for (let i = 0; i < delaunay.triangles.length; i += 3) {
    const a = delaunay.triangles[i];
    const b = delaunay.triangles[i + 1];
    const c = delaunay.triangles[i + 2];
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }

  return rawEdges;
}

/**
 * Construit le réseau maillé hiérarchisé par niveau de détail (LOD) :
 * 1. Triangulation des centres 'major' seuls (vue monde, zoom ≥ 1)
 * 2. Triangulation de l'ensemble complet 'major + secondary' (zoom régional ≥ 3)
 */
export function buildTierNetwork(nodes: RhumbNode[] = DEFAULT_OCEANIC_RHUMB_CENTERS): {
  edges: Array<{
    source: RhumbNode;
    target: RhumbNode;
    tier: RhumbCenterTier;
    minZoom: number;
  }>;
} {
  const edgeMap = new Map<string, {
    source: RhumbNode;
    target: RhumbNode;
    tier: RhumbCenterTier;
    minZoom: number;
  }>();

  // Étape 1 : Triangulation des majeurs seuls (visibles dès zoom 1)
  const majorNodes = nodes.filter((n) => n.tier === 'major');
  const majorRawEdges = extractDelaunayEdges(majorNodes);
  majorRawEdges.forEach(({ sourceIndex, targetIndex }) => {
    const src = majorNodes[sourceIndex];
    const tgt = majorNodes[targetIndex];
    const key = [src.id, tgt.id].sort().join('--');
    edgeMap.set(key, {
      source: src,
      target: tgt,
      tier: 'major',
      minZoom: 1,
    });
  });

  // Étape 2 : Triangulation complète de tous les nœuds
  const allRawEdges = extractDelaunayEdges(nodes);
  allRawEdges.forEach(({ sourceIndex, targetIndex }) => {
    const src = nodes[sourceIndex];
    const tgt = nodes[targetIndex];
    const key = [src.id, tgt.id].sort().join('--');
    if (!edgeMap.has(key)) {
      // Arête introduite par les nœuds secondaires → révélée à zoom ≥ 3
      const isBothMajor = src.tier === 'major' && tgt.tier === 'major';
      const minZoom = isBothMajor ? 1 : 3;
      const tier: RhumbCenterTier = isBothMajor ? 'major' : 'secondary';
      edgeMap.set(key, {
        source: src,
        target: tgt,
        tier,
        minZoom,
      });
    }
  });

  return { edges: Array.from(edgeMap.values()) };
}

// ---------------------------------------------------------------------------
// Génération GeoJSON
// ---------------------------------------------------------------------------

export function generateRhumbGeoJSON(config?: Partial<RhumbNetworkConfig>): RhumbGeoJSON {
  const nodes = config?.nodes && config.nodes.length > 0 ? config.nodes : DEFAULT_OCEANIC_RHUMB_CENTERS;
  const { edges } = buildTierNetwork(nodes);

  const lineFeatures: RhumbGeoJSON['lines']['features'] = [];
  const nodeFeatures: RhumbGeoJSON['nodes']['features'] = [];

  // 1. Points nodaux
  nodes.forEach((node) => {
    nodeFeatures.push({
      type: 'Feature',
      properties: {
        node_type: node.hasRose ? 'rose' : 'center',
        center_id: node.id,
        center_tier: node.tier,
        center_color: resolveNodeColor(node),
        min_zoom: node.minZoom,
        name: node.name,
        hasRose: Boolean(node.hasRose),
      },
      geometry: {
        type: 'Point',
        coordinates: [node.lon, node.lat],
      },
    });
  });

  // 2. Arêtes de Delaunay (avec propriétés des deux nœuds pour le style et LOD)
  edges.forEach((edge) => {
    const edgeId = `${edge.source.id}__${edge.target.id}`;
    lineFeatures.push({
      type: 'Feature',
      properties: {
        edge_id: edgeId,
        source_id: edge.source.id,
        target_id: edge.target.id,
        source_color: resolveNodeColor(edge.source),
        target_color: resolveNodeColor(edge.target),
        edge_tier: edge.tier,
        min_zoom: edge.minZoom,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [edge.source.lon, edge.source.lat],
          [edge.target.lon, edge.target.lat],
        ],
      },
    });
  });

  return {
    lines: {
      type: 'FeatureCollection',
      features: lineFeatures,
    },
    nodes: {
      type: 'FeatureCollection',
      features: nodeFeatures,
    },
  };
}

export function exportRhumbNetwork(config?: Partial<RhumbNetworkConfig>): ExportableRhumbNetwork {
  const nodes = config?.nodes || DEFAULT_OCEANIC_RHUMB_CENTERS;
  const preset = config?.stylePreset || 'renaissance';

  return {
    nodes,
    style_preset: preset,
    geojson_cache: generateRhumbGeoJSON({ nodes, stylePreset: preset, customPalette: config?.customPalette }),
  };
}
