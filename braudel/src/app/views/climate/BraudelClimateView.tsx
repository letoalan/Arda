import React, { useMemo } from 'react';
import { useStore } from '../../state/store';
import { getRcpScenarios } from '../../../core/climate/braudelClimateService';

export const BraudelClimateView: React.FC = () => {
  const {
    climateMedianTarget,
    setClimateMedianTarget,
    climateRcpVariability,
    setClimateRcpVariability,
    climateSelectedRcp,
    setClimateSelectedRcp
  } = useStore();

  const rcpScenarios = useMemo(() => getRcpScenarios(), []);

  const handleSelectRcp = (rcpKey: 'RCP2.6' | 'RCP4.5' | 'RCP6.0' | 'RCP8.5') => {
    if (climateSelectedRcp === rcpKey) {
      setClimateSelectedRcp(null); // Basculer vers l'ensemble
    } else {
      setClimateSelectedRcp(rcpKey);
    }
  };

  const getRcpDescription = (rcpKey: string) => {
    switch (rcpKey) {
      case 'RCP2.6': return 'Atténuation forte (+1.4°C en 2100, pic 1.6°C en 2060)';
      case 'RCP4.5': return 'Stabilisation modérée (+2.4°C en 2100)';
      case 'RCP6.0': return 'Émissions élevées (+3.1°C en 2100)';
      case 'RCP8.5': return 'Pessimiste sans politique climatique (+4.5°C en 2100)';
      default: return '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
      {/* Bloc Historique (lecture seule) */}
      <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
          🏛️ Bloc Historique (-3000 à 2026)
        </h4>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Données paléoclimatiques calibrées (Optimum holocène, Période romaine, P.A.G., forçage volcanique de 536/1815).
        </p>
      </div>

      {/* Bloc Prospectif (après 2026) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          🔮 Projections Prospectives (2026 à 2100)
        </h4>

        {/* Case Variabilité RCP */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={climateRcpVariability}
            onChange={(e) => {
              setClimateRcpVariability(e.target.checked);
              if (!e.target.checked) setClimateSelectedRcp(null);
            }}
          />
          <span style={{ fontWeight: 500 }}>Afficher la variabilité multi-scénarios RCP (GIEC)</span>
        </label>

        {/* Slider Médian (désactivé si variabilité RCP cochée) */}
        <div style={{ opacity: climateRcpVariability ? 0.4 : 1, pointerEvents: climateRcpVariability ? 'none' : 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ color: 'var(--text-muted)' }}>Cible médiane 2100 :</label>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>+{climateMedianTarget.toFixed(1)}°C</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.0"
            step="0.1"
            value={climateMedianTarget}
            disabled={climateRcpVariability}
            onChange={(e) => setClimateMedianTarget(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Boutons de sélection RCP si variabilité active */}
        {climateRcpVariability && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {Object.entries(rcpScenarios).map(([key, rcp]) => {
                const isSelected = climateSelectedRcp === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectRcp(key as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(255,255,255,0.12)' : 'var(--bg-tertiary)',
                      border: isSelected ? `2px solid ${rcp.color}` : '1px solid var(--border-color)',
                      boxShadow: isSelected ? `0 0 8px ${rcp.color}40` : 'none',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    title={rcp.name}
                  >
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: rcp.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem' }}>{key}</span>
                    {isSelected && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: rcp.color }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Bouton Ensemble / Tous */}
            <button
              type="button"
              onClick={() => setClimateSelectedRcp(null)}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                background: climateSelectedRcp === null ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: climateSelectedRcp === null ? '1px solid rgba(59, 130, 246, 0.5)' : '1px dashed var(--border-color)',
                color: climateSelectedRcp === null ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                textAlign: 'center',
                fontWeight: climateSelectedRcp === null ? 600 : 400
              }}
            >
              {climateSelectedRcp === null ? '● Trajectoire active : Ensemble probabiliste (Tous)' : 'Basculer sur l’ensemble probabiliste (Tous)'}
            </button>
          </div>
        )}
      </div>

      {/* Résumé de l'anomalie courante */}
      <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
          📌 <strong>Trajectoire active :</strong>{' '}
          {climateRcpVariability
            ? (climateSelectedRcp
                ? `${climateSelectedRcp} — ${getRcpDescription(climateSelectedRcp)}`
                : 'Ensemble probabiliste multi-trajectoires (Moyenne GIEC)')
            : `Médiane calibrée à +${climateMedianTarget.toFixed(1)}°C`}
        </p>
      </div>
    </div>
  );
};
