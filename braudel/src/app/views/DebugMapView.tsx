import React, { useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FeatureCollection } from 'geojson';
import { generateMVTFromGeoJSON } from '../../utils/generateMVT';

interface Props {
  geojson: FeatureCollection;
  onClose: () => void;
}

let protocolCounter = 0;

export const DebugMapView: React.FC<Props> = ({ geojson, onClose }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const protocolId = useMemo(() => `mvt-memory-${protocolCounter++}`, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Generate tiles (maxZoom = 5 is enough for MVP continents overview)
    const mvtTiles = generateMVTFromGeoJSON(geojson, 5);

    // Register a custom protocol to serve tiles from memory
    maplibregl.addProtocol(protocolId, async (params) => {
      const match = params.url.match(new RegExp(`${protocolId}:\\/\\/(\\d+)\\/(\\d+)\\/(\\d+)`));
      if (!match) {
        throw new Error('Invalid url');
      }
      const z = parseInt(match[1]);
      const x = parseInt(match[2]);
      const y = parseInt(match[3]);
      
      const tileMap = mvtTiles.get(z);
      if (tileMap && tileMap.has(`${x}_${y}`)) {
        return { data: tileMap.get(`${x}_${y}`)! };
      } else {
        // Empty buffer for missing tiles
        return { data: new ArrayBuffer(0) };
      }
    });

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#0f172a' }
          }
        ]
      },
      center: [0, 0],
      zoom: 1
    });

    map.on('load', () => {
      map.addSource('continents', {
        type: 'vector',
        tiles: [`${protocolId}://{z}/{x}/{y}`],
        maxzoom: 5
      });

      map.addLayer({
        id: 'continents-fill',
        type: 'fill',
        source: 'continents',
        'source-layer': 'continents',
        paint: {
          'fill-color': '#4ade80',
          'fill-opacity': 0.8
        }
      });

      map.addLayer({
        id: 'continents-line',
        type: 'line',
        source: 'continents',
        'source-layer': 'continents',
        paint: {
          'line-color': '#22c55e',
          'line-width': 2
        }
      });
    });

    return () => {
      map.remove();
      maplibregl.removeProtocol(protocolId);
    };
  }, [geojson, protocolId]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          padding: '8px 16px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          zIndex: 10
        }}
      >
        Fermer Debug
      </button>
    </div>
  );
};
