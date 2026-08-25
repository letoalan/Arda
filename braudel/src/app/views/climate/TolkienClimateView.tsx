import React, { useMemo } from 'react';
import { useStore } from '../../state/store';
import { TolkienClimateQuestions, generateTolkienClimateScenario } from '../../../core/climate/tolkienClimateGenerator';

export const TolkienClimateView: React.FC = () => {
  const { tolkienClimateParams, setTolkienClimateParams, startYear, endYear } = useStore();
  const params: TolkienClimateQuestions = tolkienClimateParams || {
    startingPoint: 'temperate',
    trend: 'warming',
    intensity: 2,
    speed: 2,
    dominantCause: 'astronomical'
  };

  const scenario = useMemo(() => {
    return generateTolkienClimateScenario(params, startYear || 0, endYear || 3000, 30);
  }, [params, startYear, endYear]);

  // Génération de la sparkline SVG
  const sparklinePath = useMemo(() => {
    if (!scenario.points.length) return '';
    const minT = -5;
    const maxT = 6;
    const width = 240;
    const height = 60;

    return scenario.points
      .map((p, idx) => {
        const x = (idx / (scenario.points.length - 1)) * width;
        const normalizedY = (p.deltaTemp - minT) / (maxT - minT);
        const y = height - normalizedY * height;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [scenario]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
      {/* 1. Point de départ */}
      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          1. Point de départ climatique
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
          {[
            { id: 'ice_age', label: 'Glaciaire (-4°C)' },
            { id: 'temperate', label: 'Tempéré (0°C)' },
            { id: 'warm', label: 'Chaud (+2°C)' },
            { id: 'hyperthermal', label: 'Torride (+4°C)' }
          ].map((item) => (
            <button
              key={item.id}
              className={`btn ${params.startingPoint === item.id ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 4px' }}
              onClick={() => setTolkienClimateParams({ startingPoint: item.id as any })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Tendance */}
      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          2. Direction de la tendance
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
          {[
            { id: 'cooling', label: 'Refroidissement ❄️' },
            { id: 'stable', label: 'Stable ⚖️' },
            { id: 'warming', label: 'Réchauffement 🔥' },
            { id: 'erratic', label: 'Erratique 🌀' }
          ].map((item) => (
            <button
              key={item.id}
              className={`btn ${params.trend === item.id ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 4px' }}
              onClick={() => setTolkienClimateParams({ trend: item.id as any })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Intensité */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>3. Intensité</label>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Niveau {params.intensity || 2}</span>
        </div>
        <input
          type="range"
          min="1"
          max="4"
          step="1"
          value={params.intensity || 2}
          onChange={(e) => setTolkienClimateParams({ intensity: Number(e.target.value) })}
          style={{ width: '100%' }}
        />
      </div>

      {/* 4. Vitesse */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>4. Vitesse d'évolution</label>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Niveau {params.speed || 2}</span>
        </div>
        <input
          type="range"
          min="1"
          max="4"
          step="1"
          value={params.speed || 2}
          onChange={(e) => setTolkienClimateParams({ speed: Number(e.target.value) })}
          style={{ width: '100%' }}
        />
      </div>

      {/* 5. Cause narrative */}
      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          5. Cause dominante
        </label>
        <select
          value={params.dominantCause || 'astronomical'}
          onChange={(e) => setTolkienClimateParams({ dominantCause: e.target.value as any })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)'
          }}
        >
          <option value="astronomical">Cycles astronomiques (Milanković / Orbite)</option>
          <option value="volcanic">Activité volcanique ou magmatique intense</option>
          <option value="magical_industrial">Altération magique ou industrielle</option>
          <option value="oceanic_cycle">Oscillations océaniques et vents marins</option>
        </select>
      </div>

      {/* Sparkline de prévisualisation */}
      <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prévisualisation de l'anomalie de température (°C)</p>
        <svg width="100%" height="60" viewBox="0 0 240 60" style={{ overflow: 'visible' }}>
          <line x1="0" y1="35" x2="240" y2="35" stroke="rgba(255,255,255,0.2)" strokeDasharray="2,2" />
          <path d={sparklinePath} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
