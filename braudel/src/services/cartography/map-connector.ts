import { BasemapStyleId } from '../../core/styles.config';

export interface IMapConnector {
  initialize(container: HTMLDivElement, worldType: 'real' | 'fictional', continentsGeoJSON?: any, initialStyle?: any): void;
  updateBasemapStyle(styleKey: BasemapStyleId, showLabels: boolean, showBorders: boolean, activeEmpire?: string): void;
  setEntities(entities: any[]): void;
  enableDrawingMode(entityId: string, geomType: 'Point' | 'LineString' | 'Polygon', geometry?: any, mode?: string): void;
  disableDrawingMode(): void;
  destroy(): void;
  getMap(): any;
}
