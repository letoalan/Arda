// src/services/cartography/eckertProjService.ts

import {
  initProj,
  buildTransformer,
  transformPoint as backprojTransformPoint,
  inverseTransformPoint as backprojInverseTransformPoint,
  transformCoords as backprojTransformCoords,
  reprojectGeoJSON as backprojReprojectGeoJSON,
  shutdownTileWorkers,
  type Transformer
} from 'backproj';
import { reprojectStyle, type ReprojectResult } from 'maplibre-proj';
import type { StyleSpecification } from 'maplibre-gl';

/**
 * Identifiant officiel CRS pour Eckert IV (ESRI:54012).
 * Formule PROJ : +proj=eck4 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs
 */
export const ECKERT_IV_CRS = 'ESRI:54012';

class EckertProjService {
  private transformer: Transformer | null = null;
  private initPromise: Promise<Transformer> | null = null;
  private currentReprojectResult: ReprojectResult | null = null;

  /**
   * Initialise le runtime PROJ WebAssembly et compile le transformateur pour Eckert IV.
   * Cette méthode est idempotente et thread-safe.
   */
  public async init(): Promise<Transformer> {
    if (this.transformer) {
      return this.transformer;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      await initProj();
      const t = await buildTransformer(ECKERT_IV_CRS);
      this.transformer = t;
      return t;
    })();

    return this.initPromise;
  }

  /**
   * Retourne le transformateur actuellement en cache ou null s'il n'est pas encore initialisé.
   */
  public getTransformer(): Transformer | null {
    return this.transformer;
  }

  /**
   * Transforme une coordonnée réelle WGS84 [lon, lat] en coordonnée fake Mercator
   * attendue par le moteur de rendu MapLibre sous projection Eckert IV.
   */
  public async realToFakeMercator(coord: [number, number]): Promise<[number, number]> {
    const t = await this.init();
    return backprojTransformPoint(coord, t);
  }

  /**
   * Transforme une coordonnée fake Mercator issue d'un événement MapLibre (clic, queryRenderedFeatures)
   * en coordonnée géographique réelle WGS84 [lon, lat].
   */
  public async fakeMercatorToReal(coord: [number, number]): Promise<[number, number]> {
    const t = await this.init();
    return backprojInverseTransformPoint(coord, t);
  }

  /**
   * Transforme un tableau de coordonnées réelles WGS84 en coordonnées fake Mercator par lot.
   */
  public async transformCoordinates(coords: [number, number][]): Promise<[number, number][]> {
    const t = await this.init();
    return backprojTransformCoords(coords, t);
  }

  /**
   * Reprojette une collection ou un objet GeoJSON complet vers Eckert IV (fake Mercator).
   */
  public async reprojectGeoJSON<T = any>(geojson: T): Promise<T> {
    const t = await this.init();
    return backprojReprojectGeoJSON(geojson as any, t) as Promise<T>;
  }

  /**
   * Reprojette un style complet MapLibre GL JS vers Eckert IV en utilisant maplibre-proj.
   * Conserve et réutilise le transformateur compilé pour éviter des recalculs lourds.
   */
  public async reprojectMapStyle(
    style: StyleSpecification,
    options?: { tileBoundaries?: boolean }
  ): Promise<ReprojectResult> {
    const t = await this.init();
    
    // Nettoyer l'ancien handler de protocole si nécessaire
    if (this.currentReprojectResult) {
      try {
        this.currentReprojectResult.cleanup();
      } catch (e) {
        console.warn('[EckertProjService] Erreur lors du nettoyage du protocole précédent:', e);
      }
    }

    const result = await reprojectStyle({
      style,
      crs: ECKERT_IV_CRS,
      transformer: t,
      tileBoundaries: options?.tileBoundaries ?? false
    });

    this.currentReprojectResult = result;
    return result;
  }

  /**
   * Libère les ressources du pool de workers et ferme les protocoles personnalisés.
   */
  public async shutdown(): Promise<void> {
    if (this.currentReprojectResult) {
      try {
        this.currentReprojectResult.cleanup();
      } catch (_) {}
      this.currentReprojectResult = null;
    }
    this.transformer = null;
    this.initPromise = null;
    try {
      await shutdownTileWorkers();
    } catch (e) {
      console.warn('[EckertProjService] Erreur lors du shutdown:', e);
    }
  }
}

export const eckertProjService = new EckertProjService();
