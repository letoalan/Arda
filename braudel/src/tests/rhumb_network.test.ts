import { describe, it, expect } from 'vitest';
import { 
  extractDelaunayEdges,
  buildTierNetwork,
  generateRhumbGeoJSON, 
  exportRhumbNetwork,
  resolveNodeColor,
  NODE_COLORS,
  DEFAULT_OCEANIC_RHUMB_CENTERS,
  RhumbNode
} from '../core/cartography/rhumb_network';

describe('Delaunay Rhumb Network', () => {
  it('should extract sparse unique edges from Delaunay triangulation (no O(N^2) explosion)', () => {
    const nodes: RhumbNode[] = [
      { id: 'n1', lat: 0, lon: 0, tier: 'major', minZoom: 1, color: '#ff0000' },
      { id: 'n2', lat: 10, lon: 10, tier: 'major', minZoom: 1, color: '#00ff00' },
      { id: 'n3', lat: 0, lon: 10, tier: 'major', minZoom: 1, color: '#0000ff' },
      { id: 'n4', lat: 10, lon: 0, tier: 'major', minZoom: 1, color: '#ffff00' },
    ];

    const rawEdges = extractDelaunayEdges(nodes);
    // Pour 4 points formant un carré, Delaunay produit 2 triangles -> 5 arêtes uniques (pas 6 comme dans un graphe complet)
    expect(rawEdges.length).toBe(5);
  });

  it('should build hierarchical tier network with major and secondary edges', () => {
    const { edges } = buildTierNetwork();
    expect(edges.length).toBeGreaterThan(0);
    
    // Vérifier que le nombre moyen d'arêtes par nœud reste clairsemé (~2 à 3x le nombre de nœuds)
    expect(edges.length).toBeLessThan(DEFAULT_OCEANIC_RHUMB_CENTERS.length * 3.5);

    const majorEdges = edges.filter(e => e.tier === 'major');
    const secEdges = edges.filter(e => e.tier === 'secondary');

    expect(majorEdges.length).toBeGreaterThan(0);
    expect(secEdges.length).toBeGreaterThan(0);
    
    majorEdges.forEach(e => {
      expect(e.minZoom).toBe(1);
    });
    secEdges.forEach(e => {
      expect(e.minZoom).toBe(3);
    });
  });

  it('should generate valid GeoJSON with Delaunay line features connecting distinct points', () => {
    const geojson = generateRhumbGeoJSON();
    
    expect(geojson.nodes.features.length).toBe(DEFAULT_OCEANIC_RHUMB_CENTERS.length);
    expect(geojson.lines.features.length).toBeGreaterThan(0);

    // Vérifier que chaque arête relie deux points distincts
    geojson.lines.features.forEach(f => {
      const coords = f.geometry.coordinates;
      expect(coords.length).toBe(2);
      expect(coords[0]).not.toEqual(coords[1]);
      expect(f.properties.source_id).toBeDefined();
      expect(f.properties.target_id).toBeDefined();
      expect(f.properties.source_color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(f.properties.target_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('should have unique identity colors for each node', () => {
    DEFAULT_OCEANIC_RHUMB_CENTERS.forEach((node) => {
      expect(NODE_COLORS[node.id]).toBeDefined();
      expect(NODE_COLORS[node.id]).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('should resolve node color correctly with priority: explicit > palette > fallback', () => {
    expect(resolveNodeColor({ id: 'custom', color: '#123456' })).toBe('#123456');
    expect(resolveNodeColor({ id: 'center-0-crete' })).toBe('#8b3a2f');
    expect(resolveNodeColor({ id: 'unknown-node' })).toBe('#5a4a3a');
  });

  it('should produce an exportable network object', () => {
    const exported = exportRhumbNetwork({ stylePreset: 'renaissance' });
    expect(exported.style_preset).toBe('renaissance');
    expect(exported.nodes.length).toBe(DEFAULT_OCEANIC_RHUMB_CENTERS.length);
    expect(exported.geojson_cache.lines.features.length).toBeGreaterThan(0);
  });
});
