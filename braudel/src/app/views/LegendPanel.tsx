// views/LegendPanel.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../state/store';
import { GEOPOLITICA_SOURCES } from '../../services/import/geopoliticaRegistry';
import { List, X, Layers } from 'lucide-react';
import { MapLoadingProgressBar } from '../components/legend/MapLoadingProgressBar';

export const LegendPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    world,
    currentTime,
    mapLoading,
    mapLoadingProgress,
    mapLoadingDuration,
    isFirstLoadDone,
    setMapLoading,
    setMapLoadingProgress,
    setFirstLoadDone
  } = useStore();

  useEffect(() => {
    if (!mapLoading) return;

    const intervalTime = 100;
    const step = (intervalTime / mapLoadingDuration) * 100;
    let currentProgress = 0;
    setMapLoadingProgress(0);

    const timer = setInterval(() => {
      currentProgress += step;
      if (currentProgress >= 100) {
        clearInterval(timer);
        setMapLoading(false);
        if (!isFirstLoadDone) {
          setFirstLoadDone(true);
        }
      } else {
        setMapLoadingProgress(Math.min(99.9, currentProgress));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [mapLoading, mapLoadingDuration]);

  const activePeriod = useMemo(() => {
    if (!GEOPOLITICA_SOURCES.length) return null;
    const sorted = [...GEOPOLITICA_SOURCES].sort((a, b) => a.referenceYear - b.referenceYear);
    let candidate = sorted[0];
    for (const source of sorted) {
      if (source.referenceYear <= currentTime) {
        candidate = source;
      } else {
        break;
      }
    }
    return candidate;
  }, [currentTime]);

  const activeEntities = useMemo(() => {
    return world.entities.filter(entity => {
      if (!entity.temporalRange) return true;
      return (
        entity.temporalRange.validFrom <= currentTime &&
        entity.temporalRange.validTo >= currentTime
      );
    });
  }, [world.entities, currentTime]);

  return (
    <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <MapLoadingProgressBar
          mapLoading={mapLoading}
          mapLoadingProgress={mapLoadingProgress}
          isFirstLoadDone={isFirstLoadDone}
        />

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn"
          style={{
            backgroundColor: 'rgba(15, 17, 21, 0.85)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          title="Afficher la légende"
        >
          {isOpen ? <X size={20} /> : <List size={20} />}
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            width: '280px',
            maxHeight: '380px',
            overflowY: 'auto',
            backgroundColor: 'rgba(15, 17, 21, 0.92)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'var(--text-primary)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} /> Légende & Époque
            </span>
          </div>

          {activePeriod && (
            <div style={{ marginBottom: '12px', padding: '8px 10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contexte Historique</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '2px' }}>{activePeriod.label}</div>
            </div>
          )}

          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Entités Actives ({activeEntities.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeEntities.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune entité active à cette date.</div>
            ) : (
              activeEntities.slice(0, 15).map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: String(e.properties?.color || '#3B82F6'), border: '1px solid rgba(255,255,255,0.3)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                </div>
              ))
            )}
            {activeEntities.length > 15 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                + {activeEntities.length - 15} autres entités...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
