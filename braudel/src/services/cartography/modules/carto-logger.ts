// services/cartography/modules/carto-logger.ts

/**
 * Système de logs structurés de diagnostic pour la cartographie, les tuiles vectorielles,
 * les graticules et les lignes de rhumb.
 * Permet d'apporter des preuves tangibles pour tracer le cycle de vie des calques,
 * les basculements de style et les détections d'anomalies en temps réel.
 */

const CARTO_LOG_PREFIX = '[Carto Layers]';

export function logCarto(tag: string, ...details: unknown[]): void {
  const timestamp = new Date().toISOString();
  console.info(`${CARTO_LOG_PREFIX} [${timestamp}] [${tag}]`, ...details);
}

export function logCartoWarn(tag: string, ...details: unknown[]): void {
  const timestamp = new Date().toISOString();
  console.warn(`${CARTO_LOG_PREFIX} [${timestamp}] [${tag}]`, ...details);
}

export function logCartoError(tag: string, ...details: unknown[]): void {
  const timestamp = new Date().toISOString();
  console.error(`${CARTO_LOG_PREFIX} [${timestamp}] [${tag}]`, ...details);
}
