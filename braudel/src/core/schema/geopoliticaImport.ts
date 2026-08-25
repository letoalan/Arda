// core/schema/geopoliticaImport.ts

export type ImportMode = 'automatic' | 'manual';

export interface GeopoliticaSourceFile {
  id: string;                 // ex: "world_bc8000"
  url: string;                // chemin vers le .geojson
  referenceYear: number;      // ex: -8000, déduit du nom de fichier
  label: string;              // libellé affiché dans la liste
}

export interface GeopoliticaFeatureSelection {
  sourceId: string;           // référence à GeopoliticaSourceFile.id
  selectedNames: string[];    // valeurs NAME/SUBJECTO cochées ; ['*'] = tout
  temporalRangeOverride?: [number, number]; // utilisé en mode manuel
}

export interface GeopoliticaImportConfig {
  enabled: boolean;
  mode: ImportMode;
  targetLayerId: string;      // ex: "layer-civilisations-historiques"
  selections: GeopoliticaFeatureSelection[];
  simplifyTolerance?: number; // en degrés, pour simplify-js
  mergeWithExisting: boolean;
}
