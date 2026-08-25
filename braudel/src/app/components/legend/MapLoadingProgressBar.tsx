// app/components/legend/MapLoadingProgressBar.tsx

import React from 'react';

interface MapLoadingProgressBarProps {
  mapLoading: boolean;
  mapLoadingProgress: number;
  isFirstLoadDone: boolean;
}

export const MapLoadingProgressBar: React.FC<MapLoadingProgressBarProps> = ({
  mapLoading,
  mapLoadingProgress,
  isFirstLoadDone,
}) => {
  if (!mapLoading) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'rgba(15, 17, 21, 0.92)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '6px 16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        color: 'var(--text-primary)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        height: '42px',
        minWidth: '250px',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          <span>{isFirstLoadDone ? 'Mise à jour du relief...' : 'Génération du relief procédural...'}</span>
          <span style={{ color: 'var(--accent-primary)' }}>{Math.round(mapLoadingProgress)}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '5px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${mapLoadingProgress}%`,
              height: '100%',
              backgroundColor: 'var(--accent-primary)',
              borderRadius: '3px',
              transition: 'width 0.1s linear',
            }}
          />
        </div>
      </div>
    </div>
  );
};
