export type ID = string;
export type Timestamp = string;
export type Version = number;

export interface Meta {
  id: 'meta';
  schemaVersion: Version;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type WorldType = 'real' | 'fictional';

export interface World {
  id: ID;
  name: string;
  description?: string;
  worldType?: WorldType; // Defaults to 'real' for backward compatibility
  continents?: any; // FeatureCollection for fictional continents
  basemapStyle?: 'antiquity' | 'medieval' | 'renaissance' | 'modern' | 'colonial' | 'futuristic' | 'contemporary_current' | 'contemporary_satellite' | 'contemporary_national_geographic' | 'contemporary_positron_lite' | 'futuristic_cyberpunk_neon' | 'futuristic_space_opera';
  basemapLabelsVisible?: boolean;
  basemapBordersVisible?: boolean;
  activeEmpire?: 'british' | 'french' | 'portuguese' | 'all';
  startYear?: number;
  endYear?: number;
  prometheanMode?: boolean;
  meta: Meta;
}

export type LayerType = 'physical' | 'historical' | 'political';

export interface Layer {
  id: ID;
  worldId: ID;
  type: LayerType;
  name: string;
  order: number;
  visible: boolean;
  meta: Meta;
}

export type EntityType = 'place' | 'event' | 'actor' | 'concept';

// GeoJSON types for geometry
export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: Array<[number, number]>;
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: Array<Array<[number, number]>>;
}

export type GeometryType = GeoJsonPoint | GeoJsonLineString | GeoJsonPolygon;

export interface Entity {
  id: ID;
  worldId: ID;
  layerId: ID;
  type: EntityType;
  name: string;
  description?: string;
  geometry?: GeometryType;
  properties?: Record<string, unknown>; // We will use properties.relationId for linked relation
  temporalRange?: { validFrom: number; validTo: number };
  wikiContent?: string;
  meta?: Meta;
}

export interface Relation {
  id: ID;
  worldId: ID;
  sourceId: ID;
  targetId: ID;
  type: string;
  direction: 'directed' | 'undirected' | 'bidirectional';
  weight?: number;
  isSpatial: boolean;
  entityId?: ID;
  temporalRange?: { validFrom: number; validTo: number };
  meta: Meta;
}

export interface TimelineEvent {
  id: ID;
  layerId: ID;
  timestamp: Timestamp;
  entityId: ID;
  description?: string;
  meta: Meta;
}

export interface Timeline {
  id: ID;
  worldId: ID;
  name: string;
  events: TimelineEvent[];
  meta: Meta;
}
