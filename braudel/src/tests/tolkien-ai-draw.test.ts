import { describe, it, expect } from 'vitest';

// Simuler l'algorithme de projection inverse implémenté dans ContinentBuilderView
const geoToPixels = (coords: any, type: string): { x: number; y: number }[] => {
  const width = 1024;
  const height = 512;
  
  const projectPoint = (pt: [number, number]): { x: number; y: number } => {
    const [lon, lat] = pt;
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  if (type === 'Point') {
    return [projectPoint(coords as [number, number])];
  } else if (type === 'LineString') {
    return (coords as [number, number][]).map(projectPoint);
  } else if (type === 'Polygon') {
    return (coords[0] as [number, number][]).map(projectPoint);
  }
  return [];
};

describe('Tolkien AI Drawing Projection Tests', () => {
  it('should correctly project center geographical coordinate to center pixel coordinate', () => {
    const geoCenter: [number, number] = [0, 0];
    const pixels = geoToPixels(geoCenter, 'Point');
    
    expect(pixels.length).toBe(1);
    expect(pixels[0].x).toBe(512); // Milieu de 1024
    expect(pixels[0].y).toBe(256); // Milieu de 512
  });

  it('should project bounds correctly', () => {
    const geoMax: [number, number] = [180, 90];
    const pixels = geoToPixels(geoMax, 'Point');
    
    expect(pixels[0].x).toBe(1024);
    expect(pixels[0].y).toBe(0);
  });
});
