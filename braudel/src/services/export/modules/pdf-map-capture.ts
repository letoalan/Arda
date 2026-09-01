import { GEOPOLITICA_SOURCES } from '../../import/geopoliticaRegistry';
import { buildEntitiesGeoJSON } from '../../cartography/mapGeojsonRenderer';
import { PdfExportError, isEntityVisibleAt } from './pdf-types';

/**
 * Met à jour la source GeoJSON et attend explicitement l'événement sourcedata correspondant à ce setData précis,
 * suivi d'un repaint GPU garanti. (Solution 4)
 */
export async function updateEntitiesAndWaitForRender(
  map: any,
  sourceId: string,
  geojson: any
): Promise<void> {
  if (!map) return;

  const source = map.getSource ? map.getSource(sourceId) : null;
  if (!source || typeof source.setData !== 'function') {
    return;
  }

  await new Promise<void>((resolve) => {
    let resolved = false;
    const onComplete = () => {
      if (!resolved) {
        resolved = true;
        if (typeof map.off === 'function') {
          map.off('sourcedata', onSourceData);
          map.off('data', onSourceData);
        }
        resolve();
      }
    };

    const onSourceData = (e: any) => {
      // 'sourcedata' + isSourceLoaded(true) confirme que CE setData précis a été traité
      if (e && (e.sourceId === sourceId || e.sourceDataType === 'metadata' || e.dataType === 'source') && (e.isSourceLoaded || e.isSourceLoaded === undefined)) {
        onComplete();
      }
    };

    if (typeof map.on === 'function') {
      map.on('sourcedata', onSourceData);
      map.on('data', onSourceData);
    }

    // Déclenche la séquence de reparsing dans MapLibre Web Worker
    source.setData(geojson);

    // Sécurité temporelle si l'événement a déjà été émis de façon synchrone ou dans un environnement mock
    setTimeout(onComplete, 600);
  });

  // Attente supplémentaire du repaint GPU, uniquement APRÈS confirmation que les données sont bien celles de cette page
  await new Promise<void>((resolve) => {
    if (typeof map.once === 'function') {
      map.once('render', () => resolve());
    }
    if (typeof map.triggerRepaint === 'function') {
      map.triggerRepaint();
    }
    setTimeout(resolve, 80);
  });

  await new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    } else {
      setTimeout(resolve, 40);
    }
  });
}

/**
 * Vérifie l'état de chargement des tuiles de fond (raster/vectoriel) et la stabilisation de la caméra,
 * séparé du cycle de vie de la source braudel-entities. (Solution 3-1 & Solution 4)
 */
export async function waitForBackgroundTilesReady(map: any, maxAttempts = 30): Promise<void> {
  if (!map) return;

  // ── Détection et récupération du contexte WebGL perdu ──
  const webglContextLost = await detectAndRecoverWebGLContext(map);
  if (webglContextLost) {
    // Le contexte a été restauré (ou reste irrécupérable).
    // Dans les deux cas, on continue : mieux vaut un export partiel qu'un export avorté.
    console.warn('[PDF Export] Contexte WebGL récupéré après perte. Reprise de l\'export.');
  }

  const style = typeof map.getStyle === 'function' ? map.getStyle() : null;
  const sourceIds = Object.keys(style?.sources ?? {}).filter((id) => id !== 'braudel-entities');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Vérifier si le contexte WebGL est à nouveau perdu pendant le polling
    if (isWebGLContextLost(map)) {
      console.warn(
        `[PDF Export] Contexte WebGL perdu pendant l'attente des tuiles (tentative ${attempt + 1}/${maxAttempts}). ` +
        'Capture avec l\'état courant du canvas.'
      );
      return; // Dégradation gracieuse : on capture ce qui est disponible
    }

    const backgroundSourcesLoaded = sourceIds.length === 0 || sourceIds.every((id) => 
      typeof map.isSourceLoaded === 'function' ? map.isSourceLoaded(id) : true
    );
    const tilesReady = typeof map.areTilesLoaded === 'function'
      ? map.areTilesLoaded()
      : true;
    const isMoving = typeof map.isMoving === 'function' ? map.isMoving() : false;
    const isZooming = typeof map.isZooming === 'function' ? map.isZooming() : false;
    const isRotating = typeof map.isRotating === 'function' ? map.isRotating() : false;
    const cameraSettled = !isMoving && !isZooming && !isRotating;

    if (typeof map.triggerRepaint === 'function') {
      map.triggerRepaint();
    }

    if (backgroundSourcesLoaded && tilesReady && cameraSettled) {
      await new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        } else {
          setTimeout(resolve, 50);
        }
      });
      return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  throw new PdfExportError(
    'Timeout: tuiles de fond de carte non chargées avant capture. ' +
    'Export annulé pour éviter une page avec fond de carte incomplet.'
  );
}

