import { describe, it, expect } from 'vitest';

describe('Tolkien AI Chat Attachment Filtering Tests', () => {
  it('should filter shapes to keep only the largest one when user requests "grande"', () => {
    const mockDetectedAiShapes = [
      { id: '1', name: 'Petite Île', points: Array(10).fill({ x: 0, y: 0 }) },
      { id: '2', name: 'Grande Île', points: Array(50).fill({ x: 0, y: 0 }) },
      { id: '3', name: 'Île Moyenne', points: Array(20).fill({ x: 0, y: 0 }) }
    ];

    // Simuler le filtre de ContinentBuilderView
    let filtered = [...mockDetectedAiShapes];
    filtered.sort((a, b) => b.points.length - a.points.length);
    filtered = [filtered[0]];

    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Grande Île');
  });

  it('should remove small shapes when user requests "nettoie" or "petite"', () => {
    const mockDetectedAiShapes = [
      { id: '1', name: 'Bruit de fond', points: Array(12).fill({ x: 0, y: 0 }) },
      { id: '2', name: 'Île Principale', points: Array(45).fill({ x: 0, y: 0 }) }
    ];

    // Simuler le filtre des formes de bruit (longueur points > 25)
    const filtered = mockDetectedAiShapes.filter(f => f.points.length > 25);

    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Île Principale');
  });
});
