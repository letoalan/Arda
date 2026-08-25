// views/WelcomeScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../state/store';
import { useNavigate } from 'react-router-dom';
import { Globe, Upload, Sparkles, ArrowRight } from 'lucide-react';
import { WorldOriginStep } from './WorldOriginStep';
import { ExistingWorldsList } from '../components/welcome/ExistingWorldsList';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { 
    createRealWorld, 
    createFictionalWorld, 
    importWorldFile, 
    worldsList, 
    deleteWorld, 
    duplicateWorld, 
    initFromDB 
  } = useStore();

  const [worldName, setWorldName] = useState('');
  const [worldDescription, setWorldDescription] = useState('');
  const [startYear, setStartYear] = useState<number>(-3000);
  const [endYear, setEndYear] = useState<number>(2100);
  const [isCreating, setIsCreating] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initFromDB();
  }, [initFromDB]);

  const handleWorldTypeSelected = async (worldType: 'real' | 'fictional', selectedBasemap?: any) => {
    if (!worldName.trim()) return;
    
    setIsCreating(true);
    try {
      let id;
      if (worldType === 'real') {
        id = await createRealWorld(worldName.trim(), worldDescription.trim() || undefined, selectedBasemap, startYear, endYear);
      } else {
        id = await createFictionalWorld(worldName.trim(), worldDescription.trim() || undefined, startYear, endYear);
      }
      if (id) {
        navigate(`/world/${id}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreate = () => {
    if (!worldName.trim()) return;
    setStep(2);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const id = await importWorldFile(file);
      if (id) {
        navigate(`/world/${id}`);
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Erreur d'import");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && worldName.trim()) {
      handleCreate();
    }
  };

  const handleDuplicate = async (worldId: string, originalName: string) => {
    const newName = prompt('Nom du monde dupliqué :', `Copie de ${originalName}`);
    if (newName && newName.trim()) {
      await duplicateWorld(worldId, newName.trim());
    }
  };

  const handleDelete = async (worldId: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le monde "${name}" et toutes ses entités ?`)) {
      await deleteWorld(worldId);
    }
  };

  return (
    <div className="welcome-screen" style={{ overflowY: 'auto', padding: '40px 20px' }}>
      <div className="welcome-backdrop" />
      <div className="welcome-container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        <div className="welcome-header">
          <div className="welcome-logo">
            <Globe size={48} strokeWidth={1.5} />
          </div>
          <h1 className="welcome-title">Arda</h1>
          <p className="welcome-subtitle">Modélisation spatio-temporelle & SIG Narratif</p>
        </div>

        {step === 1 ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} /> Créer un nouveau monde
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nom du monde (ex: Méditerranée au XVIe s., Arda...)"
                  value={worldName}
                  onChange={(e) => setWorldName(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                
                <textarea
                  className="input-field"
                  placeholder="Description optionnelle..."
                  rows={2}
                  value={worldDescription}
                  onChange={(e) => setWorldDescription(e.target.value)}
                  style={{ resize: 'none' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Début (Année)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={startYear}
                      onChange={(e) => setStartYear(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Fin (Année)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={endYear}
                      onChange={(e) => setEndYear(Number(e.target.value))}
                    />
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleCreate}
                  disabled={!worldName.trim() || isCreating}
                  style={{ padding: '10px', fontSize: '0.9rem', width: '100%', gap: '8px' }}
                >
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" style={{ display: 'none' }} />
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ gap: '8px' }}>
                <Upload size={16} /> Importer un monde existant (JSON)
              </button>
              {importError && <div style={{ color: 'var(--accent-danger)', fontSize: '0.8rem', marginTop: '8px' }}>{importError}</div>}
            </div>

            <ExistingWorldsList
              worldsList={worldsList}
              onOpenWorld={(id) => navigate(`/world/${id}`)}
              onDuplicateWorld={handleDuplicate}
              onDeleteWorld={handleDelete}
            />
          </div>
        ) : (
          <WorldOriginStep
            onWorldTypeSelected={handleWorldTypeSelected}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
};
