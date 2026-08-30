// views/TimelineView.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { GEOPOLITICA_SOURCES } from '../../services/import/geopoliticaRegistry';
import { ChevronDown, ChevronUp, CloudSun } from 'lucide-react';
import { TimelineControls } from '../components/timeline/TimelineControls';
import { generateTolkienClimateScenario } from '../../core/climate/tolkienClimateGenerator';
import { buildBraudelClimateScenario } from '../../core/climate/braudelClimateService';
import { interpolateClimateAtYear, tempToSeaLevel, generateClimateGradient } from '../../core/climate/climatePhysics';

export const TimelineView: React.FC = () => {
  const { 
    currentTime, 
    setCurrentTime, 
    isPlaying, 
    togglePlayback, 
    playbackSpeed, 
    setPlaybackSpeed,
    world,
    startYear,
    endYear,
    climateMedianTarget,
    climateRcpVariability,
    climateSelectedRcp,
    tolkienClimateParams
  } = useStore();

  const minTime = startYear;
  const maxTime = endYear;
  const timeRange = maxTime - minTime || 1;
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const playbackSpeedRef = useRef(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;

  useEffect(() => {
    if (!isPlaying) return;

    // Calcul d'un pas adapté à la vitesse choisie (ex: playbackSpeed en années par seconde)
    // On met à jour toutes les 100ms avec un pas de playbackSpeed / 10 (ou min 1 an pour les grandes vitesses)
    const tickIntervalMs = 100;
    const interval = setInterval(() => {
      const speed = playbackSpeedRef.current;
      // Incrément par tick de 100ms : speed années par seconde = speed / 10 par tick
      const step = Math.max(1, Math.round(speed / 10));
      const nextTime = currentTimeRef.current + step;

      if (nextTime >= maxTime) {
        setCurrentTime(maxTime);
        useStore.setState({ isPlaying: false });
      } else {
        setCurrentTime(nextTime);
      }
    }, tickIntervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, maxTime, setCurrentTime]);

  const { entityTracks, trackCount } = useMemo(() => {
    const validEntities = world.entities.filter(e => e.temporalRange && e.geometry);
    const sorted = [...validEntities].sort((a, b) => a.temporalRange!.validFrom - b.temporalRange!.validFrom);
    
    const trackEnds: number[] = [];
    const results: { entity: typeof world.entities[0], trackIndex: number }[] = [];
    
    for (const entity of sorted) {
      const start = entity.temporalRange!.validFrom;
      const end = entity.temporalRange!.validTo;
      
      let assignedTrack = -1;
      for (let i = 0; i < trackEnds.length; i++) {
        if (trackEnds[i] + 5 < start) {
          assignedTrack = i;
          break;
        }
      }
      
      if (assignedTrack === -1) {
        assignedTrack = trackEnds.length;
        trackEnds.push(end);
      } else {
        trackEnds[assignedTrack] = end;
      }
      
      results.push({ entity, trackIndex: assignedTrack });
    }
    
    return { entityTracks: results, trackCount: trackEnds.length };
  }, [world.entities]);

  const geopoliticaReferenceBands = useMemo(() => {
    return GEOPOLITICA_SOURCES.filter(
      s => s.referenceYear >= minTime && s.referenceYear <= maxTime
    );
  }, [minTime, maxTime]);

  const selectEntity = (id: string) => {
    useStore.setState({ selectedEntityId: id });
  };

  const isFictional = world.world?.[0]?.worldType === 'fictional';

  const currentClimateScenario = useMemo(() => {
    if (isFictional) {
      return generateTolkienClimateScenario(tolkienClimateParams, minTime || 0, maxTime || 3000, 30);
    }
    const rcp = climateRcpVariability ? (climateSelectedRcp || undefined) : undefined;
    return buildBraudelClimateScenario(climateMedianTarget, rcp, true);
  }, [isFictional, tolkienClimateParams, minTime, maxTime, climateMedianTarget, climateRcpVariability, climateSelectedRcp]);

  const currentDeltaTemp = useMemo(() => {
    return interpolateClimateAtYear(currentClimateScenario.points, currentTime);
  }, [currentClimateScenario, currentTime]);

  const currentSeaLevel = useMemo(() => tempToSeaLevel(currentDeltaTemp), [currentDeltaTemp]);

  const climateGradientCss = useMemo(() => {
    return generateClimateGradient(currentClimateScenario.points, minTime, maxTime, 60);
  }, [currentClimateScenario.points, minTime, maxTime]);

  const currentPeriodLabel = useMemo(() => {
    if (isFictional) {
      if (currentDeltaTemp >= 2.0) return 'Ère Torride';
      if (currentDeltaTemp >= 0.5) return 'Période Chaude';
      if (currentDeltaTemp <= -2.0) return 'Grand Hiver Glaciaire';
      if (currentDeltaTemp <= -0.5) return 'Période Froide';
      return 'Climat Tempéré';
    }
    if (currentTime < -200) return 'Holocène Ancien';
    if (currentTime >= -200 && currentTime <= 400) return 'Optimum Romain (+0.4°C)';
    if (currentTime > 400 && currentTime < 900) return 'Anomalie Froide Antique (536)';
    if (currentTime >= 900 && currentTime <= 1300) return 'Optimum Médiéval (+0.6°C)';
    if (currentTime > 1300 && currentTime <= 1850) return 'Petit Âge Glaciaire (-0.7°C)';
    if (currentTime > 1850 && currentTime <= 2026) return 'Ère Industrielle & Moderne';
    return 'Projection GIEC';
  }, [isFictional, currentDeltaTemp, currentTime]);

  const playheadPct = ((currentTime - minTime) / timeRange) * 100;

  return (
    <>
      <div 
        style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '20px', 
          right: '20px', 
          zIndex: 10,
          backgroundColor: 'rgba(15, 17, 21, 0.92)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Timeline Spatio-Temporelle</span>
          <button className="icon-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <TimelineControls
          currentTime={currentTime}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          minTime={minTime}
          maxTime={maxTime}
          onTogglePlayback={togglePlayback}
          onChangeSpeed={setPlaybackSpeed}
          onJumpStart={() => setCurrentTime(minTime)}
          onJumpEnd={() => setCurrentTime(maxTime)}
          onChangeTime={setCurrentTime}
        />

        {!isCollapsed && (
          <div ref={tracksContainerRef} style={{ position: 'relative', height: `${Math.max(80, trackCount * 22 + 45)}px`, overflowX: 'hidden', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '6px 0' }}>
            {/* Piste Climat Réaliste avec Dégradé Dynamique */}
            <div
              style={{
                position: 'relative',
                height: '22px',
                margin: '0 8px 6px 8px',
                borderRadius: '5px',
                background: climateGradientCss,
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 10px',
                fontSize: '0.68rem',
                color: '#fff',
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)'
              }}
              title="Piste Climatique Réaliste (Optima Médiéval/Romain, Petit Âge Glaciaire, Forçages Volcaniques)"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CloudSun size={13} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />
                <span>Climat : {currentDeltaTemp >= 0 ? `+${currentDeltaTemp.toFixed(1)}°C` : `${currentDeltaTemp.toFixed(1)}°C`} (Mer : {currentSeaLevel >= 0 ? `+${currentSeaLevel.toFixed(1)}m` : `${currentSeaLevel.toFixed(1)}m`})</span>
                <span style={{ background: 'rgba(0,0,0,0.45)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.62rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {currentPeriodLabel}
                </span>
              </span>
              <span style={{ opacity: 0.9 }}>{minTime} → {maxTime}</span>
            </div>

            {geopoliticaReferenceBands.map(s => {
              const leftPct = ((s.referenceYear - minTime) / timeRange) * 100;
              return (
                <div key={s.id} style={{ position: 'absolute', left: `${leftPct}%`, top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
              );
            })}

            <div style={{ position: 'absolute', left: `${playheadPct}%`, top: 0, bottom: 0, width: '2px', backgroundColor: 'var(--accent-primary)', zIndex: 5, pointerEvents: 'none' }} />

            {entityTracks.map(({ entity, trackIndex }) => {
              const startPct = ((entity.temporalRange!.validFrom - minTime) / timeRange) * 100;
              const endPct = ((entity.temporalRange!.validTo - minTime) / timeRange) * 100;
              const widthPct = Math.max(0.5, endPct - startPct);

              return (
                <div
                  key={entity.id}
                  onClick={() => selectEntity(entity.id)}
                  style={{
                    position: 'absolute',
                    left: `${startPct}%`,
                    width: `${widthPct}%`,
                    top: `${trackIndex * 22 + 28}px`,
                    height: '18px',
                    backgroundColor: String(entity.properties?.color || '#3B82F6'),
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    color: '#fff',
                    padding: '0 6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    opacity: 0.85,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                  title={`${entity.name} (${entity.temporalRange!.validFrom} à ${entity.temporalRange!.validTo})`}
                >
                  {entity.name}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
