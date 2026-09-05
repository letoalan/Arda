import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { LayerPanel } from './views/LayerPanel';
import { EntityPanel } from './views/EntityPanel';
import { NetworkPanel } from './views/NetworkPanel';
import { StylePanel } from './views/StylePanel';
import { ClimatPanel } from './views/ClimatPanel';
import { GeopoliticaPanel } from './views/GeopoliticaPanel';
import { DataPanel } from './views/DataPanel';
import { IAPanel } from './views/IAPanel';
import { TimelineView } from './views/TimelineView';
import { MapView } from './views/MapView';
import { NetworkGraphView } from './views/NetworkGraphView';
import { WelcomeScreen } from './views/WelcomeScreen';
import { ContinentBuilderView } from './views/ContinentBuilderView';
import { WikiPagePanel } from './views/WikiPagePanel';
import { useStore } from './state/store';
import { Menu, X, Hand, Home } from 'lucide-react';
import { mapService } from '../services/cartography/map-service';

const WorkspaceContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    initFromDB, 
    saveToDB, 
    world, 
    isLoading, 
    viewMode, 
    prometheanMode, 
    togglePrometheanMode, 
    isStudioMode,
    studioLayoutMode 
  } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redimensionnement automatique de la carte lors de l'entrée/sortie du Mode Studio ou bascule 2 écrans
  useEffect(() => {
    const timeout = setTimeout(() => {
      const map = mapService.getMap();
      if (map && typeof map.resize === 'function') {
        map.resize();
      }
    }, 60);
    return () => clearTimeout(timeout);
  }, [isStudioMode, studioLayoutMode]);

  // Initialize/load world by ID from IndexedDB if not already loaded in state
  useEffect(() => {
    if (id && (!world.world || world.world.length === 0 || world.world[0].id !== id)) {
      initFromDB(id);
    }
  }, [id, initFromDB, world.world]);

  // Debounced auto-save to database
  useEffect(() => {
    if (isLoading || !world.world || world.world.length === 0 || world.world[0].id !== id) return;

    const timeout = setTimeout(() => {
      saveToDB();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [world, saveToDB, isLoading, id]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  // World not found or loaded yet
  if (!world.world || world.world.length === 0 || world.world[0].id !== id) {
    return (
      <div className="loading-screen" style={{ flexDirection: 'column', gap: '16px', color: 'var(--text-primary)' }}>
        <span>Chargement du monde ou monde introuvable...</span>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  // Fictional world without geography
  if (world.world[0].worldType === 'fictional' && world.entities.length === 0 && !world.world[0].continents) {
    return <ContinentBuilderView />;
  }

  return (
    <div className={`app-container ${prometheanMode ? 'promethean-mode' : ''}`}>
      {/* Sidebar toggle button (Mobile only) */}
      {!isStudioMode && (
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Menu"
          style={{ left: sidebarOpen ? '296px' : '16px', transition: 'left 0.3s ease' }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Sidebar for Panels */}
      <div 
        className={`sidebar-panel panel ${sidebarOpen ? 'open' : ''}`}
        style={isStudioMode ? { display: 'none' } : undefined}
      >
        <div className="panel-header" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
            <button
              className="icon-btn"
              onClick={() => navigate('/')}
              title="Retour à l'accueil"
              style={{ padding: '4px', flexShrink: 0 }}
            >
              <Home size={16} />
            </button>
            <h2 style={{ margin: 0, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {world.world[0]?.name || 'Projet Arda'}
            </h2>
          </div>
          <button
            className={`btn ${prometheanMode ? 'btn-primary' : ''}`}
            onClick={togglePrometheanMode}
            title="Mode interactif Promethean (Tactile/Stylet)"
            style={{ padding: '4px 6px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', flexShrink: 0 }}
          >
            <Hand size={12} /> Stylet
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <LayerPanel />
          <EntityPanel />
          <NetworkPanel />
          <StylePanel />
          <ClimatPanel />
          <GeopoliticaPanel />
          <DataPanel />
          <IAPanel />
        </div>
      </div>

      {/* Main Map View or Network View */}
      <div 
        className="main-view-container"
        style={isStudioMode ? {
          position: 'fixed',
          top: '52px',
          left: 0,
          width: studioLayoutMode === 'single' ? '0px' : '50%',
          height: 'calc(100vh - 52px - 340px)',
          zIndex: 99990,
          display: studioLayoutMode === 'single' ? 'none' : 'flex',
          borderRight: '1px solid rgba(168, 85, 247, 0.3)',
          overflow: 'hidden'
        } : undefined}
      >
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          {viewMode === 'network' ? <NetworkGraphView /> : <MapView />}
        </div>
        {!isStudioMode && <TimelineView />}
      </div>

      {/* Extension Wiki Overlay */}
      <WikiPagePanel />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/world/:id" element={<WorkspaceContainer />} />
      </Routes>
    </HashRouter>
  );
};
export default App;
