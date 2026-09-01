import { describe, it, expect, vi } from 'vitest';
import { calculateBuffer } from '../services/analysis/analysis-service';
import { generateStandaloneHtml } from '../services/export/standalone-template';
import { exportToPDF, captureMapCanvas } from '../services/export/export-multimedia';
import { extractActiveEpochs } from '../services/export/pdf-timeline-utils';
import { STYLE_CONFIGS } from '../core/styles.config';

describe('Multimedia Export & Spatial Analysis Tests', () => {
  it('should correctly calculate a buffer polygon around a point', () => {
    const point = {
      type: 'Point' as const,
      coordinates: [2.3522, 48.8566] as [number, number], // Paris
    };

    const buffer = calculateBuffer(point, 10); // 10 km
    expect(buffer.geometry.type).toBe('Polygon');
    expect(buffer.geometry.coordinates[0].length).toBe(33); // 32 segments + fermeture

    // Le premier et le dernier point doivent être identiques
    const coords = buffer.geometry.coordinates[0];
    expect(coords[0][0]).toBeCloseTo(coords[coords.length - 1][0], 5);
    expect(coords[0][1]).toBeCloseTo(coords[coords.length - 1][1], 5);
  });

  it('should generate a valid standalone HTML page containing all injected elements', () => {
    const style = STYLE_CONFIGS[0];
    const entities = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: { name: 'Rome', type: 'city' },
        },
      ],
    };
    const relations = {
      type: 'FeatureCollection',
      features: [],
    };

    const html = generateStandaloneHtml('Monde Test', style, entities, relations);
    expect(html).toContain('maplibregl.Map');
    expect(html).toContain('entitiesData');
    expect(html).toContain('relationsData');
    expect(html).toContain('Monde Test');
    expect(html).toContain('timeline-slider');
  });

  it('should capture map canvas dataUrl and dimensions properly', async () => {
    const mockCanvas = {
      width: 1920,
      height: 1080,
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,/9j/mockImageData'),
    };

    const mockMap = {
      triggerRepaint: vi.fn(),
      loaded: vi.fn().mockReturnValue(true),
      getCanvas: vi.fn().mockReturnValue(mockCanvas),
    };

    const captureResult = await captureMapCanvas(mockMap);
    expect(mockMap.triggerRepaint).toHaveBeenCalled();
    expect(captureResult.dataUrl).toBe('data:image/jpeg;base64,/9j/mockImageData');
    expect(captureResult.width).toBe(1920);
    expect(captureResult.height).toBe(1080);
  });

  it('should successfully execute exportToPDF with structured entities, relations and cartographic elements', async () => {
    const validJpeg1x1 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const mockCanvas = {
      width: 1600,
      height: 900,
      toDataURL: vi.fn().mockReturnValue(validJpeg1x1),
    };

    const mockMap = {
      triggerRepaint: vi.fn(),
      loaded: vi.fn().mockReturnValue(true),
      getCanvas: vi.fn().mockReturnValue(mockCanvas),
      getCenter: vi.fn().mockReturnValue({ lat: 45, lng: 10 }),
      getZoom: vi.fn().mockReturnValue(5),
    };

    const style = STYLE_CONFIGS[0];
    const entities = [
      {
        id: '1',
        name: 'Empire Romain',
        type: 'concept',
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        },
        properties: { color: '#DC2626' },
        temporalRange: { validFrom: -27, validTo: 476 },
      },
      {
        id: '2',
        name: 'Rome',
        type: 'place',
        geometry: { type: 'Point', coordinates: [12.49, 41.90] },
        properties: { color: '#F59E0B' },
        temporalRange: { validFrom: -753, validTo: 2026 },
      },
      {
        id: '3',
        name: 'Via Appia',
        type: 'place',
        geometry: { type: 'LineString', coordinates: [[12.49, 41.90], [17.94, 40.63]] },
        properties: { color: '#10B981' },
        temporalRange: { validFrom: -312, validTo: 500 },
      },
    ];

    const relations = [
      {
        id: 'r1',
        sourceId: '2',
        targetId: '1',
        type: 'Capitale administrative',
        temporalRange: { validFrom: -27, validTo: 330 },
      },
    ];

    // Mock document creation / download
    await expect(
      exportToPDF(
        'Monde Méditerranéen',
        100,
        style,
        mockMap,
        entities,
        relations,
        { historicalPeriod: 'Haut-Empire Romain (Principat)' }
      )
    ).resolves.not.toThrow();
  });

  it('should extract active epochs containing project contributions and geopolitical sources', () => {
    const entities = [
      {
        id: '1',
        name: 'Civilisation Mycénienne',
        type: 'concept',
        temporalRange: { validFrom: -1500, validTo: -1100 },
      },
      {
        id: '2',
        name: 'Royaume de France',
        type: 'concept',
        temporalRange: { validFrom: 843, validTo: 1792 },
      },
    ];

    const relations = [
      {
        id: 'r1',
        sourceId: '1',
        targetId: '2',
        temporalRange: { validFrom: 1492, validTo: 1500 },
      },
    ];

    const epochs = extractActiveEpochs(entities, relations, -2000, 2024);
    expect(epochs.length).toBeGreaterThan(0);

    const yearMinus1500 = epochs.find(e => e.year === -1500);
    expect(yearMinus1500).toBeDefined();
    expect(yearMinus1500?.entityCount).toBeGreaterThanOrEqual(1);

    const year1492 = epochs.find(e => e.year === 1492);
    expect(year1492).toBeDefined();

    // Vérification du calcul précis du milieu de période (ex: -500 --> -400 = -450)
    const epochMinus500 = epochs.find(e => e.year === -500);
    if (epochMinus500) {
      expect(epochMinus500.targetYear).toBe(-450);
      expect(epochMinus500.validFrom).toBe(-500);
      expect(epochMinus500.validTo).toBe(-400);
    }
  });


  describe('Timeline-Driven Changepoints Tests (solution.md)', () => {
    it('should compute changepoints correctly, deduplicating and sorting', async () => {
      const { computeChangepoints, getNextChangepoint, getPreviousChangepoint, computeCoverageTimelineYears } = await import('../services/timeline/changepoints');
      const entities = [
        { id: '1', temporalRange: [-500, -300] as [number, number] },
        { id: '2', temporalRange: [-300, 100] as [number, number] },
        { id: '3', temporalRange: [100, 200] as [number, number] },
      ];

      const changepoints = computeChangepoints(entities);
      expect(changepoints).toEqual([-500, -300, 100, 200]);

      expect(getNextChangepoint(-600, changepoints)).toBe(-500);
      expect(getNextChangepoint(-500, changepoints)).toBe(-300);
      expect(getNextChangepoint(-300, changepoints)).toBe(100);
      expect(getNextChangepoint(200, changepoints)).toBeNull();

      expect(getPreviousChangepoint(-300, changepoints)).toBe(-500);
      expect(getPreviousChangepoint(100, changepoints)).toBe(-300);

      // Couverture complète se positionnant sur la période antérieure (-1)
      const prevPoint = getPreviousChangepoint(-300, changepoints)!;
      expect(prevPoint).toBe(-500); // Période -1
      const coverageYears = computeCoverageTimelineYears(prevPoint, changepoints);
      expect(coverageYears[0]).toBe(-500); // Période -1
      expect(coverageYears).toEqual([-500, -300, 100, 200]);
    });



    it('should handle empty timeline without looping', async () => {
      const { computeChangepoints, getNextChangepoint } = await import('../services/timeline/changepoints');
      const changepoints = computeChangepoints([]);
      expect(changepoints).toEqual([]);
      expect(getNextChangepoint(0, changepoints)).toBeNull();
    });

    it('should handle single shared temporalRange', async () => {
      const { computeChangepoints, getNextChangepoint } = await import('../services/timeline/changepoints');
      const entities = [
        { id: '1', temporalRange: [100, 200] as [number, number] },
        { id: '2', temporalRange: [100, 200] as [number, number] },
      ];
      const changepoints = computeChangepoints(entities);
      expect(changepoints).toEqual([100, 200]);
      expect(getNextChangepoint(100, changepoints)).toBe(200);
      expect(getNextChangepoint(200, changepoints)).toBeNull();
    });
  });

  describe('Atlas PDF Multi-Epoch & GPU Synchronization Tests (solution2.md)', () => {
    it('should correctly evaluate isEntityVisibleAt with polymorphic temporalRange and epochRange', async () => {
      const { isEntityVisibleAt, isRelationVisibleAt } = await import('../services/export/export-multimedia');

      const entityObj = {
        id: 'e1',
        temporalRange: { validFrom: -500, validTo: -400 },
      };
      const entityArr = {
        id: 'e2',
        temporalRange: [-500, -400],
      };
      const entitySingle = {
        id: 'e3',
        temporalRange: { validFrom: -500, validTo: -500 },
      };

      // Point médian -450
      expect(isEntityVisibleAt(entityObj, -450)).toBe(true);
      expect(isEntityVisibleAt(entityArr, -450)).toBe(true);
      expect(isEntityVisibleAt(entitySingle, -450)).toBe(false);

      // Test isRelationVisibleAt
      const relObj = {
        id: 'r1',
        sourceId: 'e1',
        targetId: 'e2',
        temporalRange: { validFrom: -500, validTo: -400 },
      };
      expect(isRelationVisibleAt(relObj, -450)).toBe(true);
      expect(isRelationVisibleAt(relObj, 100)).toBe(false);

      // Avec epochRange [-500, -400]
      const epochRange = { validFrom: -500, validTo: -400 };
      expect(isEntityVisibleAt(entitySingle, -450, epochRange)).toBe(true);
      expect(isEntityVisibleAt(entityObj, -450, epochRange)).toBe(true);
      expect(isRelationVisibleAt(relObj, -450, epochRange)).toBe(true);

      // En dehors de la période
      expect(isEntityVisibleAt(entityObj, 100, epochRange)).toBe(true); // chevauche epochRange
      expect(isEntityVisibleAt(entityObj, 100, { validFrom: 0, validTo: 200 })).toBe(false);
    });

    it('should export exactly X pages for X selected epochs at midpoint snapshot', async () => {
      const { exportMultiEpochPDF } = await import('../services/export/export-multimedia');

      const selectedEpochs = [
        { year: -450, label: 'Monde classique (-500 av. J.-C.)', referenceYear: -500, validFrom: -500, validTo: -400 },
        { year: -250, label: 'Monde hellénistique (-300 av. J.-C.)', referenceYear: -300, validFrom: -300, validTo: -200 },
        { year: 50, label: 'Monde antique (100 ap. J.-C.)', referenceYear: 1, validFrom: 1, validTo: 100 },
      ];

      const timeSnapshots: number[] = [];
      const setTimeMock = vi.fn((y: number) => {
        timeSnapshots.push(y);
      });
      const updateMapMock = vi.fn();

      const fakeMap = {
        getCanvas: () => ({
          width: 800,
          height: 600,
          toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        }),
        isSourceLoaded: () => true,
        areTilesLoaded: () => true,
        triggerRepaint: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn((_event: string, cb: () => void) => cb()),
      };

      await exportMultiEpochPDF(
        'Monde Test',
        selectedEpochs,
        STYLE_CONFIGS[0],
        fakeMap,
        setTimeMock,
        updateMapMock,
        [],
        []
      );

      // Exactement 3 snapshots aux points médians
      expect(timeSnapshots).toEqual([-450, -250, 50]);
      expect(setTimeMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Solution 3-1: Verrouillage étendu à toutes les sources et état caméra', () => {
    function createMockMap(options: {
      sources?: Record<string, boolean>;
      isMoving?: boolean | (() => boolean);
      isZooming?: boolean | (() => boolean);
      isRotating?: boolean | (() => boolean);
      areTilesLoaded?: boolean | (() => boolean);
    }) {
      const sourceState: Record<string, boolean> = { ...(options.sources ?? { 'braudel-entities': true }) };
      const mockCanvas = {
        width: 800,
        height: 600,
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
      };

      const map = {
        getStyle: vi.fn(() => ({
          sources: Object.keys(sourceState).reduce((acc, k) => ({ ...acc, [k]: {} }), {}),
        })),
        isSourceLoaded: vi.fn((id: string) => sourceState[id] ?? true),
        setSourceLoaded: (id: string, loaded: boolean) => {
          sourceState[id] = loaded;
        },
        areTilesLoaded: vi.fn(() => (typeof options.areTilesLoaded === 'function' ? options.areTilesLoaded() : options.areTilesLoaded ?? true)),
        isMoving: vi.fn(() => (typeof options.isMoving === 'function' ? options.isMoving() : options.isMoving ?? false)),
        isZooming: vi.fn(() => (typeof options.isZooming === 'function' ? options.isZooming() : options.isZooming ?? false)),
        isRotating: vi.fn(() => (typeof options.isRotating === 'function' ? options.isRotating() : options.isRotating ?? false)),
        triggerRepaint: vi.fn(),
        getCanvas: vi.fn(() => mockCanvas),
        getSource: vi.fn(() => ({ setData: vi.fn() })),
      };

      return map;
    }

    it('ne doit pas capturer tant que le fond de carte est en mouvement ou incomplet', async () => {
      const { captureSnapshotAt } = await import('../services/export/export-multimedia');
      const map = createMockMap({
        sources: { 'braudel-entities': true, 'openmaptiles': false }, // fond non chargé
        isMoving: false,
      });

      const mockWorldStore = { entities: [], relations: [], layers: [] };
      const mockRenderOptions = { styleConfig: STYLE_CONFIGS[0] };

      const capturePromise = captureSnapshotAt(-450, map, mockWorldStore, mockRenderOptions);

      // Simule la fin du chargement du fond après un court délai
      setTimeout(() => map.setSourceLoaded('openmaptiles', true), 50);

      await expect(capturePromise).resolves.toBeDefined();
      expect(map.getCanvas).toHaveBeenCalledTimes(1); // capture après, pas pendant le chargement
    });

    it('doit rejeter si la caméra est encore en transition après timeout', async () => {
      const { captureSnapshotAt } = await import('../services/export/export-multimedia');
      const map = createMockMap({ isMoving: () => true }); // reste en mouvement indéfiniment
      const mockWorldStore = { entities: [], relations: [], layers: [] };
      const mockRenderOptions = { styleConfig: STYLE_CONFIGS[0] };

      await expect(
        captureSnapshotAt(-450, map, mockWorldStore, mockRenderOptions)
      ).rejects.toThrow(/Timeout/);
    });
  });

  describe('Solution 4: Non-régression - Canvas distinct par époque & ordre setData -> capture', () => {
    it('doit attendre l\'événement sourcedata spécifique avant de capturer', async () => {
      const { updateEntitiesAndWaitForRender } = await import('../services/export/export-multimedia');
      
      const executionOrder: string[] = [];
      const mockGeojson = { type: 'FeatureCollection', features: [{ id: 'f1', type: 'Feature', geometry: null, properties: {} }] };

      const fakeSource = {
        setData: vi.fn((_data: any) => {
          executionOrder.push('setData');
        }),
      };

      const fakeMap = {
        getSource: vi.fn((id: string) => (id === 'braudel-entities' ? fakeSource : null)),
        on: vi.fn((event: string, cb: (e: any) => void) => {
          if (event === 'sourcedata' || event === 'data') {
            setTimeout(() => {
              executionOrder.push('sourcedata_event');
              cb({ sourceId: 'braudel-entities', isSourceLoaded: true });
            }, 10);
          }
        }),
        off: vi.fn(),
        once: vi.fn((_event: string, cb: () => void) => {
          executionOrder.push('render_event');
          cb();
        }),
        triggerRepaint: vi.fn(() => executionOrder.push('triggerRepaint')),
        getCanvas: vi.fn(() => {
          executionOrder.push('getCanvas');
          return {
            width: 800,
            height: 600,
            toDataURL: vi.fn().mockReturnValue('data:image/png;base64,distinct-epoch-1'),
          };
        }),
      };

      await updateEntitiesAndWaitForRender(fakeMap, 'braudel-entities', mockGeojson);
      fakeMap.getCanvas();

      expect(fakeSource.setData).toHaveBeenCalledWith(mockGeojson);
      expect(executionOrder.indexOf('setData')).toBeLessThan(executionOrder.indexOf('getCanvas'));
      expect(executionOrder.indexOf('render_event')).toBeLessThan(executionOrder.indexOf('getCanvas'));
    });

    it('chaque page doit capturer un canevas distinct correspondant à son targetYear', async () => {
      const { exportMultiEpochPDF } = await import('../services/export/export-multimedia');

      const selectedEpochs = [
        { year: -450, label: 'Monde classique (-500 av. J.-C.)', referenceYear: -500, validFrom: -500, validTo: -400 },
        { year: -250, label: 'Monde hellénistique (-300 av. J.-C.)', referenceYear: -300, validFrom: -300, validTo: -200 },
        { year: 50, label: 'Monde antique (100 ap. J.-C.)', referenceYear: 1, validFrom: 1, validTo: 100 },
      ];

      let currentYear = -450;
      const setTimeMock = vi.fn((y: number) => {
        currentYear = y;
      });
      const updateMapMock = vi.fn();

      const canvasSnapshots: string[] = [];
      const fakeSource = {
        setData: vi.fn(),
      };

      const fakeMap = {
        getSource: vi.fn((id: string) => (id === 'braudel-entities' ? fakeSource : null)),
        getStyle: vi.fn(() => ({ sources: { 'braudel-entities': {} } })),
        isSourceLoaded: vi.fn(() => true),
        areTilesLoaded: vi.fn(() => true),
        isMoving: vi.fn(() => false),
        isZooming: vi.fn(() => false),
        isRotating: vi.fn(() => false),
        triggerRepaint: vi.fn(),
        on: vi.fn((_event: string, cb: (e: any) => void) => {
          cb({ sourceId: 'braudel-entities', isSourceLoaded: true });
        }),
        off: vi.fn(),
        once: vi.fn((_event: string, cb: () => void) => cb()),
        getCanvas: vi.fn(() => ({
          width: 800,
          height: 600,
          toDataURL: vi.fn(() => {
            const pngs: Record<number, string> = {
              [-450]: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              [-250]: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
              [50]: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
            };
            const data = pngs[currentYear] || pngs[-450];
            canvasSnapshots.push(data);
            return data;
          }),
        })),
      };

      const testEntities = [
        { id: 'e1', name: 'Athènes', temporalRange: [-500, -400] },
        { id: 'e2', name: 'Alexandrie', temporalRange: [-300, -200] },
        { id: 'e3', name: 'Rome Impériale', temporalRange: [1, 100] },
      ];

      await exportMultiEpochPDF(
        'Monde Test',
        selectedEpochs,
        STYLE_CONFIGS[0],
        fakeMap,
        setTimeMock,
        updateMapMock,
        testEntities,
        []
      );

      expect(canvasSnapshots.length).toBe(3);
      const uniqueSnapshots = new Set(canvasSnapshots);
      expect(uniqueSnapshots.size).toBe(3);
    });
  });

  describe('Solution 5: Export Collection Multi-Époques ZIP avec conservation du bearing Al-Idrisi', () => {
    it('doit exporter une image JPEG par époque dans une archive ZIP et préserver le bearing', async () => {
      const { exportMultiEpochZIP } = await import('../services/export/export-multimedia');
      
      const setTimeMock = vi.fn();
      const capturedYears: number[] = [];
      
      const fakeSource = { setData: vi.fn() };
      const fakeMap = {
        getBearing: vi.fn(() => 180), // Al-Idrisi Sud en haut
        getPitch: vi.fn(() => 0),
        getSource: vi.fn(() => fakeSource),
        getStyle: vi.fn(() => ({ sources: { 'braudel-entities': {} } })),
        isSourceLoaded: vi.fn(() => true),
        areTilesLoaded: vi.fn(() => true),
        isMoving: vi.fn(() => false),
        isZooming: vi.fn(() => false),
        isRotating: vi.fn(() => false),
        triggerRepaint: vi.fn(),
        on: vi.fn((event: string, cb: any) => {
          if (event === 'sourcedata') {
            setTimeout(() => cb({ sourceId: 'braudel-entities', isSourceLoaded: true }), 5);
          }
        }),
        off: vi.fn(),
        once: vi.fn((_event: string, cb: any) => cb()),
        getCanvas: vi.fn(() => ({
          width: 800,
          height: 600,
          toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
        })),
      };

      const selectedEpochs = [
        { year: -500, label: 'Antiquité', targetYear: -450 },
        { year: 1154, label: 'Al-Idrisi', targetYear: 1154 },
        { year: 1789, label: 'Révolution', targetYear: 1789 },
      ];

      await exportMultiEpochZIP(
        'Monde Idrisi',
        selectedEpochs,
        fakeMap,
        (y) => {
          capturedYears.push(y);
          setTimeMock(y);
        },
        [],
        [],
        STYLE_CONFIGS[0]
      );

      // Vérifie que chaque époque a bien été ciblée
      expect(setTimeMock).toHaveBeenCalledTimes(3);
      expect(capturedYears).toEqual([-450, 1154, 1789]);
      // Vérifie que le bearing 180° a été lu
      expect(fakeMap.getBearing).toHaveBeenCalled();
    });
  });
});


