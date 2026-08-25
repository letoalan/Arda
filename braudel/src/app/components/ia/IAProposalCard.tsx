// app/components/ia/IAProposalCard.tsx

import React from 'react';
import { Check, X, Eye, HelpCircle } from 'lucide-react';
import type { AIProposal } from '../../../types/ia';

interface IAProposalCardProps {
  proposal: AIProposal;
  isSelected: boolean;
  onSelect: (proposal: AIProposal) => void;
  onAccept: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
}

export const IAProposalCard: React.FC<IAProposalCardProps> = ({
  proposal,
  isSelected,
  onSelect,
  onAccept,
  onReject,
}) => {
  const isAccepted = proposal.status === 'accepted';
  const isRejected = proposal.status === 'rejected';

  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
          {proposal.type === 'addEntity' ? '📍 Entité proposée' : '🔗 Relation proposée'}
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: isAccepted ? 'rgba(16, 185, 129, 0.2)' : isRejected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: isAccepted ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B',
          }}
        >
          {isAccepted ? 'Acceptée' : isRejected ? 'Rejetée' : 'En attente'}
        </span>
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        {(proposal as any).reasoning || (proposal.data as any)?.name || 'Proposition automatique'}
      </div>

      {proposal.confidence !== undefined && (
        <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HelpCircle size={12} /> Confiance : {Math.round(proposal.confidence * 100)}%
        </div>
      )}

      {proposal.status === 'pending' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            onClick={() => onSelect(proposal)}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 8px', flex: 1 }}
          >
            <Eye size={13} /> Examiner
          </button>
          <button
            onClick={() => onAccept(proposal.id)}
            className="btn btn-primary"
            style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: '#10B981', borderColor: '#10B981' }}
          >
            <Check size={13} /> Accepter
          </button>
          <button
            onClick={() => onReject(proposal.id)}
            className="btn"
            style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#EF4444' }}
          >
            <X size={13} /> Rejeter
          </button>
        </div>
      )}
    </div>
  );
};
