/**
 * Types, interfaces et prédicats de visibilité pour l'exportation cartographique PDF.
 */

export interface PDFExportOptions {
  historicalPeriod?: string;
  relations?: any[];
  customTitle?: string;
  notes?: string;
  multi?: boolean;
  startTime?: number;
  maxPages?: number;
  catalogEntities?: { id: string; temporalRange: [number, number] }[];
}

export interface EpochExportTarget {
  year: number;
  label: string;
  targetYear?: number;
  referenceYear?: number;
  validFrom?: number;
  validTo?: number;
}

export class PdfExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfExportError';
  }
}

export function isEntityVisibleAt(e: any, year: number, epochRange?: { validFrom?: number; validTo?: number }): boolean {
  if (e.properties?.isRelation) return false;
  if (!e.temporalRange) return true;
  const from = (e.temporalRange as any).validFrom !== undefined 
    ? Number((e.temporalRange as any).validFrom)
    : Array.isArray(e.temporalRange)
    ? Number(e.temporalRange[0])
    : -Infinity;
  const to = (e.temporalRange as any).validTo !== undefined 
    ? Number((e.temporalRange as any).validTo)
    : Array.isArray(e.temporalRange)
    ? Number(e.temporalRange[1])
    : Infinity;
  if (from <= year && to >= year) return true;
  if (epochRange && epochRange.validFrom !== undefined && epochRange.validTo !== undefined) {
    return from <= epochRange.validTo && to >= epochRange.validFrom;
  }
  return false;
}

export function isRelationVisibleAt(r: any, year: number, epochRange?: { validFrom?: number; validTo?: number }): boolean {
  if (!r.temporalRange) return true;
  const from = (r.temporalRange as any).validFrom !== undefined 
    ? Number((r.temporalRange as any).validFrom)
    : Array.isArray(r.temporalRange)
    ? Number(r.temporalRange[0])
    : -Infinity;
  const to = (r.temporalRange as any).validTo !== undefined 
    ? Number((r.temporalRange as any).validTo)
    : Array.isArray(r.temporalRange)
    ? Number(r.temporalRange[1])
    : Infinity;
  if (from <= year && to >= year) return true;
  if (epochRange && epochRange.validFrom !== undefined && epochRange.validTo !== undefined) {
    return from <= epochRange.validTo && to >= epochRange.validFrom;
  }
  return false;
}
