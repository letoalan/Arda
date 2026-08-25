import {
  detectProjectionFromDimensions,
  reprojectPixel,
  MapProjectionType,
  ProjectionDetectionResult,
  ImageDimensions
} from './projection';

export interface AcquisitionResult {
  sourceDimensions: ImageDimensions;
  targetDimensions: ImageDimensions;
  detectedProjection: ProjectionDetectionResult;
  targetProjection: MapProjectionType;
  canvas?: HTMLCanvasElement;
}

/**
 * Process acquired image by identifying its projection by dimensions,
 * and performing raster canvas reprojection if needed.
 */
export function processAcquiredImageRaster(
  sourceCanvas: HTMLCanvasElement,
  targetProjection: MapProjectionType = 'equirectangular',
  overrideSourceProjection?: MapProjectionType
): AcquisitionResult {
  const sourceDims: ImageDimensions = {
    width: sourceCanvas.width,
    height: sourceCanvas.height
  };

  const detected = detectProjectionFromDimensions(sourceDims);
  const effectiveSourceProjection = overrideSourceProjection || detected.projection;

  // Determine target canvas dimensions
  const targetDims: ImageDimensions =
    targetProjection === 'equirectangular'
      ? { width: Math.max(sourceDims.width, 1024), height: Math.max(sourceDims.width / 2, 512) }
      : { width: Math.max(sourceDims.width, 1024), height: Math.max(sourceDims.width, 1024) };

  // If projection matches and dimensions match, no resampling needed
  if (
    effectiveSourceProjection === targetProjection &&
    sourceDims.width === targetDims.width &&
    sourceDims.height === targetDims.height
  ) {
    return {
      sourceDimensions: sourceDims,
      targetDimensions: targetDims,
      detectedProjection: detected,
      targetProjection,
      canvas: sourceCanvas
    };
  }

  // Create target canvas and perform inverse lookup pixel mapping
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetDims.width;
  targetCanvas.height = targetDims.height;
  const targetCtx = targetCanvas.getContext('2d');
  const sourceCtx = sourceCanvas.getContext('2d');

  if (!targetCtx || !sourceCtx) {
    return {
      sourceDimensions: sourceDims,
      targetDimensions: targetDims,
      detectedProjection: detected,
      targetProjection
    };
  }

  const sourceData = sourceCtx.getImageData(0, 0, sourceDims.width, sourceDims.height);
  const targetData = targetCtx.createImageData(targetDims.width, targetDims.height);

  const srcPixels = sourceData.data;
  const tgtPixels = targetData.data;

  for (let ty = 0; ty < targetDims.height; ty++) {
    for (let tx = 0; tx < targetDims.width; tx++) {
      // Perform inverse projection transformation from target pixel to source pixel
      const srcPixel = reprojectPixel(
        { x: tx, y: ty },
        targetDims,
        targetProjection,
        sourceDims,
        effectiveSourceProjection
      );

      const sx = Math.floor(srcPixel.x);
      const sy = Math.floor(srcPixel.y);

      if (sx >= 0 && sx < sourceDims.width && sy >= 0 && sy < sourceDims.height) {
        const srcIdx = (sy * sourceDims.width + sx) * 4;
        const tgtIdx = (ty * targetDims.width + tx) * 4;

        tgtPixels[tgtIdx] = srcPixels[srcIdx];         // R
        tgtPixels[tgtIdx + 1] = srcPixels[srcIdx + 1]; // G
        tgtPixels[tgtIdx + 2] = srcPixels[srcIdx + 2]; // B
        tgtPixels[tgtIdx + 3] = srcPixels[srcIdx + 3]; // A
      }
    }
  }

  targetCtx.putImageData(targetData, 0, 0);

  return {
    sourceDimensions: sourceDims,
    targetDimensions: targetDims,
    detectedProjection: detected,
    targetProjection,
    canvas: targetCanvas
  };
}
