// utils/demColors.ts

import { STYLE_CONFIGS } from '../core/styles.config';

export function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.max(0, Math.min(255, Math.round(r * (1 + percent))));
  g = Math.max(0, Math.min(255, Math.round(g * (1 + percent))));
  b = Math.max(0, Math.min(255, Math.round(b * (1 + percent))));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function blendColors(hex1: string, hex2: string, ratio: number): string {
  const num1 = parseInt(hex1.replace('#', ''), 16);
  const num2 = parseInt(hex2.replace('#', ''), 16);

  const r1 = (num1 >> 16) & 255;
  const g1 = (num1 >> 8) & 255;
  const b1 = num1 & 255;

  const r2 = (num2 >> 16) & 255;
  const g2 = (num2 >> 8) & 255;
  const b2 = num2 & 255;

  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getColorForElevation(elevation: number, styleId: string, lat: number = 0): [number, number, number] {
  const hexToRgb = (hex: string): [number, number, number] => {
    const num = parseInt(hex.replace('#', ''), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  if (styleId === 'realistic_satellite') {
    if (elevation < 0) {
      if (elevation < -2000) return hexToRgb('#0a2138');
      if (elevation < -200) return hexToRgb('#1c4966');
      return hexToRgb('#3d7a8c');
    } else {
      if (elevation < 40) return hexToRgb('#7a9456');
      if (elevation < 120) return hexToRgb('#a08d5c');
      if (elevation < 250) return hexToRgb('#8a7355');
      if (elevation < 300) return hexToRgb('#a8a296');
      return hexToRgb('#e6e2da');
    }
  }

  if (styleId === 'tolkien_high_fantasy') {
    if (elevation < 0) {
      if (elevation < -100) return hexToRgb('#0a1830');
      return hexToRgb('#123a5c');
    } else {
      if (elevation < 40) return hexToRgb('#8a9a6e');
      if (elevation < 120) return hexToRgb('#6f7a4f');
      if (elevation < 250) return hexToRgb('#5a4a3a');
      return hexToRgb('#e8e4de');
    }
  }

  if (styleId === 'tolkien_light_fantasy') {
    const isTropical = Math.abs(lat) < 23.5;
    if (elevation < 0) {
      if (isTropical) {
        if (elevation < -100) return hexToRgb('#1d7074');
        return hexToRgb('#33a1a6');
      } else {
        if (elevation < -100) return hexToRgb('#1a4d5c');
        return hexToRgb('#2d6b7a');
      }
    } else {
      if (elevation < 40) return hexToRgb('#d8d2b8');
      if (elevation < 120) return hexToRgb('#a8bb8a');
      if (elevation < 250) return hexToRgb('#7a9060');
      return hexToRgb('#fbfdfa');
    }
  }

  if (styleId === 'tolkien_dark_fantasy') {
    if (elevation < 0) {
      if (elevation < -100) return hexToRgb('#0d0f14');
      return hexToRgb('#1a1f28');
    } else {
      if (elevation < 40) return hexToRgb('#3a3230');
      if (elevation < 120) return hexToRgb('#2e2929');
      if (elevation < 280) return hexToRgb('#241d1a');
      return hexToRgb('#990000');
    }
  }

  if (styleId === 'al_idrisi') {
    if (elevation < 0) {
      if (elevation < -100) return hexToRgb('#164673');
      return hexToRgb('#1d65a6');
    } else {
      if (elevation < 40) return hexToRgb('#f0e2b6');
      if (elevation < 120) return hexToRgb('#d9ba79');
      if (elevation < 250) return hexToRgb('#b84028');
      return hexToRgb('#8a2512');
    }
  }

  if (styleId === 'antiquity') {
    if (elevation < 0) {
      if (elevation < -100) return hexToRgb('#065f46');
      return hexToRgb('#047857');
    } else {
      if (elevation < 40) return hexToRgb('#fed7aa');
      if (elevation < 120) return hexToRgb('#f97316');
      if (elevation < 250) return hexToRgb('#c2410c');
      return hexToRgb('#7c2d12');
    }
  }

  if (styleId === 'nasa_night_lights') {
    if (elevation < 0) {
      if (elevation < -100) return hexToRgb('#030712');
      return hexToRgb('#0b1329');
    } else {
      if (elevation < 40) return hexToRgb('#111827');
      if (elevation < 120) return hexToRgb('#1f2937');
      if (elevation < 250) return hexToRgb('#374151');
      return hexToRgb('#f59e0b');
    }
  }

  // Fallback to StyleConfig or Default
  const config = STYLE_CONFIGS.find(s => s.id === styleId);
  const baseColor = config?.mapPaintOverrides?.landcover || '#e0d8c3';
  const seaColor = config?.mapPaintOverrides?.water || '#a5c9eb';

  if (elevation < 0) {
    return hexToRgb(seaColor);
  }

  const factor = Math.min(1, elevation / 1500);
  const hex = blendColors(baseColor, '#8b5a2b', factor);
  return hexToRgb(hex);
}