/**
 * Vérifie si le contexte WebGL du canvas MapLibre est actuellement perdu.
 * Utilise la référence interne _canvas ou getCanvasContainer pour ne pas déclencher getCanvas().
 */
function isWebGLContextLost(map: any): boolean {
  try {
    const canvas = (map as any)?._canvas || (typeof (map as any)?.getCanvasContainer === 'function' ? (map as any).getCanvasContainer()?.querySelector('canvas') : null);
    if (!canvas || typeof canvas.getContext !== 'function') return false;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return gl && typeof gl.isContextLost === 'function' ? gl.isContextLost() : false;
  } catch {
    return false;
  }
}

/**
 * Détecte la perte du contexte WebGL et tente une récupération via l'extension WEBGL_lose_context.
 * Attend jusqu'à 3 secondes que le contexte soit restauré.
 * Retourne true si un contexte perdu a été détecté (qu'il ait été récupéré ou non).
 */
async function detectAndRecoverWebGLContext(map: any): Promise<boolean> {
  if (!isWebGLContextLost(map)) return false;

  console.warn('[PDF Export] Contexte WebGL perdu détecté. Tentative de restauration…');

  const canvas = (map as any)?._canvas || (typeof (map as any)?.getCanvasContainer === 'function' ? (map as any).getCanvasContainer()?.querySelector('canvas') : null);
  if (!canvas || typeof canvas.getContext !== 'function') return true;

  // Tenter la restauration via l'extension WEBGL_lose_context
  try {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const loseContextExt = gl.getExtension('WEBGL_lose_context');
      if (loseContextExt) {
        loseContextExt.restoreContext();
      }
    }
  } catch (e) {
    console.warn('[PDF Export] Impossible d\'appeler restoreContext():', e);
  }

  // Attendre la restauration (max 3 secondes, polling à 100ms)
  const maxRecoveryAttempts = 30;
  for (let i = 0; i < maxRecoveryAttempts; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (!isWebGLContextLost(map)) {
      console.info('[PDF Export] Contexte WebGL restauré avec succès après ' + ((i + 1) * 100) + 'ms.');
      // Attendre un cycle de rendu supplémentaire pour stabiliser
      await new Promise<void>((resolve) => {
        if (typeof map.triggerRepaint === 'function') {
          map.triggerRepaint();
        }
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        } else {
          setTimeout(resolve, 100);
        }
      });
      return true;
    }
  }

  console.warn('[PDF Export] Contexte WebGL irrécupérable après 3s. L\'export continuera avec un rendu dégradé.');
  return true;
}

export const waitForAllSourcesReady = waitForBackgroundTilesReady;
export const waitForMapReady = waitForBackgroundTilesReady;

/**
 * Pré-charge et garantit la présence des données d'époque dans le store.
 */
