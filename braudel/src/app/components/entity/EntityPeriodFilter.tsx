// app/components/entity/EntityPeriodFilter.tsx

import React from 'react';
import { Calendar } from 'lucide-react';

interface EntityPeriodFilterProps {
  entityPeriodFilter: string;
  closestPeriod: any;
  availablePeriods: any[];
  onChangeFilter: (val: string) => void;
}

export const EntityPeriodFilter: React.FC<EntityPeriodFilterProps> = ({
  entityPeriodFilter,
  closestPeriod,
  availablePeriods,
  onChangeFilter,
}) => {
  return (
    <div
      style={{
        marginBottom: '12px',
        padding: '10px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Calendar size={13} color="var(--accent-primary)" />
        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Période historique d'édition :
        </label>
      </div>
      <select
        className="select-field"
        value={entityPeriodFilter}
        onChange={(e) => onChangeFilter(e.target.value)}
        style={{ fontSize: '0.75rem', padding: '5px 8px' }}
      >
        <option value="all">Toutes les entités</option>
        <option value="active">📍 Curseur ({closestPeriod ? closestPeriod.label : 'Aucun'})</option>
        {availablePeriods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
};
