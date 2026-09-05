// src/app/components/map/EckertIVOverlay.tsx

import React, { useState, useEffect } from 'react';
import { Globe, X, RotateCcw, Plus, Minus } from 'lucide-react';

interface EckertIVOverlayProps {
  visible?: boolean;
  transform?: { zoom: number; panX: number; panY: number };
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  onTransitionToGlobe?: () => void;
}

export const EckertIVOverlay: React.FC<EckertIVOverlayProps> = ({
  visible = true,
  transform,
  onZoomIn,
  onZoomOut,
  onReset,
  onTransitionToGlobe
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  });
  const [showBadge, setShowBadge] = useState<boolean>(true);

  const t = transform || { zoom: 1.0, panX: 0, panY: 0 };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      setDimensions({ width: w, height: h });
    };

    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    window.addEventListener('resize', updateSize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [visible]);

  if (!visible) return null;

  const width = dimensions.width || (containerRef.current?.clientWidth ?? window.innerWidth);
  const height = dimensions.height || (containerRef.current?.clientHeight ?? window.innerHeight);
  const padding = 28;

  // Calcul du cadre 2:1 centré
  const maxW = width - padding * 2;
  const maxH = height - padding * 2;

  let boxW = maxW;
  let boxH = boxW / 2;

  if (boxH > maxH) {
    boxH = maxH;
    boxW = boxH * 2;
  }

  const cx = width / 2;
  const cy = height / 2;
  const x0 = cx - boxW / 2;
  const x1 = cx + boxW / 2;
  const y0 = cy - boxH / 2;
  const y1 = cy + boxH / 2;

  // Points géométriques fondamentaux d'Eckert IV
  const poleHalfW = boxW / 4; // L_pole = boxW / 2 => demi-largeur = boxW / 4
  const pNorthLeft = { x: cx - poleHalfW, y: y0 };
  const pNorthRight = { x: cx + poleHalfW, y: y0 };
  const pSouthRight = { x: cx + poleHalfW, y: y1 };
  const pSouthLeft = { x: cx - poleHalfW, y: y1 };
  const pEqRight = { x: x1, y: cy };
  const pEqLeft = { x: x0, y: cy };

  const rx = poleHalfW;
  const ry = boxH / 2;

  // Tracé intérieur de la silhouette Eckert IV
  const eckertPath = `
    M ${pNorthLeft.x},${pNorthLeft.y}
    L ${pNorthRight.x},${pNorthRight.y}
    A ${rx} ${ry} 0 0 1 ${pEqRight.x},${pEqRight.y}
    A ${rx} ${ry} 0 0 1 ${pSouthRight.x},${pSouthRight.y}
    L ${pSouthLeft.x},${pSouthLeft.y}
    A ${rx} ${ry} 0 0 1 ${pEqLeft.x},${pEqLeft.y}
    A ${rx} ${ry} 0 0 1 ${pNorthLeft.x},${pNorthLeft.y}
    Z
  `;

  // Masque extérieur (rectangle extra-large moins l'enveloppe Eckert IV pour couvrir le plein écran même zoomé)
  const maskPath = `
    M ${-width * 4},${-height * 4}
    L ${width * 5},${-height * 4}
    L ${width * 5},${height * 5}
    L ${-width * 4},${height * 5}
    Z
    ${eckertPath}
  `;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'hidden'
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <radialGradient id="eckertGlow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.25" />
          </radialGradient>
        </defs>

        <g
          transform={`translate(${cx + t.panX}, ${cy + t.panY}) scale(${t.zoom}) translate(${-cx}, ${-cy})`}
        >
          {/* Masque d'ombrage hors-monde */}
          <path
            d={maskPath}
            fill="rgba(7, 11, 20, 0.68)"
            fillRule="evenodd"
          />

          {/* Halo périphérique sur l'enveloppe */}
          <path
            d={eckertPath}
            fill="none"
            stroke="url(#eckertGlow)"
            strokeWidth={14 / t.zoom}
          />

          {/* Filet extérieur cyan d'atlas */}
          <path
            d={eckertPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2 / t.zoom}
            strokeOpacity={0.85}
          />

          {/* Double filet intérieur décoratif */}
          <path
            d={eckertPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth={1 / t.zoom}
            strokeDasharray={`${4 / t.zoom} ${4 / t.zoom}`}
          />

          {/* Ligne d'équateur repère */}
          <line
            x1={pEqLeft.x}
            y1={pEqLeft.y}
            x2={pEqRight.x}
            y2={pEqRight.y}
            stroke="rgba(56, 189, 248, 0.35)"
            strokeWidth={1 / t.zoom}
            strokeDasharray={`${6 / t.zoom} ${6 / t.zoom}`}
          />

          {/* Tropiques (Cancer +23.44° & Capricorne -23.44°) */}
          {(() => {
            const getParallel = (deg: number) => {
              const phi = (deg * Math.PI) / 180;
              let theta = phi / 2;
              const target = (2 + Math.PI / 2) * Math.sin(phi);
              for (let i = 0; i < 8; i++) {
                const s = Math.sin(theta);
                const c = Math.cos(theta);
                const f = theta + s * c + 2 * s - target;
                const fP = 2 * c * (c + 1);
                if (Math.abs(fP) < 1e-10) break;
                theta -= f / fP;
              }
              const y = cy - Math.sin(theta) * (boxH / 2);
              const halfW = (boxW / 2) * ((1 + Math.cos(theta)) / 2);
              return { y, x1: cx - halfW, x2: cx + halfW };
            };
            const cancer = getParallel(23.436);
            const capricorn = getParallel(-23.436);
            const arctic = getParallel(66.564);
            const antarctic = getParallel(-66.564);

            return (
              <>
                {/* Tropique du Cancer */}
                <line
                  x1={cancer.x1}
                  y1={cancer.y}
                  x2={cancer.x2}
                  y2={cancer.y}
                  stroke="rgba(251, 191, 36, 0.22)"
                  strokeWidth={1 / t.zoom}
                  strokeDasharray={`${4 / t.zoom} ${6 / t.zoom}`}
                />
                {/* Tropique du Capricorne */}
                <line
                  x1={capricorn.x1}
                  y1={capricorn.y}
                  x2={capricorn.x2}
                  y2={capricorn.y}
                  stroke="rgba(251, 191, 36, 0.22)"
                  strokeWidth={1 / t.zoom}
                  strokeDasharray={`${4 / t.zoom} ${6 / t.zoom}`}
                />
                {/* Cercle Polaire Arctique */}
                <line
                  x1={arctic.x1}
                  y1={arctic.y}
                  x2={arctic.x2}
                  y2={arctic.y}
                  stroke="rgba(147, 197, 253, 0.2)"
                  strokeWidth={1 / t.zoom}
                  strokeDasharray={`${2 / t.zoom} ${4 / t.zoom}`}
                />
                {/* Cercle Polaire Antarctique */}
                <line
                  x1={antarctic.x1}
                  y1={antarctic.y}
                  x2={antarctic.x2}
                  y2={antarctic.y}
                  stroke="rgba(147, 197, 253, 0.2)"
                  strokeWidth={1 / t.zoom}
                  strokeDasharray={`${2 / t.zoom} ${4 / t.zoom}`}
                />
              </>
            );
          })()}

          {/* Méridien central repère (Greenwich 0°) */}
          <line
            x1={cx}
            y1={y0}
            x2={cx}
            y2={y1}
            stroke="rgba(56, 189, 248, 0.3)"
            strokeWidth={1 / t.zoom}
            strokeDasharray={`${6 / t.zoom} ${6 / t.zoom}`}
          />
        </g>
      </svg>

      {/* Badge télémétrique d'information et contrôles interactifs HUD */}
      {showBadge && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '10px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            color: '#f1f5f9',
            fontSize: '0.8rem',
            lineHeight: 1.3,
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8'
                }}
              >
                <Globe size={15} />
              </div>
              <div style={{ fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Eckert IV (2D Équivalente)
                <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc' }}>
                  2:1
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowBadge(false)}
              title="Masquer le badge"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Conservation stricte des surfaces • Pôles = 50% Équateur
          </div>

          {/* Contrôles de navigation interactive et zoom */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={onTransitionToGlobe || onZoomIn}
                title="Plonger vers le Globe 3D avec vol animé"
                style={{
                  background: 'rgba(56, 189, 248, 0.18)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '4px',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  padding: '4px 9px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.74rem',
                  fontWeight: 500,
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)'; }}
              >
                <Globe size={13} />
                <span>Globe 3D</span>
              </button>

              {onZoomIn && (
                <button
                  onClick={onZoomIn}
                  title="Zoomer dans le planisphère"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={12} />
                </button>
              )}

              {onZoomOut && (
                <button
                  onClick={onZoomOut}
                  title="Dézoomer le planisphère"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Minus size={12} />
                </button>
              )}
            </div>

            {onReset && (
              <button
                onClick={onReset}
                title="Recentrer le planisphère"
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500
                }}
              >
                <RotateCcw size={12} />
                <span>Recentrer</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic' }}>
            Molette ou double-clic pour plonger dans le Globe 3D
          </div>
        </div>
      )}
    </div>
  );
};
