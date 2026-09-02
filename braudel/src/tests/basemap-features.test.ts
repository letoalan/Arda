// tests/basemap-features.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { STYLE_CONFIGS } from '../core/styles.config';
import { 
  getBasemapFeatureDefaults, 
  getGraticuleStyleForBasemap 
} from '../core/styles/styleFeatureDefaults';
import { createUiSlice } from '../app/state/storeUiActions';
import { 
  initColonialGraticuleLayer, 
  toggleGraticuleGrid, 
  updateGraticuleStyle 
} from '../services/cartography/modules/grid-reference-layers';
import { 
  initRhumbNetworkLayer, 
  toggleRhumbLines, 
  updateRhumbPalette 
} from '../services/cartography/modules/rhumb-layers';

describe('Basemap Features — Defaults & Palettes par style', () => {
  it('doit couvrir l\'intégralité des styles définis dans STYLE_CONFIGS avec rhumbs et graticule DÉSACTIVÉS par défaut', () => {
    STYLE_CONFIGS.forEach((style) => {
      const defaults = getBasemapFeatureDefaults(style.id);
      expect(defaults).toBeDefined();
      // Règle d'or : aucune ligne de rhumb ni graticule ne doit être affichée par défaut
      expect(defaults.portulanRhumbVisible).toBe(false);
      expect(defaults.graticuleVisible).toBe(false);
      expect(typeof defaults.bordersVisible).toBe('boolean');

      const graticuleStyle = getGraticuleStyleForBasemap(style.id);
      expect(graticuleStyle).toBeDefined();
      expect(graticuleStyle.lineColor).toBeDefined();
      expect(graticuleStyle.textColor).toBeDefined();
      expect(graticuleStyle.lineOpacity).toBeGreaterThan(0);
    });
  });

  it('désactive systématiquement les rhumbs par défaut même sur les portulans médiévaux et Renaissance', () => {
    const medieval = getBasemapFeatureDefaults('medieval');
    expect(medieval.portulanRhumbVisible).toBe(false);
    expect(medieval.graticuleVisible).toBe(false);

    const renaissance = getBasemapFeatureDefaults('renaissance');
    expect(renaissance.portulanRhumbVisible).toBe(false);
    expect(renaissance.graticuleVisible).toBe(false);

    const alIdrisi = getBasemapFeatureDefaults('al_idrisi');
    expect(alIdrisi.portulanRhumbVisible).toBe(false);
    expect(alIdrisi.graticuleVisible).toBe(false);
  });

  it('désactive systématiquement le graticule par défaut même sur les cartes coloniales, physiques et tactiques', () => {
    const colonial = getBasemapFeatureDefaults('colonial');
    expect(colonial.graticuleVisible).toBe(false);
    expect(colonial.portulanRhumbVisible).toBe(false);

    const physical = getBasemapFeatureDefaults('twentieth_century_physical');
    expect(physical.graticuleVisible).toBe(false);
    expect(physical.portulanRhumbVisible).toBe(false);

    const wargames = getBasemapFeatureDefaults('military_tactical_wargames');
    expect(wargames.graticuleVisible).toBe(false);
    expect(wargames.portulanRhumbVisible).toBe(false);

    const julesVerne = getBasemapFeatureDefaults('jules_verne');
    expect(julesVerne.graticuleVisible).toBe(false);
    expect(julesVerne.portulanRhumbVisible).toBe(false);
  });

  it('désactive les rhumbs et le graticule par défaut sur les cartes contemporaines épurées', () => {
    const contemporary = getBasemapFeatureDefaults('contemporary_current');
    expect(contemporary.portulanRhumbVisible).toBe(false);
    expect(contemporary.graticuleVisible).toBe(false);
    expect(contemporary.bordersVisible).toBe(true);

    const satellite = getBasemapFeatureDefaults('contemporary_satellite');
    expect(satellite.portulanRhumbVisible).toBe(false);
    expect(satellite.graticuleVisible).toBe(false);
  });

  it('fournit des palettes graticule lumineuses et contrastées pour les thèmes sombres et satellitaires', () => {
    const darkStyle = getGraticuleStyleForBasemap('contemporary_positron_lite');
    expect(darkStyle.lineColor).toBe('#38bdf8');
    expect(darkStyle.textHaloColor).toContain('0, 0, 0');

    const wargamesStyle = getGraticuleStyleForBasemap('military_tactical_wargames');
    expect(wargamesStyle.lineColor).toBe('#22c55e');
    expect(wargamesStyle.textColor).toBe('#f59e0b');

    const satStyle = getGraticuleStyleForBasemap('contemporary_satellite');
    expect(satStyle.lineColor).toBe('#38bdf8');
    expect(satStyle.textColor).toBe('#ffffff');
    expect(satStyle.textHaloColor).toContain('0, 0, 0');
  });
});

