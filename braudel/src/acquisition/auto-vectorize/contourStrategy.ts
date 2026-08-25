import { contours } from 'd3-contour';
import { VectorizationStrategy } from './types';
import { RawShapeInput } from '../types';
import { simplifyFreehandStroke } from '../freehand/simplifyFreehandStroke';

export const contourStrategy: VectorizationStrategy = async (
  imageData: ImageData,
  options?: { threshold?: number }
): Promise<RawShapeInput[]> => {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // Convert RGBA to 1D array of brightness values [0, 1]
  // 0 = dark, 1 = light. If we are tracing dark lines, we might want to invert.
  // Assuming dark shapes on light background, we'll extract "dark" values.
  const values = new Array<number>(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    // Brightness = (r+g+b)/3. Invert so 1 is dark (solid shape), 0 is white.
    // Multiply by alpha so transparent is also 0.
    const brightness = 1 - ((r + g + b) / (3 * 255));
    values[j] = brightness * (a / 255);
  }

  const threshold = options?.threshold ?? 0.5;

  // Generate contours
  const contourGen = contours().size([width, height]).thresholds([threshold]);
  const contourData = contourGen(values);

  const shapes: RawShapeInput[] = [];

  // Each contour object is a MultiPolygon
  for (const contour of contourData) {
    for (const polygon of contour.coordinates) {
      // polygon[0] is the outer ring, polygon[1+] are holes
      // We will just take the outer ring for now to keep it simple
      if (polygon.length > 0) {
        const outerRing = polygon[0];
        
        // Convert to {x, y}
        const rawPoints = outerRing.map(p => ({ x: p[0], y: p[1] }));
        
        // Simplify
        const simplified = simplifyFreehandStroke(rawPoints, 2);
        
        if (simplified.length >= 3) {
          shapes.push({
            points: simplified,
            geometryKind: 'polygon',
            sourceMethod: 'auto-vectorized',
            confidence: contour.value // Store the threshold level
          });
        }
      }
    }
  }

  return shapes;
};
