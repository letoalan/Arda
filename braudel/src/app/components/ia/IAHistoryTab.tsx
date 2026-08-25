// app/components/ia/IAHistoryTab.tsx

import React from 'react';
import { History } from 'lucide-react';
import type { AISession } from '../../../types/ia';

interface IAHistoryTabProps {
  aiSessions: AISession[];
}

export const IAHistoryTab: React.FC<IAHistoryTabProps> = ({ aiSessions }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <History size={14} /> Historique des Sessions IA ({aiSessions.length})
      </h4>

      {aiSessions.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Aucune session enregistrée pour le moment.
        </div>
      ) : (
        <div className="list-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {aiSessions.map((session) => (
            <div key={session.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {session.instruction}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>Tâche : {session.task}</span>
                <span>{new Date(session.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
