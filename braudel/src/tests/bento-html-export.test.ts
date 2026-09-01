import { describe, it, expect } from 'vitest';
import { STYLE_CONFIGS } from '../core/styles.config';
import { convertStoryProjectToArdaDoc, ArdaDoc } from '../services/export/modules/bento-types';
import { generateStandaloneHtml } from '../services/export/standalone-template';

describe('Bento HTML Map-Story Export Tests (bento.md & bento2.md)', () => {
  const mockEntitiesGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'rome',
        geometry: { type: 'Point', coordinates: [12.5, 41.9] },
        properties: { name: 'Rome', validFrom: -500, validTo: 200, wikiContent: 'Capitale de l\'Empire.' },
      },
      {
        type: 'Feature',
        id: 'carthage',
        geometry: { type: 'Point', coordinates: [10.3, 36.8] },
        properties: { name: 'Carthage', validFrom: -800, validTo: -146, wikiContent: 'Grande cité punique.' },
      },
    ],
  };

  const mockRelationsGeoJSON = {
    type: 'FeatureCollection',
    features: [],
  };

  const mockStoryProject: any = {
    id: 'story-rome',
    title: 'Expansion territoriale de Rome',
    description: 'Histoire de la République et de l\'Empire',
    scenes: [
      {
        id: 'scene-1',
        title: 'Rome des origines',
        body: 'Rome, cité parmi d\'autres cités italiques.',
        narrationText: 'Rome, cité parmi d\'autres cités italiques.',
        mapState: {
          center: [12.5, 41.9],
          zoom: 5.5,
          pitch: 20,
          bearing: 0,
          timelineYear: -450,
          visibleLayerIds: ['entities', 'relations'],
        },
        transition: {
          profile: 'standard',
          durationMode: 'auto',
          pauseAfterMs: 800,
          reduceMotionPolicy: 'respect',
        },
      },
      {
        id: 'scene-2',
        title: 'Guerres Puniques & Expansion',
        body: 'Expansion dans le bassin méditerranéen occidental.',
        narrationText: 'Affrontement avec Carthage pour le contrôle de la Méditerranée.',
        mapState: {
          center: [15.2, 37.5],
          zoom: 5.2,
          pitch: 35,
          bearing: -15,
          timelineYear: -250,
          visibleLayerIds: ['entities', 'relations'],
        },
        transition: {
          profile: 'standard',
          durationMode: 'auto',
          pauseAfterMs: 800,
          reduceMotionPolicy: 'respect',
        },
        blocks: [
          {
            type: 'text',
            title: 'Chronologie des Guerres Puniques',
            content: '-264 à -146 av. J.-C. : Trois guerres successives...',
          },
          {
            type: 'image',
            title: 'Trirème romaine',
            src: 'https://example.com/trireme.jpg',
            caption: 'Reconstitution d\'une trirème à corvus.',
          },
        ],
      },
    ],
  };

  it('devrait convertir un StoryProject en document ArdaDoc avec timeline et waypoints comme colonne vertébrale', () => {
    const ardaDoc: ArdaDoc = convertStoryProjectToArdaDoc(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      mockStoryProject
    );

    expect(ardaDoc.format).toBe('arda/map-story');
    expect(ardaDoc.title).toBe('Expansion territoriale de Rome');
    expect(ardaDoc.timeline.start).toBe(-450);
    expect(ardaDoc.timeline.end).toBe(-250);

    expect(ardaDoc.waypoints.length).toBe(2);
    expect(ardaDoc.waypoints[0].year).toBe(-450);
    expect(ardaDoc.waypoints[0].slideRefs.length).toBe(0);

    expect(ardaDoc.waypoints[1].year).toBe(-250);
    expect(ardaDoc.waypoints[1].slideRefs.length).toBe(1);

    expect(ardaDoc.slides.length).toBe(1);
    const slide = ardaDoc.slides[0];
    expect(slide.attachedToWaypoint).toBe('wp-scene-2');
    expect(slide.returnBehavior).toBe('same-waypoint');
    expect(slide.elements.length).toBe(2);
  });

  it('devrait extraire automatiquement des waypoints temporels à partir des entités si aucun StoryProject n\'est fourni (Axe A)', () => {
    const ardaDoc = convertStoryProjectToArdaDoc(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      undefined
    );

    expect(ardaDoc.waypoints.length).toBeGreaterThan(1);
    expect(ardaDoc.timeline.start).toBe(-800);
    expect(ardaDoc.timeline.end).toBe(200);
    expect(ardaDoc.waypoints[0].narrationText).toContain('entités actives');
  });

  it('devrait générer un fichier HTML autonome incluant le script arda-doc, le tiroir de légende et les options anti-clipping (Axes B, C, D)', () => {
    const customStyle: any = { ...STYLE_CONFIGS[0], id: 'tolkien_high_fantasy', mapStyleUrl: 'https://example.com/custom-style.json' };
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      customStyle,
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      mockStoryProject
    );

    // Vérification du style vectoriel dynamique (Axe B)
    expect(html).toContain('https://example.com/custom-style.json');

    // Vérification des options anti-clipping (Axe C)
    expect(html).toContain('buffer: 128');

    // Vérification du tiroir de légende dynamique (Axe D)
    expect(html).toContain('id="legend-drawer"');
    expect(html).toContain('id="btn-toggle-legend"');
    expect(html).toContain('function renderLegendContent');

    // Raccourcis et structure
    expect(html).toContain('function goToWaypoint');
    expect(html).toContain('function openSlide');
    expect(html).toContain('function closeSlideAndReturn');

    // Vérification Chantier 3 : Bordures de polygones en couches line dédiées
    expect(html).toContain('braudel-polygon-outline');

    // Vérification Chantier 4 : Croix de fermeture overlay superposé
    expect(html).toContain('id="btn-slide-close"');
    expect(html).toContain('slide-close-btn');
    expect(html).toContain('backdrop-filter: blur');
  });

  it('devrait inclure la configuration du relief DEM distant et le garde-fou réseau (Chantier 2)', () => {
    const customStyle: any = { 
      ...STYLE_CONFIGS[0], 
      demEnabled: true,
      demUrl: 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp',
      demExaggeration: 1.5
    };
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      customStyle,
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      mockStoryProject
    );

    expect(html).toContain('raster-dem');
    expect(html).toContain('terrain-dem');
    expect(html).toContain('terrain-hillshade');
    expect(html).toContain('Garde-fou relief actif');
  });

  it('devrait intégrer les repères géographiques et respecter les options de visibilité', () => {
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'map',
      undefined,
      undefined,
      {
        geoReferenceLinesVisible: true,
        portulanRhumbVisible: true,
      }
    );

    expect(html).toContain('geo-reference-lines');
    expect(html).toContain('Équateur');
    expect(html).toContain('Tropique Nord');
  });

  it('devrait inclure une fonction saveDeck avec une regex valide pour mettre à jour la balise arda-doc', () => {
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      mockStoryProject
    );

    expect(html).toContain('function saveDeck()');
    expect(html).toContain('/<script type="application\\/arda\\+json" id="arda-doc">([\\s\\S]*?)<\\/script>/i');
    expect(html).toContain('JSON.stringify(doc');
  });

  it('devrait isoler les raccourcis clavier (notamment P) des champs de saisie et de l\'éditeur de diapositive', () => {
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      mockStoryProject
    );

    expect(html).toContain("target.tagName === 'INPUT'");
    expect(html).toContain("target.tagName === 'TEXTAREA'");
    expect(html).toContain("slideModal && !slideModal.classList.contains('hidden')");
  });

  it('devrait inclure toutes les étapes / points temporels sans perte lors de l\'extraction automatique', () => {
    const entitiesWithManyEpochs = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', id: '1', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { validFrom: 100, validTo: 200 } },
        { type: 'Feature', id: '2', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { validFrom: 300, validTo: 400 } },
        { type: 'Feature', id: '3', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { validFrom: 500, validTo: 600 } },
        { type: 'Feature', id: '4', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { validFrom: 700, validTo: 800 } },
        { type: 'Feature', id: '5', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { validFrom: 900, validTo: 1000 } },
      ]
    };

    const doc = convertStoryProjectToArdaDoc('Test Epochs', STYLE_CONFIGS[0], entitiesWithManyEpochs, { type: 'FeatureCollection', features: [] });
    // Toutes les bornes et milieux doivent être présents
    expect(doc.waypoints.length).toBeGreaterThanOrEqual(10);
    const years = doc.waypoints.map(w => w.year);
    expect(years).toContain(100);
    expect(years).toContain(200);
    expect(years).toContain(300);
    expect(years).toContain(400);
    expect(years).toContain(500);
    expect(years).toContain(600);
    expect(years).toContain(700);
    expect(years).toContain(800);
    expect(years).toContain(900);
    expect(years).toContain(1000);
  });

  it('devrait appliquer le filtrage temporel semi-ouvert [validFrom, validTo[ pour éliminer la superposition aux dates charnières', () => {
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      mockStoryProject
    );

    // Vérification de la fonction de visibilité semi-ouverte
    expect(html).toContain('function isEntityTemporallyVisible(p, year)');
    expect(html).toContain('vf <= year && year < vt');
    // Vérification de l'expression MapLibre avec gestion de l'événement ponctuel et strict >
    expect(html).toContain("['>', ['to-number', ['get', 'validTo'], 999999], year]");
  });

  it('devrait inclure la miniature de diapositive interactive et les fonctionnalités d\'expansion/contraction des dates de la timeline', () => {
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      mockStoryProject
    );

    // Vérification miniature de slide dans le volet Bento
    expect(html).toContain('id="bento-slide-preview-box"');
    expect(html).toContain('id="bento-mini-slide-canvas"');
    expect(html).toContain('renderMiniSlidePreview');

    // Vérification contrôles d'expansion et saut temporel
    expect(html).toContain('id="bento-timeline-bar"');
    expect(html).toContain('id="timeline-ticks-bar"');
    expect(html).toContain('id="btn-toggle-labels"');
    expect(html).toContain('id="btn-timeline-prev-epoch"');
    expect(html).toContain('id="btn-timeline-next-epoch"');
    expect(html).toContain('timeline-eras-legend');
    expect(html).toContain('era-pill');
    expect(html).toContain('MIN_TICK_DISTANCE_PCT');
  });

  it('devrait inclure la barre d\'outils unifiée, la barre de progression du récit, le toggle thème et les infobulles d\'étapes', () => {
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      mockStoryProject
    );

    // Barre d'outils unifiée et toggle thème
    expect(html).toContain('top-toolbar-group');
    expect(html).toContain('id="btn-toggle-theme"');
    expect(html).toContain('id="btn-recenter-step"');
    expect(html).toContain('function toggleTheme');
    expect(html).toContain('function recenterCurrentStep');

    // Progression récit Bento & infobulles de prévisualisation
    expect(html).toContain('id="bento-story-progress"');
    expect(html).toContain('id="tooltip-prev-title"');
    expect(html).toContain('id="tooltip-next-title"');
  });

  it('devrait inclure le moteur d\'édition de slide avec manipulation 8 poignées, calques et opacité', () => {
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      mockStoryProject
    );

    // Onglets Propriétés & Calques
    expect(html).toContain('id="tab-btn-properties"');
    expect(html).toContain('id="tab-btn-layers"');
    expect(html).toContain('id="layers-list-container"');
    expect(html).toContain('function changeSelectedElementLayer');
    expect(html).toContain('function renderLayersList');

    // 8 Poignées de redimensionnement et opacité
    expect(html).toContain('resize-handle');
    expect(html).toContain('handle-nw');
    expect(html).toContain('handle-se');
    expect(html).toContain('id="insp-opacity"');
  });

  it('devrait inclure le mode écran partagé carte/slide (split 50/50 & minicarte PIP), les guides magnétiques et les formes étendues', () => {
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      mockStoryProject
    );

    // Mode Écran Partagé et Minicarte PIP Synchronisée
    expect(html).toContain('id="btn-slide-split-mode"');
    expect(html).toContain('id="slide-split-map-panel"');
    expect(html).toContain('id="slide-pip-minimap"');
    expect(html).toContain('let slideSplitState');
    expect(html).toContain('function toggleSplitMode');
    expect(html).toContain('pip-braudel-entities');
    expect(html).toContain('function updatePipTemporalFilter');
    expect(html).toContain('slide-viewport-frame');

    // Guides magnétiques d'alignement
    expect(html).toContain('id="guide-center-x"');
    expect(html).toContain('id="guide-center-y"');
    expect(html).toContain('editor-align-guide');

    // Formes étendues flèche et bannière
    expect(html).toContain('id="btn-editor-add-arrow"');
    expect(html).toContain('id="btn-editor-add-pill"');

    // Flux de diagrammes connectés par flèches
    expect(html).toContain('function parseDiagramFlowHTML');
    expect(html).toContain('diagram-flow-container');
    expect(html).toContain('diagram-flow-node');
    expect(html).toContain('diagram-flow-arrow');
  });

  it('devrait générer un script JS exempt d\'erreurs de syntaxe de saut de ligne non échappé', () => {
    const html = generateStandaloneHtml(
      'Monde Méditerranéen',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      mockStoryProject
    );

    // Vérifier qu'il n'y a pas de chaîne JS multiligne non échappée dans parseDiagramFlowHTML
    expect(html).not.toMatch(/text\.split\('\r?\n'\)/);
  });

  it('devrait intégrer l\'infrastructure complète du Mode EX Sidecar (layout docked, scrollytelling, map actions, minimap et ruban vertical)', () => {
    const storyWithActions: any = {
      ...mockStoryProject,
      scenes: [
        {
          ...mockStoryProject.scenes[0],
          partOfArgument: 'I.1',
          recommendedDocumentId: 'doc-001',
          actions: [
            {
              triggerText: 'Rome des origines',
              viewpoint: { center: [12.5, 41.9], zoom: 7 },
              popupInfo: { title: 'Fondation de Rome', dates: '-753', description: 'Mythe et histoire.' }
            }
          ]
        },
        ...mockStoryProject.scenes.slice(1)
      ]
    };

    const html = generateStandaloneHtml(
      'Monde Romain',
      STYLE_CONFIGS[0],
      mockEntitiesGeoJSON,
      mockRelationsGeoJSON,
      'story',
      storyWithActions
    );

    // Phase 1 : Layout Docked et boutons de bascule
    expect(html).toContain('id="btn-toggle-sidecar"');
    expect(html).toContain('id="btn-toggle-orientation"');
    expect(html).toContain('id="sidecar-narrative-panel"');
    expect(html).toContain('app-layout-root');
    expect(html).toContain('main-map-stage');

    // Phase 2 & 4 : Structure argumentative et Map Actions cliquables
    expect(html).toContain('narrative-step-card');
    expect(html).toContain('narrative-part-badge');
    expect(html).toContain('map-action-trigger');
    expect(html).toContain('function triggerMapAction');
    expect(html).toContain('map-action-popover');
    expect(html).toContain('btn-return-thread');

    // Phase 3 & 7 : Scrollytelling, IntersectionObserver et progression verticale
    expect(html).toContain('sidecar-vertical-progress-track');
    expect(html).toContain('sidecar-vertical-progress-bar');
    expect(html).toContain('function initModeExSidecar');
    expect(html).toContain('function toggleSidecarMode');
    expect(html).toContain('function toggleSidecarOrientation');
    expect(html).toContain('IntersectionObserver');

    // Phase 5 : Mini-carte de contexte macro / continentale avec échelle différenciée
    expect(html).toContain('id="context-minimap-box"');
    expect(html).toContain('id="context-minimap-canvas"');
    expect(html).toContain('id="context-minimap-indicator"');
    expect(html).toContain('function initContextMinimap');
    expect(html).toContain('continentalZoom');
    expect(html).toContain('defaultMacroZoom');
    expect(html).toContain('is-continental-view');
    expect(html).toContain('Continentale');
  });
});
