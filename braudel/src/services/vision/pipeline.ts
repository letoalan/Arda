// braudel/src/services/vision/pipeline.ts
import { preprocessSketchImage } from './preprocess';
import { vectorizeSamMask } from './vectorize';
import { guideRegions, labelPolygons } from './lmStudioClient';
import { RawShapeInput } from '../../acquisition/types';

export interface VisionPipelineOptions {
  userInstruction: string;
}

/**
 * Orchestrateur côté client pour le pipeline vision V3 (Local LM Studio + Remote SAM2).
 */
export async function runVisionPipeline(file: File, options: VisionPipelineOptions): Promise<RawShapeInput[]> {
  try {
    // Phase 1 : Nettoyage image
    const imageBase64 = await preprocessSketchImage(file);

    // Phase 2 : Guide (LM Studio Local)
    let guideData;
    try {
      guideData = await guideRegions(imageBase64, options.userInstruction);
    } catch (err: any) {
      console.warn("Échec de LM Studio (guideRegions). Fallback vers V1 possible.", err);
      throw new Error(`LM_STUDIO_OFFLINE: ${err.message}`);
    }

    const regions = guideData.regions?.filter((r: any) => !r.ignore) || [];

    if (regions.length === 0) {
      throw new Error("L'IA n'a détecté aucune région pertinente sur l'image.");
    }

    // Phase 3 & 4 : Segmentation fine (SAM2 distant ou Potrace local si SAM2 indisponible)
    const allShapes: RawShapeInput[] = [];

    // Tenter la segmentation SAM2 si disponible
    for (const region of regions) {
      try {
        const res = await fetch('/api/vision/segment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, hint_point: region.hint_point })
        });
        
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (data.mask_base64) {
              const shapes = await vectorizeSamMask(data.mask_base64);
              allShapes.push(...shapes);
            }
          }
        }
      } catch (err) {
        console.warn("Échec de l'appel au service SAM2 distant.", err);
      }
    }

    // Si SAM2 n'a pas pu extraire de masques (dev local ou absence de SAM2),
    // au lieu de créer un rectangle géant avec la BBox, on vectorise l'image avec Potrace
    // pour récupérer CHAQUE contour/continent/île individuel(le) du croquis.
    if (allShapes.length === 0) {
      console.info("Utilisation du fallback de vectorisation locale Potrace sur le croquis...");
      const { potraceStrategy } = await import('../../acquisition/auto-vectorize/potraceStrategy');
      
      const imgData = await new Promise<ImageData>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error("Erreur de contexte canvas 2D"));
          ctx.drawImage(img, 0, 0);
          resolve(ctx.getImageData(0, 0, img.width, img.height));
        };
        img.onerror = () => reject(new Error("Erreur de chargement image"));
        img.src = imageBase64;
      });

      const extracted = await potraceStrategy(imgData, { threshold: 128 });
      
      // Filtrer le bruit : ignorer les lettres isolées et hachures minuscules (< 25px de large/haut)
      const mainShapes = extracted.filter(shape => {
        if (!shape.points || shape.points.length < 8) return false;
        const xs = shape.points.map(p => p.x);
        const ys = shape.points.map(p => p.y);
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);
        return width >= 25 && height >= 25;
      });

      allShapes.push(...mainShapes);
    }

    // Phase 5 : Label (LM Studio Local)
    try {
      const labelsData = await labelPolygons(allShapes, imageBase64);
      
      allShapes.forEach((shape, index) => {
        const labelInfo = labelsData[index];
        if (labelInfo) {
          shape.name = labelInfo.name;
          if (labelInfo.type) {
            shape.featureKind = labelInfo.type;
          }
        }
      });
    } catch (err) {
      console.warn("Échec de LM Studio (labelPolygons). Aucun nom attribué par défaut.");
      allShapes.forEach((shape) => {
        shape.name = undefined;
      });
    }

    return allShapes;
  } catch (err: any) {
    console.error("Erreur dans runVisionPipeline V3", err);
    throw err;
  }
}