describe('Store UI Actions — Déconnexion par défaut & activation manuelle par l\'utilisateur', () => {
  it('setBasemapStyle conserve toujours portulanRhumbVisible et graticuleVisible à false par défaut', () => {
    let state: any = {
      basemapStyle: 'contemporary_current',
      portulanRhumbVisible: false,
      graticuleVisible: false,
      basemapBordersVisible: true,
    };

    const set = (updater: any) => {
      state = { ...state, ...updater };
    };

    const slice = createUiSlice(set);

    // Passage au Portulan Catalan -> Rhumbs et graticule restent à false
    slice.setBasemapStyle('medieval');
    expect(state.basemapStyle).toBe('medieval');
    expect(state.portulanRhumbVisible).toBe(false);
    expect(state.graticuleVisible).toBe(false);
    expect(state.basemapBordersVisible).toBe(false);

    // Passage aux Grandes Puissances 1914 -> Restent à false
    slice.setBasemapStyle('colonial');
    expect(state.basemapStyle).toBe('colonial');
    expect(state.portulanRhumbVisible).toBe(false);
    expect(state.graticuleVisible).toBe(false);
    expect(state.basemapBordersVisible).toBe(true);

    // Passage à WarGames NORAD 1983 -> Restent à false
    slice.setBasemapStyle('military_tactical_wargames');
    expect(state.basemapStyle).toBe('military_tactical_wargames');
    expect(state.portulanRhumbVisible).toBe(false);
    expect(state.graticuleVisible).toBe(false);
    expect(state.basemapBordersVisible).toBe(true);

    // L'utilisateur coche manuellement le graticule
    slice.setGraticuleVisible(true);
    expect(state.graticuleVisible).toBe(true);

    // Et coche manuellement les rhumbs
    slice.setPortulanRhumbVisible(true);
    expect(state.portulanRhumbVisible).toBe(true);

    // Puis les décoche
    slice.setGraticuleVisible(false);
    expect(state.graticuleVisible).toBe(false);
    slice.setPortulanRhumbVisible(false);
    expect(state.portulanRhumbVisible).toBe(false);
  });
});