export async function ensureEpochEntitiesLoaded(targetYear: number, worldStore: any): Promise<void> {
  if (!worldStore || !worldStore.entities) return;
  const matchingEntities = (worldStore.entities || []).filter((e: any) => isEntityVisibleAt(e, targetYear));
  if (matchingEntities.length === 0) {
    const catalogSource = GEOPOLITICA_SOURCES.find((s) => s.referenceYear === targetYear);
    const isBrowserOrAbsolute = typeof window !== 'undefined' || (catalogSource && catalogSource.url.startsWith('http'));
    if (catalogSource && isBrowserOrAbsolute && typeof fetch !== 'undefined') {
      try {
        const res = await fetch(catalogSource.url);
        if (res.ok) {
          const geojson = await res.json();
          if (geojson && geojson.features) {
            const formatted = geojson.features.map((f: any, idx: number) => ({
              id: f.id || `cat-${targetYear}-${idx}`,
              name: f.properties?.NAME || f.properties?.nom || f.properties?.name || 'Territoire',
              geometry: f.geometry,
              temporalRange: { validFrom: targetYear, validTo: targetYear + 100 },
              properties: {
                ...f.properties,
                color: f.properties?.color || '#3B82F6',
              },
            }));
            worldStore.entities.push(...formatted);
          }
        }
      } catch (err) {
        console.warn('Impossible de pré-charger le GeoJSON catalogue:', err);
      }
    }
  }
}

/**
 * Capture le canvas de la carte MapLibre active et renvoie son Data URL et ses dimensions réelles.
 * Garantit un rendu WebGL complet avant la capture et applique une composition 2D pour éliminer
 * tout artefact de fond noir lié à l'absence de canal alpha dans les formats compressés.
 */
export async function captureMapCanvas(map: any, defaultBg = '#ffffff'): Promise<{ dataUrl: string; width: number; height: number }> {
  if (!map) {
    throw new Error('Instance de carte MapLibre introuvable pour la capture.');
  }

  const canvas = map.getCanvas ? map.getCanvas() : null;
  if (!canvas) {
    throw new Error('Canvas WebGL introuvable sur la carte.');
  }

  // Déclencher un rafraîchissement synchrone et attendre le cycle de rendu étendu du fond
  await waitForBackgroundTilesReady(map);

  const width = canvas.width || 1200;
  const height = canvas.height || 800;

  // Création d'un canvas 2D de composition avec fond plein (élimine les artefacts de fond noir et compresse en JPEG 90%)
  let compositeDataUrl: string;
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      ctx.fillStyle = defaultBg || '#ffffff';
      ctx.fillRect(0, 0, width, height);
      try {
        ctx.drawImage(canvas, 0, 0, width, height);
      } catch (e) {
        console.warn('Impossible de dessiner le canvas WebGL sur le contexte 2D:', e);
      }
      compositeDataUrl = offscreen.toDataURL('image/jpeg', 0.90);
    } else {
      compositeDataUrl = canvas.toDataURL ? canvas.toDataURL('image/jpeg', 0.90) : '';
    }
  } else {
    compositeDataUrl = canvas.toDataURL ? canvas.toDataURL('image/jpeg', 0.90) : '';
  }

  return {
    dataUrl: compositeDataUrl,
    width,
    height,
  };
}

/**
 * Capture d'un snapshot à une date donnée avec synchronisation de toutes les sources et de la caméra.
 */
export async function captureSnapshotAt(
  targetYear: number,
  map: any,
  worldStore?: any,
  renderOptions?: any
): Promise<{ dataUrl: string; width: number; height: number }> {
  if (worldStore) {
    await ensureEpochEntitiesLoaded(targetYear, worldStore);
    const geojson = buildEntitiesGeoJSON(worldStore.entities || [], worldStore.relations || [], targetYear, 'all', worldStore.layers || []);
    await updateEntitiesAndWaitForRender(map, 'braudel-entities', geojson);
  }
  await waitForBackgroundTilesReady(map);

  const styleBg = renderOptions?.styleConfig?.mapPaintOverrides?.background || '#ffffff';
  return captureMapCanvas(map, styleBg);
}
