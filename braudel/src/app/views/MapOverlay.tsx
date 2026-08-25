import React from 'react';
import { useStore } from '../state/store';
import { STYLE_CONFIGS } from '../../core/styles.config';

export const MapOverlay: React.FC = () => {
  const { basemapStyle } = useStore();
  const config = STYLE_CONFIGS.find(s => s.id === basemapStyle) || STYLE_CONFIGS[0];
  const t = config.texture;

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    mixBlendMode: t.blendMode as any,
    opacity: t.opacity,
    backgroundImage: t.radialVignette
      ? `radial-gradient(ellipse at center, ${t.radialVignette.inner} 40%, ${t.radialVignette.outer} 100%)`
      : 'none',
    filter: t.svgFilterId ? `url(#${t.svgFilterId})` : 'none',
    transition: 'all 0.5s ease'
  };

  return (
    <>
      <div className="map-texture-overlay" style={overlayStyle} />
      
      {/* Scanlines (Futuriste) */}
      {config.scanlines?.enabled && (
        <div 
          className="map-scanlines-overlay" 
          style={{
            position: 'absolute', 
            inset: 0, 
            pointerEvents: 'none', 
            zIndex: 2,
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, ${config.scanlines.color}22 2px, ${config.scanlines.color}22 3px)`,
            animation: `scanline-scroll ${10 / config.scanlines.speed}s linear infinite`,
            opacity: config.scanlines.opacity,
          }} 
        />
      )}
      
      {/* Glassmorphism (Futuriste) */}
      {config.glassmorphism && (
        <div 
          className="map-glass-overlay" 
          style={{
            position: 'absolute', 
            inset: 0, 
            pointerEvents: 'none', 
            zIndex: 2,
            background: 'rgba(0,20,40,0.08)',
            boxShadow: 'inset 0 0 80px rgba(0,255,255,0.15)',
          }} 
        />
      )}
    </>
  );
};
