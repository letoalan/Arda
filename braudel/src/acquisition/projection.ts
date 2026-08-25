export type MapProjectionType = 'equirectangular' | 'web-mercator' | 'orthographic' | 'unknown';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ProjectionDetectionResult {
  projection: MapProjectionType;
  confidence: number;
  reason: string;
  aspectRatio: number;
}

export interface GeoPoint {
  lon: number; // -180 to 180
  lat: number; // -90 to 90
}

export interface PixelPoint {
  x: number;
  y: number;
}

/**
 * Detect map projection based on image dimensions and aspect ratio heuristically.
 */
export function detectProjectionFromDimensions(
  dims: ImageDimensions,
  tolerance = 0.05
): ProjectionDetectionResult {
  const { width, height } = dims;
  if (width <= 0 || height <= 0) {
    return {
      projection: 'unknown',
      confidence: 0,
      reason: 'Dimensions invalides',
      aspectRatio: 0
    };
  }

  const ratio = width / height;

  // Equirectangular (Plate Carrée) standard format has a 2:1 ratio (e.g. 2048x1024, 4096x2048)
  if (Math.abs(ratio - 2.0) <= tolerance) {
    return {
      projection: 'equirectangular',
      confidence: 0.95,
      reason: 'Ratio 2:1 détecté (standard Plate Carrée / Équirectangulaire)',
      aspectRatio: ratio
    };
  }

  // Web Mercator square tiles / maps (1:1 ratio)
  if (Math.abs(ratio - 1.0) <= tolerance) {
    return {
      projection: 'web-mercator',
      confidence: 0.90,
      reason: 'Ratio 1:1 détecté (standard Web Mercator / EPSG:3857)',
      aspectRatio: ratio
    };
  }

  return {
    projection: 'unknown',
    confidence: 0.3,
    reason: `Ratio ${ratio.toFixed(2)} non standard. Sélection manuelle ou analyse complémentaire requise.`,
    aspectRatio: ratio
  };
}

/**
 * Convert Geo point (lon, lat) to Pixel (x, y) under Equirectangular projection
 */
export function geoToEquirectangularPixel(geo: GeoPoint, dims: ImageDimensions): PixelPoint {
  const x = ((geo.lon + 180) / 360) * dims.width;
  const y = ((90 - geo.lat) / 180) * dims.height;
  return { x, y };
}

/**
 * Convert Pixel (x, y) to Geo point (lon, lat) under Equirectangular projection
 */
export function equirectangularPixelToGeo(pixel: PixelPoint, dims: ImageDimensions): GeoPoint {
  const lon = (pixel.x / dims.width) * 360 - 180;
  const lat = 90 - (pixel.y / dims.height) * 180;
  return { lon, lat };
}

/**
 * Convert Geo point (lon, lat) to Pixel (x, y) under Web Mercator projection
 */
export function geoToMercatorPixel(geo: GeoPoint, dims: ImageDimensions): PixelPoint {
  const lon = Math.max(-180, Math.min(180, geo.lon));
  const lat = Math.max(-85.05112878, Math.min(85.05112878, geo.lat)); // Clamp lat for Mercator limit

  const x = ((lon + 180) / 360) * dims.width;

  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = dims.height / 2 - (dims.width * mercN) / (2 * Math.PI);

  return { x, y };
}

/**
 * Convert Pixel (x, y) to Geo point (lon, lat) under Web Mercator projection
 */
export function mercatorPixelToGeo(pixel: PixelPoint, dims: ImageDimensions): GeoPoint {
  const lon = (pixel.x / dims.width) * 360 - 180;

  const mercY = (dims.height / 2 - pixel.y) * ((2 * Math.PI) / dims.width);
  const latRad = 2 * Math.atan(Math.exp(mercY)) - Math.PI / 2;
  const lat = (latRad * 180) / Math.PI;

  return { lon, lat };
}

/**
 * Project pixel coordinates from source projection to target projection
 */
export function reprojectPixel(
  pixel: PixelPoint,
  sourceDims: ImageDimensions,
  sourceProjection: MapProjectionType,
  targetDims: ImageDimensions,
  targetProjection: MapProjectionType
): PixelPoint {
  let geo: GeoPoint;

  if (sourceProjection === 'equirectangular') {
    geo = equirectangularPixelToGeo(pixel, sourceDims);
  } else if (sourceProjection === 'web-mercator') {
    geo = mercatorPixelToGeo(pixel, sourceDims);
  } else {
    // Fallback: direct proportional scaling
    return {
      x: (pixel.x / sourceDims.width) * targetDims.width,
      y: (pixel.y / sourceDims.height) * targetDims.height
    };
  }

  if (targetProjection === 'equirectangular') {
    return geoToEquirectangularPixel(geo, targetDims);
  } else if (targetProjection === 'web-mercator') {
    return geoToMercatorPixel(geo, targetDims);
  }

  return {
    x: (pixel.x / sourceDims.width) * targetDims.width,
    y: (pixel.y / sourceDims.height) * targetDims.height
  };
}
