// views/ProposalReviewModal.tsx

import React, { useState } from 'react';
import { useStore } from '../state/store';
import { aiService } from '../../services/ia/ai-service';
import { AIProposal } from '../../types/ia';
import { X, Check, Plus, Sparkles, Layers, Loader2 } from 'lucide-react';
import { ProposalSubEntitiesList } from '../components/ia/ProposalSubEntitiesList';

interface ProposalReviewModalProps {
  proposal: AIProposal | null;
  onClose: () => void;
}

export const ProposalReviewModal: React.FC<ProposalReviewModalProps> = ({ proposal, onClose }) => {
  const { 
    acceptAiProposal, 
    rejectAiProposal, 
    toggleProposalSubEntity, 
    addSubEntityToProposal, 
    removeSubEntityFromProposal 
  } = useStore();

  const [newSubName, setNewSubName] = useState('');
  const [newSubType, setNewSubType] = useState('place');
  const [isGeneratingSub, setIsGeneratingSub] = useState(false);

  if (!proposal || proposal.status !== 'pending') {
    return null;
  }

  const subEntities = proposal.subEntities || [];
  const selectedSubCount = subEntities.filter(s => s.selected !== false).length;
  const parentName = (proposal.data as any)?.name || (proposal.data as any)?.instruction || 'Proposition IA';

  const handleAddCustomChoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    addSubEntityToProposal(proposal.id, newSubName.trim(), newSubType);
    setNewSubName('');
  };

  const handleGenerateSubEntitiesAI = async () => {
    setIsGeneratingSub(true);
    try {
      const generated = await (aiService as any).breakdownEntitySubEntities?.(proposal);
      if (Array.isArray(generated)) {
        for (const sub of generated) {
          addSubEntityToProposal(proposal.id, sub.name, sub.type, sub.geometry);
        }
      }
    } catch (err) {
      console.error("Échec de la génération des sous-entités:", err);
    } finally {
      setIsGeneratingSub(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-primary, #0f172a)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-primary, #f8fafc)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={20} color="var(--accent-primary, #3b82f6)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Inspection & Édition des Choix IA</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                {parentName} (Confiance : {Math.round(proposal.confidence * 100)}%)
              </span>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
            <strong>Raisonnement :</strong> {(proposal as any).reasoning || 'Non renseigné'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Sous-éléments à intégrer ({selectedSubCount} / {subEntities.length})
            </span>
            <button 
              onClick={handleGenerateSubEntitiesAI}
              className="btn btn-secondary"
              disabled={isGeneratingSub}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              {isGeneratingSub ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Suggestions IA
            </button>
          </div>

          <ProposalSubEntitiesList
            subEntities={subEntities}
            onToggleSubEntity={(subId) => toggleProposalSubEntity(proposal.id, subId)}
            onRemoveSubEntity={(subId) => removeSubEntityFromProposal(proposal.id, subId)}
          />

          <form onSubmit={handleAddCustomChoice} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Ajouter un sous-élément personnalisé..."
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              style={{ flex: 1, fontSize: '0.82rem' }}
            />
            <select 
              className="select-field"
              value={newSubType} 
              onChange={(e) => setNewSubType(e.target.value)}
              style={{ width: '110px', fontSize: '0.82rem' }}
            >
              <option value="place">Lieu</option>
              <option value="actor">Acteur</option>
              <option value="event">Événement</option>
            </select>
            <button type="submit" className="btn btn-secondary" disabled={!newSubName.trim()}>
              <Plus size={14} />
            </button>
          </form>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color, #334155)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => { rejectAiProposal(proposal.id); onClose(); }} 
            className="btn" 
            style={{ color: '#ef4444' }}
          >
            <X size={16} /> Rejeter Tout
          </button>
          <button 
            onClick={() => { acceptAiProposal(proposal.id); onClose(); }} 
            className="btn btn-primary"
          >
            <Check size={16} /> Valider l'Intégration ({selectedSubCount + 1})
          </button>
        </div>
      </div>
    </div>
  );
};
