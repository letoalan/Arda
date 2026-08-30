// views/EntityPanel.tsx

import React, { useState, useMemo } from 'react';
import { useStore } from '../state/store';
import { mapService } from '../../services/cartography/map-service';
import { GEOPOLITICA_SOURCES } from '../../services/import/geopoliticaRegistry';
import type { Entity } from '../../core/schema/types';
import { Box } from 'lucide-react';
import { EntityAddForm } from '../components/entity/EntityAddForm';
import { EntityRelationsSection } from '../components/entity/EntityRelationsSection';
import { EntityPeriodFilter } from '../components/entity/EntityPeriodFilter';
import { EntityDrawingNotice } from '../components/entity/EntityDrawingNotice';
import { EntityDetailsCard } from '../components/entity/EntityDetailsCard';
import { EntityListItem } from '../components/entity/EntityListItem';

export const EntityPanel: React.FC = () => {
  const { 
    world, 
    addEntity, 
    removeEntity, 
    selectedEntityId, 
    setSelectedEntity, 
    updateEntity,
    clearEntityGeometry, 
    addRelation,
    currentTime,
    setCurrentTime,
    startYear,
    endYear
  } = useStore();
  
  const selectedEntity = selectedEntityId ? world.entities.find(e => e.id === selectedEntityId) : null;
  const [drawingEntityId, setDrawingEntityId] = useState<string | null>(null);

  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('#3B82F6');
  const [editType, setEditType] = useState<string>('place');
  const [editFrom, setEditFrom] = useState<string>('');
  const [editTo, setEditTo] = useState<string>('');
  const [entityPeriodFilter, setEntityPeriodFilter] = useState<string>('active');

  const effectiveStart = typeof startYear === 'number' ? startYear : -3000;
  const effectiveEnd = typeof endYear === 'number' ? endYear : 2100;
  const availablePeriods = useMemo(() =>
    [...GEOPOLITICA_SOURCES]
      .sort((a, b) => a.referenceYear - b.referenceYear)
      .filter(s => s.referenceYear >= effectiveStart && s.referenceYear <= effectiveEnd),
    [effectiveStart, effectiveEnd]
  );

  const closestPeriod = useMemo(() => {
    if (!availablePeriods.length) return null;
    let closest = availablePeriods[0];
    let minDiff = Math.abs(availablePeriods[0].referenceYear - currentTime);
    for (const source of availablePeriods) {
      const diff = Math.abs(source.referenceYear - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = source;
      }
    }
    return closest;
  }, [availablePeriods, currentTime]);

  const filteredEntities = useMemo(() => {
    if (entityPeriodFilter === 'all') return world.entities;

    let targetYear: number | null = null;
    if (entityPeriodFilter === 'active' && closestPeriod) {
      targetYear = closestPeriod.referenceYear;
    } else {
      const selected = availablePeriods.find(p => p.id === entityPeriodFilter);
      if (selected) targetYear = selected.referenceYear;
    }

    if (targetYear === null) return world.entities;

    return world.entities.filter(entity => {
      if (!entity.temporalRange) return true;
      return (
        entity.temporalRange.validFrom <= targetYear! &&
        entity.temporalRange.validTo >= targetYear!
      );
    });
  }, [world.entities, entityPeriodFilter, closestPeriod, availablePeriods]);

  const handleStartInlineEdit = (entity: any) => {
    setEditingEntityId(entity.id);
    setEditName(entity.name);
    setEditColor(entity.properties?.color || '#3B82F6');
    setEditType(entity.type || 'place');
    setEditFrom(entity.temporalRange?.validFrom !== undefined ? String(entity.temporalRange.validFrom) : '-3000');
    setEditTo(entity.temporalRange?.validTo !== undefined ? String(entity.temporalRange.validTo) : '2100');
  };

  const handleSaveInlineEdit = (entityId: string) => {
    const vFrom = editFrom !== '' ? parseInt(editFrom, 10) : undefined;
    const vTo = editTo !== '' ? parseInt(editTo, 10) : undefined;

    if (vFrom !== undefined && vTo !== undefined && vFrom > vTo) {
      alert("L'année de début doit être inférieure ou égale à l'année de fin.");
      return;
    }

    updateEntity(entityId, {
      name: editName.trim() || undefined,
      type: (editType || 'place') as Entity['type'],
      color: editColor,
      properties: {
        color: editColor,
      },
      temporalRange: (vFrom !== undefined && vTo !== undefined) ? { validFrom: vFrom, validTo: vTo } : undefined,
    });

    setEditingEntityId(null);
  };

  const startDrawing = (entityId: string, type: 'Point' | 'LineString' | 'Polygon', existingGeometry?: any, modeOverride?: 'simple_select' | 'direct_select') => {
    setDrawingEntityId(entityId);
    mapService.enableDrawingMode(entityId, type, existingGeometry, modeOverride);
  };

  return (
    <div className="panel-content" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
        <Box size={18} /> Entités ({filteredEntities.length})
      </h3>

      <EntityDrawingNotice
        drawingEntityId={drawingEntityId}
        onFinishDrawing={() => { mapService.confirmDrawing(); setDrawingEntityId(null); }}
        onCancelDrawing={() => { mapService.cancelDrawingMode(); setDrawingEntityId(null); }}
      />

      <EntityAddForm
        layers={world.layers as any[]}
        onAddEntity={(name, layerId, vFrom, vTo) => addEntity(layerId, name, 'place', vFrom, vTo)}
      />

      <EntityPeriodFilter
        entityPeriodFilter={entityPeriodFilter}
        closestPeriod={closestPeriod}
        availablePeriods={availablePeriods}
        onChangeFilter={(val) => {
          setEntityPeriodFilter(val);
          if (val !== 'all' && val !== 'active') {
            const selected = availablePeriods.find(p => p.id === val);
            if (selected) setCurrentTime(selected.referenceYear);
          } else if (val === 'active' && closestPeriod) {
            setCurrentTime(closestPeriod.referenceYear);
          }
        }}
      />

      <ul className="list-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
        {filteredEntities.map((entity) => (
          <EntityListItem
            key={entity.id}
            entity={entity}
            layer={world.layers.find((l) => l.id === entity.layerId) as any}
            isSelected={entity.id === selectedEntityId}
            isEditing={editingEntityId === entity.id}
            isDrawing={drawingEntityId === entity.id}
            drawingEntityId={drawingEntityId}
            editName={editName}
            editColor={editColor}
            editType={editType}
            editFrom={editFrom}
            editTo={editTo}
            onSelect={() => setSelectedEntity(entity.id === selectedEntityId ? null : entity.id)}
            onStartInlineEdit={() => handleStartInlineEdit(entity)}
            onSaveInlineEdit={() => handleSaveInlineEdit(entity.id)}
            onCancelInlineEdit={() => setEditingEntityId(null)}
            onChangeEditName={setEditName}
            onChangeEditColor={setEditColor}
            onChangeEditType={setEditType}
            onChangeEditFrom={setEditFrom}
            onChangeEditTo={setEditTo}
            onChangeColor={(newColor) => updateEntity(entity.id, { color: newColor, properties: { color: newColor } })}
            onStartDrawing={(type, geom) => startDrawing(entity.id, type, geom)}
            onRemoveEntity={() => removeEntity(entity.id)}
          />
        ))}
      </ul>


      {selectedEntity && (
        <EntityDetailsCard
          selectedEntity={selectedEntity}
          onStartDrawing={(id, type, geom, mode) => startDrawing(id, type, geom, mode)}
          onClearGeometry={clearEntityGeometry}
        />
      )}

      <EntityRelationsSection
        entities={world.entities}
        onAddRelation={(sId, tId, relType, dir, w) => addRelation(sId, tId, relType, dir, w)}
      />
    </div>
  );
};
