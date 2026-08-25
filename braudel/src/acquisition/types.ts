export type RawShapeInput = {
  points: { x: number; y: number }[];
  geometryKind: 'polygon' | 'line' | 'point';
  sourceMethod: 'click' | 'freehand' | 'image-trace' | 'auto-vectorized' | 'external-geojson';
  confidence?: number;
  featureKind?: string;
  name?: string;
};
