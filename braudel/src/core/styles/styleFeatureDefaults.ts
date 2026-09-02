// core/styles/styleFeatureDefaults.ts

import { BasemapStyleId, STYLE_CONFIGS } from '../styles.config';

export interface BasemapFeatureDefaults {
  portulanRhumbVisible: boolean;
  graticuleVisible: boolean;
  bordersVisible: boolean;
}

export interface GraticuleLayerStyle {
  lineColor: string;
  lineOpacity: number;
  lineWidthEquatorPrime: number;
  lineWidthStandard: number;
  textColor: string;
  textHaloColor: string;
  textHaloWidth: number;
}

/**
 * Détermine les réglages par défaut de visibilité pour un style de carte donné.
 * Règle d'or : Par défaut, TOUS les graticules et TOUTES les lignes de rhumb sont désactivés
 * sur l'ensemble des 25 tuiles. L'utilisateur les active manuellement selon ses besoins.
 */
export function getBasemapFeatureDefaults(styleId: BasemapStyleId): BasemapFeatureDefaults {
  const config = STYLE_CONFIGS.find((s) => s.id === styleId);

  // 1. Aucune ligne de rhumb par défaut sur aucune tuile
  const portulanRhumbVisible = false;

  // 2. Aucun graticule (méridiens et parallèles 10°) par défaut sur aucune tuile
  const graticuleVisible = false;

  // 3. Détection des frontières par défaut
  const bordersVisible = config?.bordersVisibleByDefault ?? ![
    'antiquity',
    'medieval',
    'renaissance',
    'modern',
    'al_idrisi',
    'jules_verne',
    'tolkien_high_fantasy',
    'tolkien_light_fantasy',
    'tolkien_dark_fantasy',
  ].includes(styleId);

  return {
    portulanRhumbVisible,
    graticuleVisible,
    bordersVisible,
  };
}

/**
 * Calcule la palette chromatique optimisée pour le graticule vectoriel 10°
 * selon le style cartographique actif afin de garantir un contraste et une lisibilité parfaits.
 */
