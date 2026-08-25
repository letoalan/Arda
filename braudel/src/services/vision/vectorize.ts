// braudel/src/services/vision/vectorize.ts
import { potraceStrategy } from '../../acquisition/auto-vectorize/potraceStrategy';
import { RawShapeInput } from '../../acquisition/types';

/**
 * Prend un masque binaire (image Base64 renvoyée par SAM2)
 * et le vectorise en polygones via Potrace.
 */
export async function vectorizeSamMask(base64Mask: string): Promise<RawShapeInput[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Erreur de contexte 2D");
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // On utilise un seuil bas pour que le masque soit pris dans son ensemble
        const shapes = await potraceStrategy(imageData, { threshold: 128 });
        resolve(shapes);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Erreur lors du chargement du masque SAM"));
    img.src = base64Mask;
  });
}
