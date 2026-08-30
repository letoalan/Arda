import { describe, it, expect } from 'vitest';
import { parseArdaDocFromHtml, validateArdaDocSchema, migrateArdaDoc } from '../services/export/modules/arda-doc-parser';
import { generateStandaloneHtml } from '../services/export/standalone-template';
import { STYLE_CONFIGS } from '../core/styles.config';
import { CURRENT_ARDA_SCHEMA_VERSION } from '../services/export/modules/bento-types';

describe('ArdaDoc Parser, Validation & Migration Tests (Chantier 6)', () => {
  const mockEntities = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'athens',
        geometry: { type: 'Point', coordinates: [23.7, 37.9] },
        properties: { name: 'Athènes', validFrom: -500, validTo: -300 }
      }
    ]
  };

  const mockRelations = {
    type: 'FeatureCollection',
    features: []
  };

  it('devrait extraire et parser le document JSON d\'un HTML exporté', () => {
    const html = generateStandaloneHtml('Monde Grec', STYLE_CONFIGS[0], mockEntities, mockRelations);
    const parsedDoc = parseArdaDocFromHtml(html);

    expect(parsedDoc).toBeDefined();
    expect(parsedDoc.format).toBe('arda/map-story');
    expect(parsedDoc.title).toBe('Monde Grec');
    expect(parsedDoc.waypoints.length).toBeGreaterThan(0);
  });

  it('devrait valider un schéma conforme et rejeter un document corrompu', () => {
    const validDoc: any = {
      format: 'arda/map-story',
      title: 'Test',
      map: { styleUrl: 'https://example.com/style.json', styleId: 'default' },
      timeline: { start: 0, end: 1000, unit: 'year' },
      waypoints: [],
      slides: []
    };

    const validResult = validateArdaDocSchema(validDoc);
    expect(validResult.valid).toBe(true);

    const invalidDoc: any = { format: 'invalid/format' };
    const invalidResult = validateArdaDocSchema(invalidDoc);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  it('devrait migrer de façon ascendante un document d\'ancienne version sans terrain ni schemaVersion', () => {
    const legacyDoc: any = {
      format: 'arda/map-story',
      title: 'Legacy World',
      map: {
        styleUrl: 'https://example.com/legacy.json',
        styleId: 'legacy'
      },
      waypoints: [
        { id: 'wp-1', year: 100, label: 'Étape 1', cameraState: { center: [0, 0], zoom: 2 }, narrationText: '', slideRefs: [] }
      ]
    };

    const migrated = migrateArdaDoc(legacyDoc);

    expect(migrated.schemaVersion).toBe(CURRENT_ARDA_SCHEMA_VERSION);
    expect(migrated.map.terrain).toBeDefined();
    expect(migrated.map.terrain?.mode).toBe('none');
    expect(migrated.slides).toBeDefined();
    expect(migrated.entitiesGeoJSON).toBeDefined();
  });
});
