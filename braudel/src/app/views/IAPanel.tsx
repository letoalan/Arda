// views/IAPanel.tsx

import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/ia/ai-service';
import type { AiTask } from '../../core/schema/ai';
import type { AIProposal } from '../../types/ia';
import { useStore } from '../state/store';
import { Bot, Sparkles, Loader2 } from 'lucide-react';
import { ProposalReviewModal } from './ProposalReviewModal';
import { IASettingsHeader } from '../components/ia/IASettingsHeader';
import { IAHistoryTab } from '../components/ia/IAHistoryTab';
import { IAProposalCard } from '../components/ia/IAProposalCard';

export const IAPanel: React.FC = () => {
  const { world, addAiProposal, acceptAiProposal, rejectAiProposal, aiProposals, selectedProposal, aiSessions, addAiSession } = useStore();

  const [instruction, setInstruction] = useState('');
  const [selectedTask, setSelectedTask] = useState<AiTask>('generateEntity');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generator' | 'proposals' | 'history'>('generator');
  const [reviewModalProposal, setReviewModalProposal] = useState<AIProposal | null>(null);
  
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama2');

  useEffect(() => {
    checkOllamaConnection();
  }, []);

  const checkOllamaConnection = async () => {
    try {
      const connected = await aiService.isOllamaConnected();
      setOllamaConnected(connected);
    } catch {
      setOllamaConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleConnectToOllama = async () => {
    try {
      const connected = await aiService.connectToOllama({
        baseUrl: ollamaBaseUrl,
        model: ollamaModel,
      });
      setOllamaConnected(connected);
      if (!connected) setError('Impossible de se connecter à Ollama.');
      else setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  };

  const handleAsk = async () => {
    if (!instruction.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const session = await aiService.createSession(
        world.world[0]?.id || '',
        selectedTask,
        instruction,
        {}
      );
      addAiSession(session);

      const proposal = await aiService.generateProposal({
        task: selectedTask,
        instruction: instruction,
        input: instruction,
        context: { sessionId: session.id, worldId: world.world[0]?.id }
      });

      addAiProposal(proposal);
      setInstruction('');
      setActiveTab('proposals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-content" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
        <Bot size={16} /> Assistant IA & Modélisation
      </h3>

      <IASettingsHeader
        ollamaConnected={ollamaConnected}
        checkingConnection={checkingConnection}
        showSettings={showSettings}
        ollamaBaseUrl={ollamaBaseUrl}
        ollamaModel={ollamaModel}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onChangeBaseUrl={setOllamaBaseUrl}
        onChangeModel={setOllamaModel}
        onConnect={handleConnectToOllama}
        onDisconnect={() => { aiService.disconnectFromOllama(); setOllamaConnected(false); }}
      />

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', margin: '12px 0 16px 0' }}>
        <button className={`btn ${activeTab === 'generator' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('generator')} style={{ flex: 1, borderRadius: 0, fontSize: '0.75rem' }}>Générateur</button>
        <button className={`btn ${activeTab === 'proposals' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('proposals')} style={{ flex: 1, borderRadius: 0, fontSize: '0.75rem' }}>Propositions ({aiProposals.length})</button>
        <button className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('history')} style={{ flex: 1, borderRadius: 0, fontSize: '0.75rem' }}>Historique</button>
      </div>

      {activeTab === 'generator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select className="select-field" value={selectedTask} onChange={(e) => setSelectedTask(e.target.value as any)}>
            <option value="generateEntity">Générer Entité Historique</option>
            <option value="generateRelation">Suggérer Relation Réseau</option>
            <option value="suggestName">Suggérer Dénomination</option>
          </select>

          <textarea
            className="input-field"
            rows={3}
            placeholder="Instruction IA (ex: Génère la République de Venise en 1450...)"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />

          <button className="btn btn-primary" onClick={handleAsk} disabled={loading || !instruction.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Générer avec l'IA
          </button>

          {error && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '4px' }}>{error}</div>}
        </div>
      )}

      {activeTab === 'proposals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
          {aiProposals.map(p => (
            <IAProposalCard
              key={p.id}
              proposal={p}
              isSelected={selectedProposal?.id === p.id}
              onSelect={() => setReviewModalProposal(p)}
              onAccept={acceptAiProposal}
              onReject={rejectAiProposal}
            />
          ))}
        </div>
      )}

      {activeTab === 'history' && <IAHistoryTab aiSessions={aiSessions} />}

      <ProposalReviewModal
        proposal={reviewModalProposal}
        onClose={() => setReviewModalProposal(null)}
      />
    </div>
  );
};
