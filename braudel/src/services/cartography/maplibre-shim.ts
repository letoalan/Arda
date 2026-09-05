// src/services/cartography/maplibre-shim.ts
// @ts-ignore
import maplibregl from 'maplibre-gl-core';

export const addProtocol = (maplibregl as any).addProtocol?.bind(maplibregl);
export const removeProtocol = (maplibregl as any).removeProtocol?.bind(maplibregl);
export const Map = (maplibregl as any).Map;
export const NavigationControl = (maplibregl as any).NavigationControl;
export const Marker = (maplibregl as any).Marker;
export const Popup = (maplibregl as any).Popup;
export const LngLat = (maplibregl as any).LngLat;
export const LngLatBounds = (maplibregl as any).LngLatBounds;

export default maplibregl;
