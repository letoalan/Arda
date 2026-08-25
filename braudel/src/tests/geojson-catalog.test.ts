import { describe, it, expect } from 'vitest';
import { getCatalogEntries, searchCatalogEntries } from '../services/import/geojson-catalog-service';

describe('GeoJSON Catalog Suite', () => {
  it('fournit l\'intégralité du registre unifié', () => {
    const all = getCatalogEntries();
    expect(all.length).toBeGreaterThanOrEqual(8);
  });

  it('filtre correctement les entrées par famille (historique, contemporain, administratif, maritime)', () => {
    const historical = getCatalogEntries('historical');
    const maritime = getCatalogEntries('maritime');

    expect(historical.every(e => e.family === 'historical')).toBe(true);
    expect(maritime.every(e => e.family === 'maritime')).toBe(true);
    expect(maritime.length).toBeGreaterThan(0);
  });

  it('recherche les entrées par mot-clé', () => {
    const results = searchCatalogEntries('Rome');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toContain('Romain');
  });
});
