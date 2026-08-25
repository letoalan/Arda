import React, { useState, useMemo } from 'react';
import { useStore } from '../state/store';
import { CloudSun, ChevronDown, ChevronRight, Waves, Snowflake } from 'lucide-react';
import { TolkienClimateView } from './climate/TolkienClimateView';
import { BraudelClimateView } from './climate/BraudelClimateView';
import { generateTolkienClimateScenario } from '../../core/climate/tolkienClimateGenerator';
import { buildBraudelClimateScenario } from '../../core/climate/braudelClimateService';
import { interpolateClimateAtYear, tempToSeaLevel, tempToIceCapLatitude } from '../../core/climate/climatePhysics';

export const ClimatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    world,
    currentTime,
    startYear,
    endYear,
    climateSeaLevelVisible,
    setClimateSeaLevelVisible,
    climateIceCapVisible,
    setClimateIceCapVisible,
    climateMedianTarget,
    tolkienClimateParams
  } = useStore();

  const worldRecord = world.world?.[0];
  const isFictional = worldRecord?.worldType === 'fictional';

  // Calcul dynamique de la température, du niveau marin et des calottes pour l'année courante
  const currentScenario = useMemo(() => {
    if (isFictional) {
      return generateTolkienClimateScenario(tolkienClimateParams, startYear || 0, endYear || 3000, 30);
    }
    return buildBraudelClimateScenario(climateMedianTarget, undefined, true);
  }, [isFictional, tolkienClimateParams, startYear, endYear, climateMedianTarget]);

  const currentDeltaTemp = useMemo(() => {
    return interpolateClimateAtYear(currentScenario.points, currentTime);
  }, [currentScenario, currentTime]);

  const currentSeaLevel = useMemo(() => tempToSeaLevel(currentDeltaTemp), [currentDeltaTemp]);
  const currentIceCapLat = useMemo(() => tempToIceCapLatitude(currentDeltaTemp), [currentDeltaTemp]);

  return (
    <div className="panel-section" style={{ borderBottom: '1px solid var(--glass-border)', padding: '12px 16px' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudSun size={18} color="#38BDF8" />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Climat & Paléo-environnement
          </h3>
        </div>
        {isOpen ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
      </div>

      {isOpen && (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Indicateur d'état temps réel */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              fontSize: '0.8rem'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Année : </span>
              <strong style={{ color: 'var(--text-primary)' }}>{currentTime}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>ΔT° : </span>
              <strong style={{ color: currentDeltaTemp >= 0 ? '#EF4444' : '#38BDF8' }}>
                {currentDeltaTemp >= 0 ? `+${currentDeltaTemp.toFixed(1)}` : currentDeltaTemp.toFixed(1)}°C
              </strong>
            </div>
          </div>

          {/* Corps de configuration selon le mode actif */}
          {isFictional ? <TolkienClimateView /> : <BraudelClimateView />}

          {/* Toggles de rendu partagés */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Waves size={16} color="#38BDF8" />
                <span>Niveau marin :</span>
                <strong style={{ color: '#38BDF8' }}>{currentSeaLevel >= 0 ? `+${currentSeaLevel.toFixed(1)}m` : `${currentSeaLevel.toFixed(1)}m`}</strong>
              </span>
              <input
                type="checkbox"
                checked={climateSeaLevelVisible}
                onChange={(e) => setClimateSeaLevelVisible(e.target.checked)}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Snowflake size={16} color="#E0F2FE" />
                <span>Calottes polaires :</span>
                <strong style={{ color: '#E0F2FE' }}>Lat {currentIceCapLat.toFixed(1)}°</strong>
              </span>
              <input
                type="checkbox"
                checked={climateIceCapVisible}
                onChange={(e) => setClimateIceCapVisible(e.target.checked)}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
