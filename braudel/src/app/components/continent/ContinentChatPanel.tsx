// app/components/continent/ContinentChatPanel.tsx

import React from 'react';
import { MessageSquare, Paperclip, Loader2, Sparkles, Check, X } from 'lucide-react';
import type { TerrainFeatureDraft } from '../../views/ContinentBuilderView';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface ContinentChatPanelProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  pendingFiles: File[];
  proposedDrafts: TerrainFeatureDraft[];
  aiLoading: boolean;
  onChatInputChange: (val: string) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onSendMessage: () => void;
  onAcceptProposal: () => void;
  onRejectProposal: () => void;
}

export const ContinentChatPanel: React.FC<ContinentChatPanelProps> = ({
  chatMessages,
  chatInput,
  pendingFiles,
  proposedDrafts,
  aiLoading,
  onChatInputChange,
  onAddFiles,
  onRemoveFile,
  onSendMessage,
  onAcceptProposal,
  onRejectProposal,
}) => {
  return (
    <div style={{ width: '320px', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={16} color="var(--accent-primary)" /> Assistant Cartographe IA
      </div>

      <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
              fontSize: '0.8rem',
              lineHeight: '1.4',
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {proposedDrafts.length > 0 && (
        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderTop: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
            {proposedDrafts.length} tracé(s) proposé(s) par l'IA
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-primary" onClick={onAcceptProposal} style={{ flex: 1, fontSize: '0.75rem', padding: '4px', gap: '4px', justifyContent: 'center' }}>
              <Check size={14} /> Valider
            </button>
            <button className="btn" onClick={onRejectProposal} style={{ flex: 1, fontSize: '0.75rem', padding: '4px', gap: '4px', justifyContent: 'center', color: '#ef4444' }}>
              <X size={14} /> Rejeter
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pendingFiles.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {pendingFiles.map((f, idx) => (
              <span key={idx} style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {f.name} <X size={12} style={{ cursor: 'pointer' }} onClick={() => onRemoveFile(idx)} />
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px' }}>
          <label className="icon-btn" style={{ padding: '6px', cursor: 'pointer' }} title="Joindre une image (croquis)">
            <Paperclip size={16} />
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && onAddFiles(Array.from(e.target.files))}
            />
          </label>

          <input
            type="text"
            className="input-field"
            placeholder="Instruction IA..."
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
            style={{ fontSize: '0.8rem', flex: 1 }}
          />

          <button className="btn btn-primary" onClick={onSendMessage} disabled={aiLoading || (!chatInput.trim() && pendingFiles.length === 0)} style={{ padding: '6px 10px' }}>
            {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
};
