import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../state/store';
import { tokenizeWikiText, parseWikiLinks } from '../../utils/wikiLinkParser';
import { 
  BookOpen, 
  Edit3, 
  Eye, 
  X, 
  Link2, 
  AlertCircle, 
  Calendar, 
  Layers, 
  Check, 
  Hash, 
  Bold, 
  Italic, 
  List, 
  Quote 
} from 'lucide-react';
import { Entity } from '../../core/schema/types';

interface WikiPagePanelProps {
  entityId?: string | null;
  onClose?: () => void;
}

export const WikiPagePanel: React.FC<WikiPagePanelProps> = ({ entityId, onClose }) => {
  const storeEntityId = useStore((s) => s.wikiModalEntityId);
  const setWikiModalEntityId = useStore((s) => s.setWikiModalEntityId);
  const entities = useStore((s) => s.world.entities);
  const updateEntityWikiContent = useStore((s) => s.updateEntityWikiContent);

  const activeId = entityId || storeEntityId;
  const entity = entities.find((e: Entity) => e.id === activeId);

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(entity?.wikiContent || '');
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (entity) {
      setContent(entity.wikiContent || '');
      setIsEditing(!entity.wikiContent);
    }
  }, [activeId, entity]);

  const entityLookups = useMemo(() => entities.map((e: Entity) => ({ id: e.id, name: e.name })), [entities]);
  const tokens = useMemo(() => tokenizeWikiText(content, entityLookups), [content, entityLookups]);
  const detectedLinks = useMemo(() => parseWikiLinks(content, entityLookups), [content, entityLookups]);

  if (!activeId || !entity) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else setWikiModalEntityId(null);
  };

  const handleSave = () => {
    updateEntityWikiContent(entity.id, content);
    setIsEditing(false);
  };

  const insertText = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || defaultPlaceholder;
    const replacement = `${prefix}${selected}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const insertWikilink = (targetName: string) => {
    insertText(`[[${targetName}]]`, '', '');
    setShowEntityPicker(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 7, 10, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '88vh',
          backgroundColor: 'var(--bg-secondary, #171A21)',
          border: '1px solid var(--border-color, #2D3748)',
          borderRadius: '14px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary, #E2E8F0)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: 'var(--bg-tertiary, #1E222B)',
            borderBottom: '1px solid var(--border-color, #2D3748)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}
            >
              <BookOpen size={20} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  {entity.name}
                </h2>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#60A5FA',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                >
                  {entity.type || 'Entité'}
                </span>
              </div>

              {entity.temporalRange && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
                  <Calendar size={12} />
                  <span>{entity.temporalRange.validFrom} → {entity.temporalRange.validTo}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Mode Switcher */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: isEditing ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-primary, #0F1115)',
                color: isEditing ? '#60A5FA' : 'var(--text-secondary, #94A3B8)',
                border: isEditing ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={isEditing ? 'Passer en mode lecture/aperçu' : 'Passer en mode édition'}
            >
              {isEditing ? <Eye size={14} /> : <Edit3 size={14} />}
              <span>{isEditing ? 'Aperçu' : 'Éditer'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: 'var(--text-muted, #64748B)',
                border: '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted, #64748B)';
              }}
              title="Fermer la fiche wiki"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isEditing ? (
            /* Mode Édition */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Quick Markdown Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  backgroundColor: 'var(--bg-tertiary, #1E222B)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #2D3748)',
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  onClick={() => insertText('## ', '', 'Titre de section')}
                  style={toolbarBtnStyle}
                  title="Titre (## Titre)"
                >
                  <Hash size={14} /> Titre
                </button>
                <button
                  type="button"
                  onClick={() => insertText('**', '**', 'texte en gras')}
                  style={toolbarBtnStyle}
                  title="Gras (**texte**)"
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('*', '*', 'texte en italique')}
                  style={toolbarBtnStyle}
                  title="Italique (*texte*)"
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('- ', '', 'élément de liste')}
                  style={toolbarBtnStyle}
                  title="Liste à puces"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('> ', '', 'Citation')}
                  style={toolbarBtnStyle}
                  title="Citation (> texte)"
                >
                  <Quote size={14} />
                </button>

                <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowEntityPicker(!showEntityPicker)}
                    style={{
                      ...toolbarBtnStyle,
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      fontWeight: 600
                    }}
                    title="Insérer un lien wiki [[Entité]]"
                  >
                    <Link2 size={14} /> Insérer un Wikilink [[...]]
                  </button>

                  {showEntityPicker && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        width: '240px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        backgroundColor: 'var(--bg-secondary, #171A21)',
                        border: '1px solid var(--border-color, #2D3748)',
                        borderRadius: '6px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        zIndex: 10,
                        padding: '4px'
                      }}
                    >
                      {entities.filter((e) => e.id !== entity.id).map((other) => (
                        <div
                          key={other.id}
                          onClick={() => insertWikilink(other.name)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <span style={{ fontWeight: 500 }}>{other.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {other.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Guide Callout */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  color: '#FBBF24'
                }}
              >
                <Link2 size={14} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Syntaxe Wikilink :</strong> Utilisez <code>[[Nom de l'entité]]</code> ou <code>[[Nom|Alias visible]]</code> pour créer des liens hypertextes navigables.
                </span>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Rédigez la fiche encyclopédique de ${entity.name} en Markdown...\n\nExemple :\n## Histoire & Origines\n${entity.name} est un lieu stratégique relié à [[Rome]] et traversé par le fleuve [[Tibre]].\n\n- Climat méditerranéen tempéré\n- Fortifications antiques`}
                style={{
                  width: '100%',
                  minHeight: '260px',
                  height: '320px',
                  padding: '14px',
                  backgroundColor: 'var(--bg-primary, #0F1115)',
                  border: '1px solid var(--border-color, #2D3748)',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '0.88rem',
                  lineHeight: '1.6',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  resize: 'vertical',
                  outline: 'none'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary, #3B82F6)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, #2D3748)')}
              />

              {/* Action Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {detectedLinks.length} lien{detectedLinks.length > 1 ? 's' : ''} détecté{detectedLinks.length > 1 ? 's' : ''}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setContent(entity.wikiContent || '');
                      setIsEditing(false);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary, #94A3B8)',
                      border: '1px solid var(--border-color, #2D3748)',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 18px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--accent-primary, #3B82F6)',
                      color: '#fff',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    <Check size={14} /> Sauvegarder la Fiche
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Mode Lecture / Aperçu */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tokens.length === 0 || (tokens.length === 1 && !tokens[0].content.trim()) ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    color: 'var(--text-muted, #64748B)',
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-color)'
                  }}
                >
                  <BookOpen size={36} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 500, margin: '0 0 6px 0', color: 'var(--text-secondary)' }}>
                    Aucune fiche encyclopédique rédigée pour cette entité.
                  </p>
                  <p style={{ fontSize: '0.8rem', margin: '0 0 16px 0' }}>
                    Documentez son histoire, sa géographie et tissez des liens avec d'autres acteurs du monde.
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--accent-primary, #3B82F6)',
                      color: '#fff',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={15} /> Rédiger la documentation
                  </button>
                </div>
              ) : (
                <div style={{ lineHeight: 1.7, fontSize: '0.92rem', color: '#E2E8F0' }}>
                  {tokens.map((token, idx) => {
                    if (token.type === 'text') {
                      return (
                        <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>
                          {token.content}
                        </span>
                      );
                    }
                    if (token.isBroken) {
                      return (
                        <span
                          key={idx}
                          title={`Entité "${token.targetName}" introuvable`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#F87171',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            borderBottom: '1px dashed #EF4444',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '0.85rem',
                            cursor: 'help'
                          }}
                        >
                          <AlertCircle size={12} />
                          {token.content}
                        </span>
                      );
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => token.targetEntityId && setWikiModalEntityId(token.targetEntityId)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#FBBF24',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '4px',
                          padding: '1px 7px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          verticalAlign: 'baseline',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.3)';
                          e.currentTarget.style.borderColor = '#F59E0B';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                        }}
                        title={`Consulter la fiche wiki de ${token.targetName}`}
                      >
                        <Link2 size={12} />
                        {token.content}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Liens sortants / Connexions de la fiche */}
              {detectedLinks.length > 0 && !isEditing && (
                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-color, #2D3748)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    <Layers size={13} />
                    <span>Réseau encyclopédique ({detectedLinks.length} entités liées)</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {detectedLinks.map((link, idx) => (
                      <button
                        key={idx}
                        disabled={link.isBroken}
                        onClick={() => link.targetEntityId && setWikiModalEntityId(link.targetEntityId)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          backgroundColor: link.isBroken ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
                          color: link.isBroken ? '#F87171' : 'var(--text-secondary)',
                          border: link.isBroken ? '1px dashed rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                          cursor: link.isBroken ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {link.targetName} {link.isBroken && '(manquant)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const toolbarBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  borderRadius: '4px',
  backgroundColor: 'var(--bg-primary, #0F1115)',
  color: 'var(--text-secondary, #94A3B8)',
  border: '1px solid var(--border-color, #2D3748)',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'all 0.15s ease'
};
