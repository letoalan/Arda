// views/StylePanel.tsx

import React, { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { Palette, RefreshCw, Eye, Globe as GlobeIcon } from 'lucide-react';
import { mapService } from '../../services/cartography/map-service';
import { STYLE_CONFIGS } from '../../core/styles.config';
import { ReliefControlsSection } from '../components/style/ReliefControlsSection';

// Tri chronologique des fonds historiques et contemporains
const ERA_ORDER: Record<string, number> = {
  antiquity: -3000,
  al_idrisi: 1154,
  medieval: 1375,
  renaissance: 1662,
  modern: 1750,
  colonial: 1914,
  military_staff_ww1_ww2: 1918,
  journalism_60s_70s: 1965,
  military_tactical_wargames: 1983,
  journalism_electro_80s: 1985,
  cnn_broadcast_90s_00s: 1995,
  contemporary_current: 2024,
  contemporary_national_geographic: 2024.1,
  contemporary_satellite: 2024.2,
  nasa_night_lights: 2024.25,
  contemporary_positron_lite: 2024.3,
  futuristic_cyberpunk_neon: 2099,
};

export const StylePanel: React.FC = () => {
  const { 
    world, 
    updateReliefStyle, 
    basemapStyle, 
    setBasemapStyle, 
    basemapLabelsVisible,
    setBasemapLabelsVisible,
    basemapBordersVisible,
    setBasemapBordersVisible,
    basemapRoadsVisible,
    setBasemapRoadsVisible,
    basemapRiversVisible,
    setBasemapRiversVisible,
    geoReferenceLinesVisible,
    setGeoReferenceLinesVisible,
    portulanRhumbVisible,
    setPortulanRhumbVisible,
    graticuleVisible,
    setGraticuleVisible,
    mapProjection,
    setMapProjection,
  } = useStore();
  const reliefStyle = world.styles.find(s => s.type === 'relief');
  const isFictional = world.world[0]?.worldType === 'fictional';

  const reliefProps = reliefStyle?.properties as {
    exaggeration?: number;
    shadowColor?: string;
    highlightColor?: string;
  } | undefined;

  const [exaggeration, setExaggeration] = useState<number>(
    typeof reliefProps?.exaggeration === 'number' ? reliefProps.exaggeration : 0.5
  );
  const [shadowColor, setShadowColor] = useState<string>(
    typeof reliefProps?.shadowColor === 'string' ? reliefProps.shadowColor : '#000000'
  );
  const [highlightColor, setHighlightColor] = useState<string>(
    typeof reliefProps?.highlightColor === 'string' ? reliefProps.highlightColor : '#FFFFFF'
  );

  useEffect(() => {
    if (isFictional) {
      const currentConfig = STYLE_CONFIGS.find(s => s.id === basemapStyle);
      if (!currentConfig || (currentConfig.mode !== 'tolkien' && currentConfig.mode !== 'both')) {
        setBasemapStyle('tolkien_high_fantasy');
      }
    }
  }, [isFictional, basemapStyle, setBasemapStyle]);

  useEffect(() => {
    if (reliefStyle?.properties) {
      const props = reliefStyle.properties as {
        exaggeration?: number;
        shadowColor?: string;
        highlightColor?: string;
      };
      if (typeof props.exaggeration === 'number') setExaggeration(props.exaggeration);
      if (typeof props.shadowColor === 'string') setShadowColor(props.shadowColor);
      if (typeof props.highlightColor === 'string') setHighlightColor(props.highlightColor);
    }
  }, [reliefStyle]);

  const applyChanges = () => {
    updateReliefStyle(exaggeration, shadowColor, highlightColor);
  };

  const applyPreset = (preset: 'soft' | 'dramatic') => {
    if (preset === 'soft') {
      updateReliefStyle(0.3, '#333333', '#ffffff');
    } else {
      updateReliefStyle(1.5, '#000000', '#ffebcd');
    }
  };

  const historicalStyles = STYLE_CONFIGS
    .filter(s => s.mode === 'braudel' || s.mode === 'both')
    .filter(s => !s.id.startsWith('tolkien'))
    .sort((a, b) => (ERA_ORDER[a.id] || 9999) - (ERA_ORDER[b.id] || 9999));

  const tolkienStyles = STYLE_CONFIGS
    .filter(s => s.mode === 'tolkien' || s.id.startsWith('tolkien'));

  return (
    <div className="panel-content" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
        <Palette size={18} /> Styles & Projections Cartographiques
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isFictional && (
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => mapService.regenerateFictionalRelief()} 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} /> Régénérer la Topographie
            </button>
          </div>
        )}

        {/* 1. Sélection du fond de carte (Chronologique & Espace Dédié Tolkien) */}
        <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
            Fond de carte (Ordre Chronologique)
          </label>
          <select
            className="input-field"
            value={basemapStyle}
            onChange={(e: any) => setBasemapStyle(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <optgroup label="📜 Atlas & Cartes Historiques (Tri Chronologique)">
              {historicalStyles.map(style => (
                <option key={style.id} value={style.id}>
                  {style.name} ({style.era})
                </option>
              ))}
            </optgroup>
            
            <optgroup label="🗡️ Univers Imaginaires & Fantasy (Tolkien)">
              {tolkienStyles.map(style => (
                <option key={style.id} value={style.id}>
                  {style.name} ({style.era})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* 2. Repères & Éléments de Carte à la Demande */}
        <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={16} /> Visibilité des Repères & Éléments
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={basemapBordersVisible} 
              onChange={(e) => setBasemapBordersVisible(e.target.checked)} 
              style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
            />
            Frontières & limites politiques d'États
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={basemapLabelsVisible} 
              onChange={(e) => setBasemapLabelsVisible(e.target.checked)} 
              style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
            />
            Noms de villes, capitales & repères urbains
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={basemapRoadsVisible} 
              onChange={(e) => setBasemapRoadsVisible(e.target.checked)} 
              style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
            />
            Réseaux de communication (routes, voies ferrées, transport)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={basemapRiversVisible} 
              onChange={(e) => setBasemapRiversVisible(e.target.checked)} 
              style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
            />
            Fleuves, rivières & cours d'eau
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={geoReferenceLinesVisible} 
              onChange={(e) => setGeoReferenceLinesVisible(e.target.checked)} 
              style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
            />
            Lignes géographiques (Équateur, Tropiques, Méridiens)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={portulanRhumbVisible} 
              onChange={(e) => setPortulanRhumbVisible(e.target.checked)} 
              style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
            />
            Lignes de rhumb & réseau portulan (32 vents)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={graticuleVisible} 
              onChange={(e) => setGraticuleVisible(e.target.checked)} 
              style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
            />
            Méridiens & parallèles (Graticule vectoriel 10°)
          </label>
        </div>

        {/* 3. Sélecteur de Projections Cartographiques */}
        <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GlobeIcon size={16} /> Projection Cartographique
          </label>
          <select
            className="input-field"
            value={mapProjection}
            onChange={(e: any) => setMapProjection(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <option value="mercator">Web Mercator (Plat 2D Standard)</option>
            <option value="globe">Globe 3D Sphérique (Orthographique)</option>
          </select>
        </div>

        {/* 4. Contrôles du Relief 3D DEM */}
        <ReliefControlsSection
          exaggeration={exaggeration}
          shadowColor={shadowColor}
          highlightColor={highlightColor}
          onChangeExaggeration={setExaggeration}
          onChangeShadowColor={setShadowColor}
          onChangeHighlightColor={setHighlightColor}
          onApplyChanges={applyChanges}
          onApplyPreset={applyPreset}
        />
      </div>
    </div>
  );
};

