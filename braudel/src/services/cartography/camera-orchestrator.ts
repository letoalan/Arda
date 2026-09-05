import { StoryCameraTransition, StoryMapState, TransitionProfile } from '../../core/schema/story';
import { getEffectiveStyleBearing } from '../../core/styles.config';
import { mapService } from './map-service';

/**
 * Calcule la distance Haversine en kilomètres entre deux coordonnées [lng, lat].
 */
export function computeDistanceKm(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (coord2[1] - coord1[1]) * (Math.PI / 180);
  const dLon = (coord2[0] - coord1[0]) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1[1] * (Math.PI / 180)) *
      Math.cos(coord2[1] * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Détermine le type de mouvement optimal (jumpTo, easeTo, flyTo, static)
 * selon l'écart géographique et le delta de zoom.
 */
export function selectOptimalTransitionType(
  fromState?: StoryMapState,
  toState?: StoryMapState
): 'static' | 'easeTo' | 'flyTo' | 'jumpTo' {
  if (!fromState || !toState) return 'flyTo';

  const distKm = computeDistanceKm(fromState.center, toState.center);
  const deltaZoom = Math.abs(fromState.zoom - toState.zoom);
  const deltaBearing = Math.abs((fromState.bearing ?? 0) - (toState.bearing ?? 0));
  const deltaPitch = Math.abs((fromState.pitch ?? 0) - (toState.pitch ?? 0));

  // Même cadrage exact (seule la date ou le filtre change)
  if (distKm < 1 && deltaZoom < 0.1 && deltaBearing < 1 && deltaPitch < 1) {
    return 'static';
  }

  // Écart très faible, même région ou simple rotation/inclinaison -> transition linéaire sans dézoom
  if ((distKm < 100 && deltaZoom < 2.0) || (distKm < 1 && (deltaBearing >= 1 || deltaPitch >= 1))) {
    return 'easeTo';
  }

  // Écart ou saut d'échelle extrême -> coupe nette pour éviter les artéfacts
  if (distKm > 5000 || deltaZoom > 8.5) {
    return 'jumpTo';
  }

  // Cas général -> survol parabolique flyTo
  return 'flyTo';
}

/**
 * Renvoie les paramètres pré-configurés associés à un profil de transition.
 */
export function getProfileSettings(profile: TransitionProfile) {
  switch (profile) {
    case 'documentary':
      return { speed: 0.6, curve: 1.6, pauseAfterMs: 1500, easing: 'easeInOut' as const };
    case 'dynamic':
      return { speed: 2.2, curve: 1.1, pauseAfterMs: 400, easing: 'easeOut' as const };
    case 'cut':
      return { speed: 0, curve: 0, pauseAfterMs: 500, easing: 'linear' as const };
    case 'custom':
    case 'standard':
    default:
      return { speed: 1.2, curve: 1.42, pauseAfterMs: 800, easing: 'easeInOut' as const };
  }
}

/**
 * Attend que le canvas MapLibre soit entièrement stabilisé et idle.
 */
export function waitForMapIdle(map: any, timeoutMs: number = 3000): Promise<void> {
  return new Promise((resolve) => {
    if (!map) return resolve();
    if (map.loaded && map.loaded()) return resolve();

    let finished = false;
    const cleanup = () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    };

    const timer = setTimeout(cleanup, timeoutMs);

    map.once('idle', () => {
      clearTimeout(timer);
      cleanup();
    });
  });
}

/**
 * Exécute la transition orchestrée en 5 étapes :
 * 1. Attente préchargement tuiles
 * 2. Exécution du mouvement de caméra (jumpTo / easeTo / flyTo)
 * 3. Événement moveend & attente Map Idle
 * 4. Pause narrative
 */
export async function playSceneTransition(
  map: any,
  transition: StoryCameraTransition,
  fromState: StoryMapState | undefined,
  toState: StoryMapState,
  isExport: boolean = false
): Promise<void> {
  if (!map) return;

  // 1. Préchargement tuiles
  await waitForMapIdle(map, 1500);

  // 2. Détermination des paramètres de vol
  const profileConfig = getProfileSettings(transition.profile);
  const isCutProfile = transition.profile === 'cut';
  const moveType = isCutProfile ? 'jumpTo' : selectOptimalTransitionType(fromState, toState);

  const pauseDuration = transition.pauseAfterMs ?? profileConfig.pauseAfterMs;
  const essential = isExport || transition.reduceMotionPolicy === 'essential-for-export';

  // 3. Exécution de la transition avec résolution canonique du style de fond
  const activeStyle = toState.basemapStyle 
    || (typeof mapService !== 'undefined' && typeof mapService.getCurrentStyleId === 'function' ? mapService.getCurrentStyleId() : undefined)
    || fromState?.basemapStyle;
  const currentBearing = typeof map.getBearing === 'function' ? map.getBearing() : 0;
  const currentPitch = typeof map.getPitch === 'function' ? map.getPitch() : 0;
  const rawTargetBearing = toState.bearing !== undefined ? toState.bearing : currentBearing;
  const targetBearing = getEffectiveStyleBearing(activeStyle, rawTargetBearing);
  const targetPitch = toState.pitch !== undefined ? toState.pitch : currentPitch;

  if (moveType === 'static') {
    // S'assurer que le cadrage exact (centre, zoom, pitch, bearing) est rigoureusement appliqué
    if (typeof map.jumpTo === 'function') {
      map.jumpTo({
        center: toState.center,
        zoom: toState.zoom,
        pitch: targetPitch,
        bearing: targetBearing
      });
    }
  } else if (moveType === 'jumpTo') {
    map.jumpTo({
      center: toState.center,
      zoom: toState.zoom,
      pitch: targetPitch,
      bearing: targetBearing
    });
  } else {
    // flyTo ou easeTo
    const flyOptions: any = {
      center: toState.center,
      zoom: toState.zoom,
      pitch: targetPitch,
      bearing: targetBearing,
      essential
    };

    if (transition.durationMode === 'fixed' && transition.durationMs) {
      flyOptions.duration = transition.durationMs;
    } else {
      flyOptions.speed = transition.speed ?? profileConfig.speed;
      flyOptions.curve = transition.curve ?? profileConfig.curve;
    }

    const movePromise = new Promise((resolve) => {
      map.once('moveend', resolve);
      // Timeout de sécurité au cas où moveend tarde
      setTimeout(resolve, (flyOptions.duration || 4000) + 1000);
    });

    if (moveType === 'easeTo') {
      map.easeTo(flyOptions);
    } else {
      map.flyTo(flyOptions);
    }

    await movePromise;
  }

  // 4. Attente de la stabilisation totale des calques et tuiles
  await waitForMapIdle(map, 2000);

  // 5. Pause narrative post-vol (en prévisualisation interactive uniquement ; en export vidéo, la timeline gère la durée exacte des plans)
  if (!isExport) {
    await new Promise((r) => setTimeout(r, pauseDuration));
  }
}