export function getGraticuleStyleForBasemap(styleId: BasemapStyleId): GraticuleLayerStyle {
  const config = STYLE_CONFIGS.find((s) => s.id === styleId);

  // Si le style déclare explicitement une configuration de graticule
  if (config?.graticule) {
    const isDarkTheme = [
      'military_tactical_wargames',
      'journalism_electro_80s',
      'contemporary_positron_lite',
      'nasa_night_lights',
      'futuristic',
      'futuristic_cyberpunk_neon',
      'futuristic_space_opera',
      'tolkien_dark_fantasy',
    ].includes(styleId);

    return {
      lineColor: config.graticule.color || '#5c3a21',
      lineOpacity: config.graticule.opacity ?? 0.45,
      lineWidthEquatorPrime: 1.5,
      lineWidthStandard: 0.8,
      textColor: config.graticule.labelColor || config.graticule.color || '#5c3a21',
      textHaloColor: isDarkTheme ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.9)',
      textHaloWidth: 1.5,
    };
  }

  // Configuration contextuelle par catégorie de thème
  switch (styleId) {
    // ── Thèmes sombres & tactiques ──
    case 'contemporary_positron_lite':
      return {
        lineColor: '#38bdf8',
        lineOpacity: 0.4,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.75,
        textColor: '#38bdf8',
        textHaloColor: 'rgba(0, 0, 0, 0.95)',
        textHaloWidth: 1.5,
      };

    case 'military_tactical_wargames':
      return {
        lineColor: '#22c55e',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.6,
        lineWidthStandard: 0.8,
        textColor: '#f59e0b',
        textHaloColor: 'rgba(0, 0, 0, 0.95)',
        textHaloWidth: 1.5,
      };

    case 'nasa_night_lights':
      return {
        lineColor: '#fbbf24',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.75,
        textColor: '#fbbf24',
        textHaloColor: 'rgba(0, 0, 0, 0.95)',
        textHaloWidth: 1.5,
      };

    case 'journalism_electro_80s':
      return {
        lineColor: '#06b6d4',
        lineOpacity: 0.5,
        lineWidthEquatorPrime: 1.6,
        lineWidthStandard: 0.85,
        textColor: '#f472b6',
        textHaloColor: 'rgba(15, 23, 42, 0.95)',
        textHaloWidth: 1.5,
      };

    case 'futuristic':
      return {
        lineColor: '#00f3ff',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.8,
        textColor: '#00f3ff',
        textHaloColor: 'rgba(10, 14, 23, 0.95)',
        textHaloWidth: 1.5,
      };

    case 'futuristic_cyberpunk_neon':
      return {
        lineColor: '#ff007f',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.8,
        textColor: '#ff007f',
        textHaloColor: 'rgba(10, 14, 23, 0.95)',
        textHaloWidth: 1.5,
      };

    case 'futuristic_space_opera':
      return {
        lineColor: '#93c5fd',
        lineOpacity: 0.4,
        lineWidthEquatorPrime: 1.4,
        lineWidthStandard: 0.75,
        textColor: '#93c5fd',
        textHaloColor: 'rgba(10, 14, 23, 0.95)',
        textHaloWidth: 1.5,
      };

    case 'tolkien_dark_fantasy':
      return {
        lineColor: '#dc2626',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.75,
        textColor: '#ef4444',
        textHaloColor: 'rgba(0, 0, 0, 0.95)',
        textHaloWidth: 1.5,
      };

    // ── Thèmes satellitaires & imagerie ──
    case 'contemporary_satellite':
    case 'realistic_satellite':
      return {
        lineColor: '#38bdf8',
        lineOpacity: 0.65,
        lineWidthEquatorPrime: 1.6,
        lineWidthStandard: 0.9,
        textColor: '#ffffff',
        textHaloColor: 'rgba(0, 0, 0, 0.95)',
        textHaloWidth: 2.0,
      };

    // ── Thèmes Atlas, Hypsométriques & Presse ──
    case 'twentieth_century_physical':
      return {
        lineColor: '#3b6e8c',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.8,
        textColor: '#1d4863',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'contemporary_national_geographic':
      return {
        lineColor: '#854d0e',
        lineOpacity: 0.4,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.75,
        textColor: '#78350f',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'cnn_broadcast_90s_00s':
      return {
        lineColor: '#d97706',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.8,
        textColor: '#b45309',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'military_staff_ww1_ww2':
      return {
        lineColor: '#991b1b',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.8,
        textColor: '#991b1b',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'modern':
      return {
        lineColor: '#555555',
        lineOpacity: 0.4,
        lineWidthEquatorPrime: 1.4,
        lineWidthStandard: 0.75,
        textColor: '#333333',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'colonial':
      return {
        lineColor: '#784421',
        lineOpacity: 0.4,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.8,
        textColor: '#784421',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'jules_verne':
      return {
        lineColor: '#7a5a3a',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.8,
        textColor: '#5c3d24',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'al_idrisi':
      return {
        lineColor: '#8b6f2f',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.8,
        textColor: '#7a5a2f',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'medieval':
      return {
        lineColor: '#7a4a20',
        lineOpacity: 0.55,
        lineWidthEquatorPrime: 1.6,
        lineWidthStandard: 0.9,
        textColor: '#5c2a1a',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'renaissance':
      return {
        lineColor: '#855a2a',
        lineOpacity: 0.55,
        lineWidthEquatorPrime: 1.6,
        lineWidthStandard: 0.9,
        textColor: '#6b421a',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'antiquity':
      return {
        lineColor: '#8b5a2b',
        lineOpacity: 0.55,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.85,
        textColor: '#6b4226',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'journalism_60s_70s':
      return {
        lineColor: '#334155',
        lineOpacity: 0.4,
        lineWidthEquatorPrime: 1.4,
        lineWidthStandard: 0.75,
        textColor: '#1e293b',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'tolkien_high_fantasy':
      return {
        lineColor: '#5c3a21',
        lineOpacity: 0.45,
        lineWidthEquatorPrime: 1.5,
        lineWidthStandard: 0.8,
        textColor: '#5c3a21',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    case 'tolkien_light_fantasy':
      return {
        lineColor: '#854d0e',
        lineOpacity: 0.4,
        lineWidthEquatorPrime: 1.4,
        lineWidthStandard: 0.75,
        textColor: '#78350f',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };

    // ── Défaut contemporain clair (OpenStreetMap Voyager) ──
    case 'contemporary_current':
    default:
      return {
        lineColor: '#475569',
        lineOpacity: 0.4,
        lineWidthEquatorPrime: 1.4,
        lineWidthStandard: 0.75,
        textColor: '#334155',
        textHaloColor: 'rgba(255, 255, 255, 0.9)',
        textHaloWidth: 1.5,
      };
  }
}
