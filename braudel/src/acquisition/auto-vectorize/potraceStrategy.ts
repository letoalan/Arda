import { traceImageData, getPaths, THRESHOLD_AUTO } from '@cadit-app/potrace-ts';
import { VectorizationStrategy } from './types';
import { RawShapeInput } from '../types';
import { simplifyFreehandStroke } from '../freehand/simplifyFreehandStroke';

export const potraceStrategy: VectorizationStrategy = async (
  imageData: ImageData,
  options?: { threshold?: number }
): Promise<RawShapeInput[]> => {
  const threshold = options?.threshold !== undefined ? options.threshold : THRESHOLD_AUTO;
  
  // Trace the image
  const paths = traceImageData(imageData, {
    turnpolicy: 'minority',
    turdsize: 10,
    optcurve: false, // We just want raw points to simplify ourselves
    alphamax: 1,
    opttolerance: 0.2
  }, threshold);

  // Convert to points
  const pathSegments = getPaths(paths);
  const shapes: RawShapeInput[] = [];

  for (const segments of pathSegments) {
    if (segments.length === 0) continue;

    const rawPoints = segments.map(seg => ({ x: seg.x, y: seg.y }));
    
    // We simplify points
    const simplified = simplifyFreehandStroke(rawPoints, 2);

    if (simplified.length >= 3) {
      shapes.push({
        points: simplified,
        geometryKind: 'polygon',
        sourceMethod: 'auto-vectorized',
        confidence: threshold === THRESHOLD_AUTO ? 0.9 : 0.8
      });
    }
  }

  return shapes;
};
