/**
 * Façade principale pour l'exportation multimédia et cartographique.
 * Ré-exporte l'ensemble des sous-modules spécialisés (< 200 lignes chacun)
 * tout en maintenant une compatibilité ascendante stricte à 100%.
 */

// 1. Types, interfaces et prédicats spatio-temporels
export type {
  PDFExportOptions,
  EpochExportTarget,
} from './modules/pdf-types';

export {
  PdfExportError,
  isEntityVisibleAt,
  isRelationVisibleAt,
} from './modules/pdf-types';

// 2. Capture WebGL, synchronisation événementielle GPU et pré-chargement catalogue
export {
  updateEntitiesAndWaitForRender,
  waitForBackgroundTilesReady,
  waitForAllSourcesReady,
  waitForMapReady,
  ensureEpochEntitiesLoaded,
  captureMapCanvas,
  captureSnapshotAt,
} from './modules/pdf-map-capture';

// 3. Éléments vectoriels cartographiques (Rose des vents, Échelle graduée)
export {
  calculateScaleBarParams,
  drawNorthArrow,
  drawScaleBar,
} from './modules/pdf-carto-elements';

// 4. Moteur de rendu d'une planche cartographique A4
export {
  renderMapPDFPage,
} from './modules/pdf-page-renderer';

// 5. Générateurs d'Atlas et livrets PDF multi-pages
export {
  exportToPDF,
  exportTimelineDrivenPDF,
  exportMultiEpochPDF,
} from './modules/pdf-atlas-generator';

// 6. Utilitaires d'exportation d'images et de timelapse ZIP
export {
  exportToJPEG,
  exportTimeLapseZIP,
  exportMultiEpochZIP,
} from './modules/media-export-utils';