describe('MapLibre Layers — Manipulation des calques Graticule & Rhumb', () => {
  let mockMap: any;
  let layers: Record<string, any>;
  let sources: Record<string, any>;

  let repaintCount: number;

  beforeEach(() => {
    layers = {};
    sources = {};
    repaintCount = 0;
    mockMap = {
      isStyleLoaded: () => true,
      getStyle: () => ({ version: 8, layers: [] }),
      getSource: (id: string) => sources[id],
      addSource: (id: string, def: any) => { sources[id] = def; },
      getLayer: (id: string) => layers[id],
      addLayer: (def: any) => { layers[def.id] = { ...def, paint: { ...(def.paint || {}) }, layout: { ...(def.layout || {}) } }; },
      setLayoutProperty: (id: string, prop: string, val: any) => {
        if (layers[id]) {
          layers[id].layout = layers[id].layout || {};
          layers[id].layout[prop] = val;
        }
      },
      setPaintProperty: (id: string, prop: string, val: any) => {
        if (layers[id]) {
          layers[id].paint = layers[id].paint || {};
          layers[id].paint[prop] = val;
        }
      },
      triggerRepaint: () => { repaintCount++; },
      getRepaintCount: () => repaintCount,
      once: (_ev: string, cb: () => void) => cb(),
    };
  });

  it('initColonialGraticuleLayer initialise les calques avec la visibilité et la palette adaptées', () => {
    initColonialGraticuleLayer(mockMap, true, 'military_tactical_wargames');

    expect(mockMap.getLayer('colonial-graticule-lines')).toBeDefined();
    expect(mockMap.getLayer('colonial-graticule-labels')).toBeDefined();
    expect(layers['colonial-graticule-lines'].layout.visibility).toBe('visible');
    expect(layers['colonial-graticule-lines'].paint['line-color']).toBe('#22c55e');

    // Débrayage : masquer dans le menu
    toggleGraticuleGrid(mockMap, false);
    expect(layers['colonial-graticule-lines'].layout.visibility).toBe('none');
    expect(layers['colonial-graticule-labels'].layout.visibility).toBe('none');

    // Réactivation
    toggleGraticuleGrid(mockMap, true);
    expect(layers['colonial-graticule-lines'].layout.visibility).toBe('visible');
    expect(layers['colonial-graticule-labels'].layout.visibility).toBe('visible');
  });

  it('updateGraticuleStyle adapte dynamiquement les teintes du graticule', () => {
    initColonialGraticuleLayer(mockMap, true, 'colonial');
    expect(layers['colonial-graticule-lines'].paint['line-color']).toBe('#784421');

    // Changement de style vers Positron Lite
    updateGraticuleStyle(mockMap, 'contemporary_positron_lite');
    expect(layers['colonial-graticule-lines'].paint['line-color']).toBe('#38bdf8');
    expect(layers['colonial-graticule-labels'].paint['text-halo-color']).toBe('rgba(0, 0, 0, 0.95)');
  });

  it('initRhumbNetworkLayer initialise et permet le débrayage strict via toggleRhumbLines', () => {
    initRhumbNetworkLayer(mockMap, true, undefined, 'medieval');

    expect(mockMap.getLayer('rhumb-lines')).toBeDefined();
    expect(mockMap.getLayer('rhumb-centers')).toBeDefined();
    expect(layers['rhumb-lines'].layout.visibility).toBe('visible');

    // Débrayage menu : masquage des rhumbs
    toggleRhumbLines(mockMap, false);
    expect(layers['rhumb-lines'].layout.visibility).toBe('none');
    expect(layers['rhumb-centers'].layout.visibility).toBe('none');

    // Réactivation
    toggleRhumbLines(mockMap, true);
    expect(layers['rhumb-lines'].layout.visibility).toBe('visible');
    expect(layers['rhumb-centers'].layout.visibility).toBe('visible');

    // Adaptation palette sombre
    updateRhumbPalette(mockMap, 'renaissance', 'military_tactical_wargames');
    expect(layers['rhumb-centers'].paint['circle-stroke-color']).toBe('#22c55e');
  });

  it('auto-répare les calques graticule lorsque la source existe mais que les calques ont été détruits', () => {
    // 1. Initialisation initiale
    initColonialGraticuleLayer(mockMap, true, 'colonial');
    expect(mockMap.getLayer('colonial-graticule-lines')).toBeDefined();

    // 2. Simulation de destruction de calques (ex: changement partiel de style MapLibre)
    delete layers['colonial-graticule-lines'];
    delete layers['colonial-graticule-labels'];
    expect(mockMap.getLayer('colonial-graticule-lines')).toBeUndefined();
    expect(mockMap.getSource('colonial-graticule')).toBeDefined(); // source orpheline

    // 3. Appel de toggleGraticuleGrid(mockMap, true) -> auto-réparation déclenchée
    toggleGraticuleGrid(mockMap, true, 'military_tactical_wargames');
    expect(mockMap.getLayer('colonial-graticule-lines')).toBeDefined();
    expect(mockMap.getLayer('colonial-graticule-labels')).toBeDefined();
    expect(layers['colonial-graticule-lines'].layout.visibility).toBe('visible');
    expect(layers['colonial-graticule-lines'].paint['line-color']).toBe('#22c55e');
  });

  it('auto-répare les calques rhumb lorsque la source existe mais que les calques ont été détruits', () => {
    // 1. Initialisation initiale
    initRhumbNetworkLayer(mockMap, true, undefined, 'medieval');
    expect(mockMap.getLayer('rhumb-lines')).toBeDefined();

    // 2. Destruction des calques en conservant la source
    delete layers['rhumb-lines'];
    delete layers['rhumb-centers'];
    expect(mockMap.getLayer('rhumb-lines')).toBeUndefined();
    expect(mockMap.getSource('rhumb-network-lines')).toBeDefined();

    // 3. Appel de toggleRhumbLines(mockMap, true) -> auto-réparation déclenchée
    toggleRhumbLines(mockMap, true, 'medieval');
    expect(mockMap.getLayer('rhumb-lines')).toBeDefined();
    expect(mockMap.getLayer('rhumb-centers')).toBeDefined();
    expect(layers['rhumb-lines'].layout.visibility).toBe('visible');
  });

  it('positionne les calques graticule et rhumb avec beforeId pour préserver les entités Braudel', () => {
    let addedBeforeId: string | undefined;
    mockMap.addLayer = (def: any, beforeId?: string) => {
      layers[def.id] = { ...def, paint: { ...(def.paint || {}) }, layout: { ...(def.layout || {}) } };
      if (beforeId) addedBeforeId = beforeId;
    };

    // Présence d'un calque d'entité
    layers['braudel-polygons'] = { id: 'braudel-polygons' };

    initColonialGraticuleLayer(mockMap, true, 'colonial');
    expect(addedBeforeId).toBe('braudel-polygons');
  });

  it('gère impeccablement la coche et décoche multiple en 2D comme en 3D (Globe/Pitch) avec rafraîchissement immédiat', () => {
    // Initialisation initiale avec les calques éteints par défaut
    initColonialGraticuleLayer(mockMap, false, 'contemporary_current');
    initRhumbNetworkLayer(mockMap, false, undefined, 'contemporary_current');

    expect(layers['colonial-graticule-lines'].layout.visibility).toBe('none');
    expect(layers['rhumb-lines'].layout.visibility).toBe('none');

    // Cycle multiple coche / décoche Graticule (5 cycles consécutifs)
    for (let i = 0; i < 5; i++) {
      toggleGraticuleGrid(mockMap, true, 'colonial');
      expect(layers['colonial-graticule-lines'].layout.visibility).toBe('visible');
      expect(mockMap.getRepaintCount()).toBeGreaterThan(0);

      toggleGraticuleGrid(mockMap, false, 'colonial');
      expect(layers['colonial-graticule-lines'].layout.visibility).toBe('none');
    }

    // Cycle multiple coche / décoche Rhumbs (5 cycles consécutifs)
    for (let i = 0; i < 5; i++) {
      toggleRhumbLines(mockMap, true, 'medieval');
      expect(layers['rhumb-lines'].layout.visibility).toBe('visible');
      expect(layers['rhumb-centers'].layout.visibility).toBe('visible');

      toggleRhumbLines(mockMap, false, 'medieval');
      expect(layers['rhumb-lines'].layout.visibility).toBe('none');
      expect(layers['rhumb-centers'].layout.visibility).toBe('none');
    }
  });
});
