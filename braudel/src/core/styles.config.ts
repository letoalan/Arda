// styles.config.ts

import { REAL_STYLE_CONFIGS } from './styles/realStyles';
import { FANTASY_STYLE_CONFIGS } from './styles/fantasyStyles';

export interface StyleTextureConfig {
  blendMode: 'multiply' | 'overlay' | 'soft-light' | 'screen' | 'color-burn';
  opacity: number;
  svgFilterId?: string;          // Référence vers un <filter> SVG défini dans le DOM
  radialVignette?: { inner: string; outer: string; };
  noisePattern?: { frequency: number; octaves: number; };
  borderColor?: string;
  borderWidth?: number;
}

export interface StyleRhumbConfig {
  enabled: boolean;
  preset?: 'medieval' | 'renaissance' | 'custom';
  centers?: [number, number][];   // Coordonnées des roses des vents [lng, lat]
  rayCount?: number;              // 16 ou 32 par défaut
  colors?: string[];              // Alternance de couleurs
  radiusKm?: number;
  lineWidth?: number;
  labels?: string[];             // Noms de vents (Tramontane, Levant...)
}

export type BasemapStyleId =
  | 'antiquity' | 'medieval' | 'renaissance' | 'modern' | 'colonial' | 'al_idrisi' | 'jules_verne' | 'twentieth_century_physical'
  | 'journalism_60s_70s' | 'military_staff_ww1_ww2' | 'military_tactical_wargames' | 'journalism_electro_80s' | 'cnn_broadcast_90s_00s'
  | 'futuristic' | 'contemporary_current' | 'contemporary_satellite' | 'nasa_night_lights'
  | 'contemporary_national_geographic' | 'contemporary_positron_lite'
  | 'futuristic_cyberpunk_neon' | 'futuristic_space_opera'
  | 'tolkien_high_fantasy' | 'tolkien_light_fantasy' | 'tolkien_dark_fantasy'
  | 'realistic_satellite';

export interface StyleConfig {
  id: BasemapStyleId;
  name: string;
  era: string;
  bearing: number;               // Rotation (0 = Nord en haut)
  bordersVisibleByDefault: boolean;
  mapStyleUrl: string;           // URL du fond de carte MapLibre
  texture: StyleTextureConfig;
  rhumbLines?: StyleRhumbConfig;
  deformation?: {                // Pour Peutinger (Antiquité)
    scaleY: number;
    overflow?: 'scroll' | 'hidden';
  };
  engravingFilter?: boolean;     // Pour Moderne (gravure cuivre)
  terraIncognita?: {             // Pour Colonial
    enabled: boolean;
    regions: string[];           // IDs GeoJSON des zones "inconnues"
    labels: string[];
  };
  empireColors?: {               // Pour Colonial
    british: string;
    french: string;
    portuguese: string;
    neutral: string;
  };
  scanlines?: {                  // Pour Futuriste
    enabled: boolean;
    speed: number;
    opacity: number;
    color: string;
  };
  glowPulse?: {                  // Pour Futuriste
    enabled: boolean;
    color: string;
    interval: number;
  };
  glassmorphism?: boolean;       // Pour Futuriste
  graticule?: {                  // Pour Colonial (grille méridiens/parallèles)
    enabled: boolean;
    step: number;                // Pas en degrés (ex: 20)
    color: string;
    opacity: number;
    labelColor?: string;
  };
  mapPaintOverrides?: {          // Recoloration dynamique des couches MapLibre
    background?: string;
    water?: string;
    landcover?: string;
    borderColor?: string;
    hillshadeShadow?: string;
    hillshadeHighlight?: string;
    hillshadeAccent?: string;
    hillshadeExaggeration?: number;
  };
  demEnabled?: boolean;
  demExaggeration?: number;
  demUrl?: string;
  fontFamily: string;
  decorativeBorder?: 'crane' | 'baroque' | 'rinceaux' | 'circuit' | null;
  labelLanguage?: 'la' | 'ar' | 'fr' | 'en';
  /** Controls which world mode can use this style. 'braudel' = real only, 'tolkien' = fictional only, 'both' = available everywhere */
  mode: 'braudel' | 'tolkien' | 'both';
}

export const STYLE_CONFIGS: StyleConfig[] = [
  ...REAL_STYLE_CONFIGS,
  ...FANTASY_STYLE_CONFIGS
];

/**
 * Résout le cap (bearing) effectif d'un plan ou d'une scène cartographique.
 * Garantit que les styles avec orientation historique spécifique (notamment Al-Idrisi à 180° Sud en haut)
 * conservent scrupuleusement leur cap même si un bearing par défaut à 0° ou undefined a été transmis.
 */
export function getEffectiveStyleBearing(styleId?: string, explicitBearing?: number): number {
  const isAlIdrisi = styleId === 'al_idrisi' || (typeof styleId === 'string' && styleId.toLowerCase().includes('idrisi'));
  if (isAlIdrisi) {
    // Pour Al-Idrisi, si le bearing est indéfini ou remis à 0 par défaut, forcer le 180° Sud en haut
    if (explicitBearing === undefined || explicitBearing === 0) {
      return 180;
    }
    return explicitBearing;
  }

  if (typeof explicitBearing === 'number') {
    return explicitBearing;
  }

  if (styleId) {
    const cfg = STYLE_CONFIGS.find(s => s.id === styleId);
    if (cfg && typeof cfg.bearing === 'number') {
      return cfg.bearing;
    }
  }

  return 0;
}

