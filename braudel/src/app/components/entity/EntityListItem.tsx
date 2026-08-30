// app/components/entity/EntityListItem.tsx

import React from 'react';
import { Edit3, MapPin, GitCommit, Hexagon, Navigation, Trash2, Check, X } from 'lucide-react';
import type { Entity, Layer } from '../../../core/schema/types';

interface EntityListItemProps {
  entity: Entity;
  layer?: Layer;
  isSelected: boolean;
  isEditing: boolean;
  isDrawing: boolean;
  drawingEntityId: string | null;
  editName: string;
  editColor: string;
  editType: string;
  editFrom: string;
  editTo: string;
  onSelect: () => void;
  onStartInlineEdit: () => void;
  onSaveInlineEdit: () => void;
  onCancelInlineEdit: () => void;
  onChangeEditName: (name: string) => void;
  onChangeEditColor: (color: string) => void;
  onChangeEditType: (type: string) => void;
  onChangeEditFrom: (from: string) => void;
  onChangeEditTo: (to: string) => void;
  onChangeColor?: (color: string) => void;
  onStartDrawing: (type: 'Point' | 'LineString' | 'Polygon', geometry?: any) => void;
  onRemoveEntity: () => void;
}

export const EntityListItem: React.FC<EntityListItemProps> = ({
  entity,
  layer,
  isSelected,
  isEditing,
  isDrawing,
  drawingEntityId,
  editName,
  editColor,
  editType,
  editFrom,
  editTo,
  onSelect,
  onStartInlineEdit,
  onSaveInlineEdit,
  onCancelInlineEdit,
  onChangeEditName,
  onChangeEditColor,
  onChangeEditType,
  onChangeEditFrom,
  onChangeEditTo,
  onChangeColor,
  onStartDrawing,
  onRemoveEntity,
}) => {

  const range = entity.temporalRange ? `[${entity.temporalRange.validFrom} - ${entity.temporalRange.validTo}]` : '';
  const hasGeometry = !!entity.geometry;
  const entityColor: string = (typeof entity.properties?.color === 'string' ? entity.properties.color : '#3B82F6');

  return (
    <li
      className="list-item animate-fade-in"
      style={{
        borderColor: isSelected || isDrawing || isEditing ? 'var(--accent-primary)' : 'var(--border-color)',
        background: isSelected || isDrawing || isEditing ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '8px',
      }}
      onClick={() => {
        if (!drawingEntityId && !isEditing) onSelect();
      }}
    >
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '6px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }} onClick={(e) => e.stopPropagation()}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Édition de l'entité : {entity.name}</label>

          <input
            type="text"
            value={editName}
            onChange={(e) => onChangeEditName(e.target.value)}
            placeholder="Nom de l'entité"
            className="input-field"
            style={{ fontSize: '0.8rem', padding: '6px' }}
          />

          {/* Couleur & Type */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Couleur:</span>
              <input
                type="color"
                value={editColor}
                onChange={(e) => onChangeEditColor(e.target.value)}
                style={{ border: 'none', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: editColor }}>{editColor}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Type:</span>
              <select
                value={editType}
                onChange={(e) => onChangeEditType(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.75rem', padding: '4px', flex: 1 }}
              >
                <option value="place">Lieu / Ville</option>
                <option value="territory">Territoire / Zone</option>
                <option value="empire">Empire / État</option>
                <option value="route">Route / Voie</option>
                <option value="event">Événement</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Début:</span>
            <input
              type="number"
              value={editFrom}
              onChange={(e) => onChangeEditFrom(e.target.value)}
              className="input-field"
              style={{ flex: 1, fontSize: '0.75rem', padding: '4px' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fin:</span>
            <input
              type="number"
              value={editTo}
              onChange={(e) => onChangeEditTo(e.target.value)}
              className="input-field"
              style={{ flex: 1, fontSize: '0.75rem', padding: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button
              className="btn btn-primary"
              onClick={onSaveInlineEdit}
              style={{ flex: 1, fontSize: '0.75rem', padding: '6px', gap: '4px', justifyContent: 'center' }}
            >
              <Check size={14} /> Enregistrer
            </button>
            <button className="btn" onClick={onCancelInlineEdit} style={{ fontSize: '0.75rem', padding: '6px' }}>
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              style={{ position: 'relative', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: entityColor, border: '1.5px solid #ffffff', flexShrink: 0, cursor: 'pointer', display: 'inline-block' }}
              title="Changer la couleur de l'entité"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="color"
                value={entityColor}
                onChange={(e) => {
                  e.stopPropagation();
                  if (onChangeColor) {
                    onChangeColor(e.target.value);
                  } else {
                    onChangeEditColor(e.target.value);
                    onSaveInlineEdit();
                  }
                }}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
              />
            </label>
            <span style={{ fontSize: '0.9rem' }}>
              {entity.name} <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{range}</span>
              <br />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Couche: {layer?.name || 'Inconnue'}</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                onStartInlineEdit();
              }}
              title="Éditer le nom et la temporalité"
            >
              <Edit3 size={15} color="var(--accent-primary)" />
            </button>

            {!hasGeometry && !drawingEntityId && (
              <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '2px' }}>
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onStartDrawing('Point'); }} title="Placer un point sur la carte">
                  <MapPin size={14} />
                </button>
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onStartDrawing('LineString'); }} title="Dessiner une ligne sur la carte">
                  <GitCommit size={14} />
                </button>
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onStartDrawing('Polygon'); }} title="Dessiner un polygone sur la carte">
                  <Hexagon size={14} />
                </button>
              </div>
            )}

            {hasGeometry && entity.geometry && !drawingEntityId && !entity.properties?.isRelation && (
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartDrawing(entity.geometry!.type as any, entity.geometry);
                }}
                title="Retravailler le tracé géographique"
              >
                <Navigation size={14} />
              </button>
            )}

            {!drawingEntityId && (
              <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); onRemoveEntity(); }} title="Supprimer l'entité">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
};
