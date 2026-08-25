// app/components/ia/IASettingsHeader.tsx

import React from 'react';
import { Wifi, WifiOff, Settings } from 'lucide-react';

interface IASettingsHeaderProps {
  ollamaConnected: boolean;
  checkingConnection: boolean;
  showSettings: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string;
  onToggleSettings: () => void;
  onChangeBaseUrl: (url: string) => void;
  onChangeModel: (model: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const IASettingsHeader: React.FC<IASettingsHeaderProps> = ({
  ollamaConnected,
  checkingConnection,
  showSettings,
  ollamaBaseUrl,
  ollamaModel,
  onToggleSettings,
  onChangeBaseUrl,
  onChangeModel,
  onConnect,
  onDisconnect,
}) => {
  return (
    <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
          {checkingConnection ? (
            <span style={{ color: 'var(--text-muted)' }}>Vérification Ollama…</span>
          ) : ollamaConnected ? (
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wifi size={14} /> Connecté à Ollama ({ollamaModel})
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <WifiOff size={14} /> IA Mock locale (Ollama non détecté)
            </span>
          )}
        </div>

        <button className="icon-btn" onClick={onToggleSettings} title="Paramètres IA">
          <Settings size={15} />
        </button>
      </div>

      {showSettings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
          <input
            type="text"
            className="input-field"
            placeholder="URL Ollama (ex: http://localhost:11434)"
            value={ollamaBaseUrl}
            onChange={(e) => onChangeBaseUrl(e.target.value)}
            style={{ fontSize: '0.78rem' }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Modèle Ollama (ex: llama2, mistral)"
            value={ollamaModel}
            onChange={(e) => onChangeModel(e.target.value)}
            style={{ fontSize: '0.78rem' }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            {!ollamaConnected ? (
              <button className="btn btn-primary" onClick={onConnect} style={{ fontSize: '0.75rem', flex: 1 }}>
                Se connecter à Ollama
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={onDisconnect} style={{ fontSize: '0.75rem', flex: 1 }}>
                Déconnecter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
