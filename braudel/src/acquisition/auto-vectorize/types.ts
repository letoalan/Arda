import { RawShapeInput } from '../types';

export type VectorizationStrategy = (
  imageData: ImageData,
  options?: Record<string, any>
) => Promise<RawShapeInput[]>;
