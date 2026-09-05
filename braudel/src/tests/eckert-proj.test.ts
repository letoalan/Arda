import { describe, it, expect, afterAll } from 'vitest';
import { eckertProjService, ECKERT_IV_CRS } from '../services/cartography/eckertProjService';

describe('Eckert IV Proj Service — Tests Unitaires & Wasm PROJ (ESRI:54012)', () => {
  afterAll(async () => {
    await eckertProjService.shutdown();
  });

  it('1. Déclare le code CRS ESRI:54012 officiel pour Eckert IV', () => {
    expect(ECKERT_IV_CRS).toBe('ESRI:54012');
  });

  it('2. Initialise PROJ WebAssembly et produit un transformateur valide', async () => {
    const transformer = await eckertProjService.init();
    expect(transformer).toBeDefined();
    expect(transformer.sourceCRS).toBe('ESRI:54012');
    expect(eckertProjService.getTransformer()).toBe(transformer);
  });

  it('3. Mappe le centre du monde [0, 0] exactement sur [0, 0] en fake Mercator', async () => {
    const [fakeLon, fakeLat] = await eckertProjService.realToFakeMercator([0, 0]);
    expect(Math.abs(fakeLon)).toBeLessThan(1e-6);
    expect(Math.abs(fakeLat)).toBeLessThan(1e-6);

    const [realLon, realLat] = await eckertProjService.fakeMercatorToReal([fakeLon, fakeLat]);
    expect(Math.abs(realLon)).toBeLessThan(1e-6);
    expect(Math.abs(realLat)).toBeLessThan(1e-6);
  });

  it('4. Valide le cycle complet aller-retour (roundtrip) sur plusieurs métropoles mondiales', async () => {
    const testPoints: Array<{ name: string; coord: [number, number] }> = [
      { name: 'Paris', coord: [2.3522, 48.8566] },
      { name: 'Tokyo', coord: [139.6917, 35.6895] },
      { name: 'New York', coord: [-74.006, 40.7128] },
      { name: 'Sydney', coord: [151.2093, -33.8688] },
      { name: 'Le Caire', coord: [31.2357, 30.0444] }
    ];

    for (const pt of testPoints) {
      const fake = await eckertProjService.realToFakeMercator(pt.coord);
      expect(Number.isFinite(fake[0])).toBe(true);
      expect(Number.isFinite(fake[1])).toBe(true);

      const recovered = await eckertProjService.fakeMercatorToReal(fake);
      expect(recovered[0]).toBeCloseTo(pt.coord[0], 4);
      expect(recovered[1]).toBeCloseTo(pt.coord[1], 4);
    }
  });

  it('5. Valide le comportement aux hautes latitudes et près des pôles (sans NaN ni débordement)', async () => {
    const highLatPoints: [number, number][] = [
      [0, 85],
      [0, -85],
      [120, 75],
      [-60, -75]
    ];

    for (const coord of highLatPoints) {
      const fake = await eckertProjService.realToFakeMercator(coord);
      expect(Number.isFinite(fake[0])).toBe(true);
      expect(Number.isFinite(fake[1])).toBe(true);

      const recovered = await eckertProjService.fakeMercatorToReal(fake);
      expect(recovered[0]).toBeCloseTo(coord[0], 3);
      expect(recovered[1]).toBeCloseTo(coord[1], 3);
    }
  });

  it('6. Reprojette une collection GeoJSON complète via reprojectGeoJSON', async () => {
    const sampleGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Point A' },
          geometry: {
            type: 'Point',
            coordinates: [10, 20]
          }
        },
        {
          type: 'Feature',
          properties: { name: 'Zone B' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
                [0, 0]
              ]
            ]
          }
        }
      ]
    };

    const reprojected = await eckertProjService.reprojectGeoJSON(sampleGeoJSON);
    expect(reprojected).toBeDefined();
    expect(reprojected.type).toBe('FeatureCollection');
    expect(reprojected.features.length).toBe(2);

    const reprojectedPoint = reprojected.features[0].geometry.coordinates;
    expect(Number.isFinite(reprojectedPoint[0])).toBe(true);
    expect(Number.isFinite(reprojectedPoint[1])).toBe(true);
    // Les coordonnées doivent être transformées en fake Mercator
    expect(reprojectedPoint[0]).not.toBe(10);
  });

  it('7. Transforme un tableau de coordonnées par lot via transformCoordinates', async () => {
    const batch: [number, number][] = [
      [0, 0],
      [45, 45],
      [-45, -45]
    ];

    const results = await eckertProjService.transformCoordinates(batch);
    expect(results.length).toBe(3);
    expect(results[0][0]).toBeCloseTo(0, 5);
    expect(results[0][1]).toBeCloseTo(0, 5);
  });

  it('8. Reprojette un style MapLibre complet via reprojectStyleToEckertIV et configure projection: mercator', async () => {
    const minimalStyle: any = {
      version: 8,
      sources: {
        continents: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { name: 'Eurasie' },
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [0, 30],
                      [60, 30],
                      [60, 60],
                      [0, 60],
                      [0, 30]
                    ]
                  ]
                }
              }
            ]
          }
        }
      },
      layers: [
        {
          id: 'continents-layer',
          type: 'fill',
          source: 'continents',
          paint: {
            'fill-color': '#4a7c59'
          }
        }
      ]
    };

    const { reprojectStyleToEckertIV } = await import('../services/cartography/reprojectStyleEckert');
    const { result, benchmark } = await reprojectStyleToEckertIV(minimalStyle);

    expect(result).toBeDefined();
    expect(result.style.projection).toEqual({ type: 'mercator' });
    expect(result.bounds).toBeDefined();
    expect(result.bounds[0].length).toBe(2);
    expect(result.bounds[1].length).toBe(2);

    expect(benchmark.crs).toBe('ESRI:54012');
    expect(benchmark.reprojectedSources).toContain('continents');
    expect(benchmark.skippedSources.length).toBe(0);
    expect(benchmark.reprojectDurationMs).toBeGreaterThan(0);
  });

  it('9. Analyse télémétrique : isole et classe correctement les calques raster-dem et hillshade', async () => {
    const hybridStyle: any = {
      version: 8,
      sources: {
        vectorData: {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        },
        demRelief: {
          type: 'raster-dem',
          tiles: ['https://tiles.example.com/{z}/{x}/{y}.png'],
          tileSize: 256
        }
      },
      layers: []
    };

    const { reprojectStyleToEckertIV } = await import('../services/cartography/reprojectStyleEckert');
    const { benchmark } = await reprojectStyleToEckertIV(hybridStyle);

    expect(benchmark.sourceCount).toBe(2);
    expect(benchmark.reprojectedSources).toContain('vectorData');
    expect(benchmark.skippedSources.some(s => s.includes('demRelief'))).toBe(true);
  });

  it('10. Mesure le débit de reprojection de géométries réalistes (débit élevé Wasm)', async () => {
    // Génération synthétique de 100 polygones à 20 sommets (2000 coordonnées)
    const features: any[] = [];
    for (let i = 0; i < 100; i++) {
      const ring: [number, number][] = [];
      const baseLon = (i * 3.5) % 340 - 170;
      const baseLat = (i * 1.5) % 140 - 70;
      for (let j = 0; j < 20; j++) {
        const angle = (j / 20) * 2 * Math.PI;
        ring.push([baseLon + Math.cos(angle) * 1.5, baseLat + Math.sin(angle) * 1.5]);
      }
      ring.push(ring[0]);
      features.push({
        type: 'Feature',
        properties: { id: i },
        geometry: { type: 'Polygon', coordinates: [ring] }
      });
    }

    const t0 = performance.now();
    const reprojected = await eckertProjService.reprojectGeoJSON({
      type: 'FeatureCollection',
      features
    });
    const duration = performance.now() - t0;

    expect(reprojected.features.length).toBe(100);
    // 2100 sommets reprojetés en Wasm
    expect(duration).toBeLessThan(1000); // Moins d'une seconde
  });

  it('11. countVertices calcule avec rigueur les sommets des différentes géométries', async () => {
    const { countVertices } = await import('../services/cartography/preprojectEckert');
    expect(countVertices({ type: 'Point', coordinates: [0, 0] })).toBe(1);
    expect(countVertices({ type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] })).toBe(3);
    expect(countVertices({
      type: 'Polygon',
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
    })).toBe(5);
  });

  it('12. createEckertVectorTileIndex génère une pyramide de tuiles vectorielles geojson-vt pré-projetée', async () => {
    const { createEckertVectorTileIndex } = await import('../services/cartography/preprojectEckert');
    const geojson: any = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Île de France' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[2.0, 48.5], [2.6, 48.5], [2.6, 49.0], [2.0, 49.0], [2.0, 48.5]]]
          }
        }
      ]
    };

    const tileSet = await createEckertVectorTileIndex(geojson, { maxZoom: 12 });
    expect(tileSet).toBeDefined();
    expect(tileSet.featureCount).toBe(1);
    expect(tileSet.vertexCount).toBe(5);
    expect(tileSet.tileIndex).toBeDefined();

    // Vérifie qu'une tuile racine peut être récupérée
    const tile = tileSet.tileIndex.getTile(0, 0, 0);
    expect(tile).toBeDefined();
    expect(tile.features.length).toBeGreaterThan(0);
  });

  it('13. preprojectGeoJSONForEckert gère le cache mémoire LRU', async () => {
    const { preprojectGeoJSONForEckert, clearEckertPreprojectCache } = await import('../services/cartography/preprojectEckert');
    clearEckertPreprojectCache();

    const sample: any = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: 1 },
          geometry: { type: 'Point', coordinates: [15, 35] }
        }
      ]
    };

    const res1 = await preprojectGeoJSONForEckert(sample, 'epoch_test_1');
    const res2 = await preprojectGeoJSONForEckert(sample, 'epoch_test_1');
    expect(res1).toBe(res2); // Même référence mémoire issue du cache
  });

  it('14. calculateGeodesicDistanceKm calcule des distances orthodromiques réelles conformes', async () => {
    const { calculateGeodesicDistanceKm, formatGeographicCoordinates } = await import('../services/cartography/eckertGeoUtils');

    const paris: [number, number] = [2.3522, 48.8566];
    const london: [number, number] = [-0.1276, 51.5074];
    const tokyo: [number, number] = [139.6917, 35.6895];

    const distParisLondon = calculateGeodesicDistanceKm(paris, london);
    expect(distParisLondon).toBeGreaterThan(340);
    expect(distParisLondon).toBeLessThan(350);

    const distParisTokyo = calculateGeodesicDistanceKm(paris, tokyo);
    expect(distParisTokyo).toBeGreaterThan(9600);
    expect(distParisTokyo).toBeLessThan(9800);

    const formatted = formatGeographicCoordinates(2.3522, 48.8566);
    expect(formatted).toContain('48.8566° N');
    expect(formatted).toContain('2.3522° E');
  });

  it('15. placeMarkerOnMap ajuste l’ancrage selon le mode de projection', async () => {
    const { placeMarkerOnMap } = await import('../services/cartography/eckertGeoUtils');

    let placedCoords: [number, number] = [0, 0];
    const mockMarker = {
      setLngLat: (coords: [number, number]) => {
        placedCoords = coords;
      }
    };

    const realPoint: [number, number] = [10, 45];

    // En mode Mercator standard : coordonnées réelles
    await placeMarkerOnMap(mockMarker, realPoint, false);
    expect(placedCoords).toEqual(realPoint);

    // En mode Eckert IV : coordonnées fake Mercator déformées
    await placeMarkerOnMap(mockMarker, realPoint, true);
    expect(placedCoords[0]).not.toBe(realPoint[0]);
    expect(placedCoords[1]).not.toBe(realPoint[1]);
  });

  it('16. unprojectRenderedFeatureCoordinates restaure les coordonnées réelles des entités cliquées', async () => {
    const { unprojectRenderedFeatureCoordinates } = await import('../services/cartography/eckertGeoUtils');

    const realPt: [number, number] = [2.3522, 48.8566];
    const fakePt = await eckertProjService.realToFakeMercator(realPt);

    const renderedFeature: any = {
      type: 'Feature',
      properties: { name: 'Capitale' },
      geometry: {
        type: 'Point',
        coordinates: fakePt
      }
    };

    const unprojected = await unprojectRenderedFeatureCoordinates(renderedFeature);
    expect((unprojected.geometry as any).coordinates[0]).toBeCloseTo(realPt[0], 3);
    expect((unprojected.geometry as any).coordinates[1]).toBeCloseTo(realPt[1], 3);
  });

  it('17. mapService.setProjection gère le basculement et expose isEckertIV()', async () => {
    const { mapService } = await import('../services/cartography/map-service');

    await mapService.setProjection('mercator');
    expect(mapService.isEckertIV()).toBe(false);
    expect(mapService.getCurrentProjection()).toBe('mercator');

    await mapService.setProjection('globe');
    expect(mapService.isEckertIV()).toBe(false);
    expect(mapService.getCurrentProjection()).toBe('globe');

    await mapService.setProjection('eckert4');
    expect(mapService.isEckertIV()).toBe(true);
    expect(mapService.getCurrentProjection()).toBe('eckert4');

    // Retour propre vers mercator
    await mapService.setProjection('mercator');
    expect(mapService.isEckertIV()).toBe(false);
  });

  it('18. geoToEckertMapCoord et eckertMapCoordToGeo effectuent un aller-retour précis', async () => {
    const { geoToEckertMapCoord, eckertMapCoordToGeo } = await import('../services/cartography/eckertGeoUtils');

    const rome: [number, number] = [12.4964, 41.9028];
    const fakeCoord = await geoToEckertMapCoord(rome);
    expect(fakeCoord[0]).not.toBe(rome[0]);

    const recovered = await eckertMapCoordToGeo(fakeCoord);
    expect(recovered[0]).toBeCloseTo(rome[0], 4);
    expect(recovered[1]).toBeCloseTo(rome[1], 4);
  });

  it('19. unprojectRenderedFeatureCoordinates supporte les LineString et MultiPolygon', async () => {
    const { unprojectRenderedFeatureCoordinates } = await import('../services/cartography/eckertGeoUtils');

    const pt1: [number, number] = [10, 20];
    const pt2: [number, number] = [30, 40];
    const fake1 = await eckertProjService.realToFakeMercator(pt1);
    const fake2 = await eckertProjService.realToFakeMercator(pt2);

    const lineFeature: any = {
      type: 'Feature',
      properties: { type: 'route' },
      geometry: {
        type: 'LineString',
        coordinates: [fake1, fake2]
      }
    };

    const restoredLine = await unprojectRenderedFeatureCoordinates(lineFeature);
    const coords = (restoredLine.geometry as any).coordinates;
    expect(coords[0][0]).toBeCloseTo(pt1[0], 3);
    expect(coords[0][1]).toBeCloseTo(pt1[1], 3);
    expect(coords[1][0]).toBeCloseTo(pt2[0], 3);
    expect(coords[1][1]).toBeCloseTo(pt2[1], 3);
  });

  it('20. Vérifie la conformité et la validité du fichier GeoJSON pré-projeté statiquement', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const preprojectedPath = path.resolve(process.cwd(), 'public/data/eckert4/1-world_bc123000.geojson');
    if (fs.existsSync(preprojectedPath)) {
      const raw = fs.readFileSync(preprojectedPath, 'utf8');
      const data = JSON.parse(raw);
      expect(data.type).toBe('FeatureCollection');
      expect(Array.isArray(data.features)).toBe(true);
      expect(data.features.length).toBeGreaterThan(0);

      // Vérifier que la géométrie est valide et non vide
      const firstFeature = data.features[0];
      expect(firstFeature.geometry).toBeDefined();
      expect(firstFeature.geometry.coordinates).toBeDefined();
    }
  });
});



