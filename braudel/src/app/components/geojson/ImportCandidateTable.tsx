// app/components/geojson/ImportCandidateTable.tsx

import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { ImportCandidate } from '../../../services/import/candidateIndexer';

interface ImportCandidateTableProps {
  candidates: ImportCandidate[];
  selectedIds: Set<string>;
  onToggleCandidate: (tempId: string) => void;
}

export const ImportCandidateTable: React.FC<ImportCandidateTableProps> = ({
  candidates,
  selectedIds,
  onToggleCandidate,
}) => {
  return (
    <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color, #333)', borderRadius: '6px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: 'rgba(255, 255, 255, 0.05)', textAlign: 'left', borderBottom: '1px solid var(--border-color, #333)' }}>
            <th style={{ padding: '8px 12px', width: '40px' }}></th>
            <th style={{ padding: '8px 12px' }}>Entité / Région</th>
            <th style={{ padding: '8px 12px' }}>Type Géométrie</th>
            <th style={{ padding: '8px 12px' }}>Période / Année</th>
            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Taille estimée</th>
          </tr>
        </thead>
        <tbody>
          {candidates.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#888' }}>
                Aucune entité trouvée.
              </td>
            </tr>
          ) : (
            candidates.map((c) => {
              const isSelected = selectedIds.has(c.tempId);
              return (
                <tr
                  key={c.tempId}
                  onClick={() => onToggleCandidate(c.tempId)}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '8px 12px' }}>
                    {isSelected ? <CheckSquare size={16} color="var(--accent-primary, #3b82f6)" /> : <Square size={16} color="#666" />}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                    {c.name}
                    {c.continent && <span style={{ fontSize: '0.72rem', color: '#888', marginLeft: '6px' }}>({c.continent})</span>}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#aaa', textTransform: 'capitalize' }}>
                    {c.geometryType}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#aaa' }}>
                    {(c as any).validFrom ?? -3000} à {(c as any).validTo ?? 2100}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#888' }}>
                    {c.approxSizeKB < 1 ? '<1 KB' : `${c.approxSizeKB} KB`}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
