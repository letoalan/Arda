import React, { useState, useRef, useEffect } from 'react';
import { StorySlideBlock } from '../../core/schema/story';
import { 
  Type, 
  Image as ImageIcon, 
  Video, 
  GitFork, 
  Square, 
  Circle, 
  Trash2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Copy, 
  X,
  Palette,
  Sparkles
} from 'lucide-react';

interface SlideEditorModalProps {
  isOpen: boolean;
  slideTitle: string;
  initialBlocks?: StorySlideBlock[];
  onClose: () => void;
  onSave: (blocks: StorySlideBlock[]) => void;
}

export const SlideEditorModal: React.FC<SlideEditorModalProps> = ({
  isOpen,
  slideTitle,
  initialBlocks = [],
  onClose,
  onSave
}) => {
  const [blocks, setBlocks] = useState<StorySlideBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [slideBgColor, setSlideBgColor] = useState<string>('#1e293b');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; blockX: number; blockY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  if (!isOpen) return null;

  const snap = (v: number) => Math.round(v / 10) * 10;

  const handleAddText = (preset: 'title' | 'subtitle' | 'body' = 'body') => {
    const defaultText = preset === 'title' 
      ? 'Titre de la Diapositive' 
      : preset === 'subtitle' 
      ? 'Sous-titre ou contexte historique...' 
      : 'Ajoutez une description détaillée, des faits clés ou une analyse...';

    const fontSize = preset === 'title' ? 32 : preset === 'subtitle' ? 22 : 16;
    const fontWeight = preset === 'title' ? 700 : preset === 'subtitle' ? 600 : 400;

    const newBlock: StorySlideBlock = {
      id: `text-${Date.now()}`,
      type: 'text',
      title: preset === 'title' ? 'Titre' : undefined,
      content: defaultText,
      x: 60,
      y: preset === 'title' ? 40 : preset === 'subtitle' ? 90 : 150,
      w: preset === 'title' ? 600 : 480,
      h: preset === 'title' ? 60 : 100,
      fontSize,
      fontWeight,
      color: '#f8fafc',
      align: 'left',
      zIndex: blocks.length + 1
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id!);
  };

  const handleAddImage = () => {
    const url = prompt(
      'URL de l\'image (web ou data:image) :', 
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80'
    );
    if (!url) return;
    const newBlock: StorySlideBlock = {
      id: `img-${Date.now()}`,
      type: 'image',
      url,
      caption: 'Illustration ou document d\'archive',
      x: 520,
      y: 60,
      w: 380,
      h: 260,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      zIndex: blocks.length + 1
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id!);
  };

  const handleAddVideo = () => {
    const videoUrl = prompt(
      'URL de la vidéo (YouTube, Vimeo ou fichier .mp4) :',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
    if (!videoUrl) return;
    const newBlock: StorySlideBlock = {
      id: `video-${Date.now()}`,
      type: 'video',
      videoUrl,
      caption: 'Documentaire ou extrait vidéo explicatif',
      x: 480,
      y: 80,
      w: 420,
      h: 240,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#3B82F6',
      zIndex: blocks.length + 1
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id!);
  };

  const handleAddDiagram = () => {
    const newBlock: StorySlideBlock = {
      id: `diagram-${Date.now()}`,
      type: 'diagram',
      title: 'Flux géopolitique & Évolution',
      content: '1. Expansion territoriale → 2. Alliances régionales → 3. Traité de paix',
      diagramType: 'flowchart',
      x: 80,
      y: 280,
      w: 440,
      h: 180,
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderColor: '#38bdf8',
      borderWidth: 2,
      borderRadius: 12,
      color: '#f8fafc',
      zIndex: blocks.length + 1
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id!);
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'pill') => {
    const newBlock: StorySlideBlock = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shapeType,
      x: 120,
      y: 180,
      w: shapeType === 'pill' ? 220 : 140,
      h: shapeType === 'pill' ? 60 : 140,
      color: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderWidth: 2,
      borderColor: '#3B82F6',
      borderRadius: shapeType === 'circle' ? 9999 : shapeType === 'pill' ? 30 : 8,
      zIndex: blocks.length + 1
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id!);
  };

  const handleDuplicateBlock = () => {
    if (!selectedBlock) return;
    const dup: StorySlideBlock = {
      ...selectedBlock,
      id: `${selectedBlock.type}-${Date.now()}`,
      x: (selectedBlock.x || 0) + 20,
      y: (selectedBlock.y || 0) + 20,
      zIndex: blocks.length + 1
    };
    setBlocks([...blocks, dup]);
    setSelectedBlockId(dup.id!);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleUpdateSelected = (patch: Partial<StorySlideBlock>) => {
    if (!selectedBlockId) return;
    setBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, ...patch } : b));
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Gestion du glisser-déplacer direct sur le canvas (Drag & Drop)
  const handleMouseDownBlock = (e: React.MouseEvent, block: StorySlideBlock) => {
    e.stopPropagation();
    setSelectedBlockId(block.id!);
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      blockX: block.x || 0,
      blockY: block.y || 0
    });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !selectedBlockId) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const newX = snap(Math.max(0, Math.min(960 - (selectedBlock?.w || 100), dragStart.blockX + dx)));
    const newY = snap(Math.max(0, Math.min(540 - (selectedBlock?.h || 50), dragStart.blockY + dy)));

    setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, x: newX, y: newY } : b));
  };

  const handleMouseUpCanvas = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(10, 15, 29, 0.92)',
      backdropFilter: 'blur(16px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 1. Ruban Supérieur (Ribbon Toolbar type Office/PowerPoint) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(30, 41, 59, 0.95)',
        padding: '10px 20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📽️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                {slideTitle || 'Éditeur de Diapositive'}
              </h3>
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Format 16:9 • Prêt pour projection</span>
            </div>
          </div>
        </div>

        {/* Boutons d'insertion d'éléments */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', padding: '3px', borderRadius: '8px', gap: '4px' }}>
            <button 
              onClick={() => handleAddText('title')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 8px', gap: '4px' }}
              title="Ajouter un titre principal"
            >
              <Type size={13} /> Titre
            </button>
            <button 
              onClick={() => handleAddText('body')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 8px', gap: '4px' }}
              title="Ajouter un texte de paragraphe"
            >
              <Type size={13} /> Texte
            </button>
            <button 
              onClick={handleAddImage}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 8px', gap: '4px' }}
              title="Insérer une image ou archive"
            >
              <ImageIcon size={13} /> Image
            </button>
            <button 
              onClick={handleAddVideo}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 8px', gap: '4px' }}
              title="Insérer une vidéo (YouTube, Vimeo, MP4)"
            >
              <Video size={13} /> Vidéo
            </button>
            <button 
              onClick={handleAddDiagram}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 8px', gap: '4px' }}
              title="Insérer un schéma ou flux historique"
            >
              <GitFork size={13} /> Schéma
            </button>
            <button 
              onClick={() => handleAddShape('rectangle')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 8px', gap: '4px' }}
              title="Forme Rectangle"
            >
              <Square size={13} /> Rectangle
            </button>
            <button 
              onClick={() => handleAddShape('circle')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 8px', gap: '4px' }}
              title="Forme Cercle"
            >
              <Circle size={13} /> Cercle
            </button>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

          <button 
            onClick={() => { onSave(blocks); onClose(); }}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 14px', gap: '6px', fontWeight: 600 }}
          >
            ✓ Enregistrer
          </button>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px' }}
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* 2. Espace de Travail Central (Canvas & Inspecteur) */}
      <div style={{ display: 'flex', flex: 1, gap: '16px', minHeight: 0 }}>
        {/* Canevas 16:9 interactif */}
        <div 
          style={{
            flex: 1,
            position: 'relative',
            background: '#090d16',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedBlockId(null)}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
        >
          <div 
            ref={canvasRef}
            style={{
              position: 'relative',
              width: '960px',
              height: '540px',
              backgroundColor: slideBgColor,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {/* Grille de repères discrète (PowerPoint Snap Grid) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />

            {blocks.map((block) => {
              const isSel = block.id === selectedBlockId;
              return (
                <div
                  key={block.id}
                  onMouseDown={(e) => handleMouseDownBlock(e, block)}
                  style={{
                    position: 'absolute',
                    left: `${block.x ?? 40}px`,
                    top: `${block.y ?? 40}px`,
                    width: `${block.w ?? 200}px`,
                    height: `${block.h ?? 80}px`,
                    zIndex: block.zIndex || 1,
                    outline: isSel ? '2px solid #38bdf8' : '1px dashed rgba(255,255,255,0.2)',
                    outlineOffset: '2px',
                    cursor: isDragging && isSel ? 'grabbing' : 'grab',
                    padding: block.type === 'shape' ? '0' : '8px 12px',
                    borderRadius: `${block.borderRadius ?? (block.shapeType === 'circle' ? 9999 : 6)}px`,
                    backgroundColor: block.backgroundColor || (block.type === 'shape' ? 'rgba(59, 130, 246, 0.2)' : 'transparent'),
                    border: block.borderWidth ? `${block.borderWidth}px solid ${block.borderColor || block.color || '#3B82F6'}` : 'none',
                    color: block.color || '#f8fafc',
                    fontSize: `${block.fontSize || 16}px`,
                    fontWeight: block.fontWeight || 'normal',
                    textAlign: block.align || 'left',
                    overflow: 'hidden',
                    userSelect: 'none',
                    boxShadow: isSel ? '0 0 16px rgba(56, 189, 248, 0.35)' : 'none',
                    transform: block.rotation ? `rotate(${block.rotation}deg)` : 'none',
                    opacity: block.opacity ?? 1
                  }}
                >
                  {block.type === 'text' && (
                    <div style={{ width: '100%', height: '100%', wordBreak: 'break-word' }}>
                      {block.title && <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{block.title}</div>}
                      <div>{block.content || 'Texte de la diapositive...'}</div>
                    </div>
                  )}

                  {block.type === 'image' && (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <img 
                        src={block.url || block.src} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} 
                      />
                      {block.caption && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', fontSize: '0.65rem' }}>
                          {block.caption}
                        </div>
                      )}
                    </div>
                  )}

                  {block.type === 'video' && (
                    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'inherit' }}>
                      <Video size={32} color="#38bdf8" />
                      <span style={{ fontSize: '0.75rem', marginTop: '6px', color: '#94a3b8' }}>
                        Vidéo intégrée ({block.videoUrl ? 'URL OK' : 'Pas d\'URL'})
                      </span>
                    </div>
                  )}

                  {block.type === 'diagram' && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 600, fontSize: '0.85rem' }}>
                        <GitFork size={14} /> {block.title || 'Schéma narratif'}
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.85 }}>
                        {block.content}
                      </div>
                    </div>
                  )}

                  {block.type === 'shape' && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {block.content && <span style={{ fontSize: '0.8rem' }}>{block.content}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Volet d'Inspecteur Latéral (Properties & Layout) */}
        <div style={{
          width: '320px',
          background: 'rgba(30, 41, 59, 0.95)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflowY: 'auto'
        }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={16} /> Propriétés & Format
          </h4>

          {selectedBlock ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>
                  {selectedBlock.type} #{selectedBlock.id?.slice(-4)}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={handleDuplicateBlock} 
                    className="btn btn-secondary" 
                    style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                    title="Dupliquer"
                  >
                    <Copy size={12} />
                  </button>
                  <button 
                    onClick={() => handleDeleteBlock(selectedBlock.id!)} 
                    className="btn btn-danger" 
                    style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                    title="Supprimer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Texte & Contenu */}
              {selectedBlock.type === 'text' && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Contenu texte</label>
                  <textarea
                    rows={4}
                    value={selectedBlock.content || ''}
                    onChange={(e) => handleUpdateSelected({ content: e.target.value })}
                    style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              )}

              {/* Image URL & Légende */}
              {selectedBlock.type === 'image' && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>URL Image</label>
                  <input
                    type="text"
                    value={selectedBlock.url || selectedBlock.src || ''}
                    onChange={(e) => handleUpdateSelected({ url: e.target.value })}
                    style={{ width: '100%', padding: '6px', fontSize: '0.8rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px', marginBottom: '8px' }}
                  />
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Légende</label>
                  <input
                    type="text"
                    value={selectedBlock.caption || ''}
                    onChange={(e) => handleUpdateSelected({ caption: e.target.value })}
                    style={{ width: '100%', padding: '6px', fontSize: '0.8rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              )}

              {/* Vidéo URL */}
              {selectedBlock.type === 'video' && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>URL Vidéo (YouTube / MP4)</label>
                  <input
                    type="text"
                    value={selectedBlock.videoUrl || selectedBlock.url || ''}
                    onChange={(e) => handleUpdateSelected({ videoUrl: e.target.value })}
                    style={{ width: '100%', padding: '6px', fontSize: '0.8rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              )}

              {/* Schéma / Diagramme */}
              {selectedBlock.type === 'diagram' && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Titre du schéma</label>
                  <input
                    type="text"
                    value={selectedBlock.title || ''}
                    onChange={(e) => handleUpdateSelected({ title: e.target.value })}
                    style={{ width: '100%', padding: '6px', fontSize: '0.8rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px', marginBottom: '8px' }}
                  />
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Description des étapes / flux</label>
                  <textarea
                    rows={3}
                    value={selectedBlock.content || ''}
                    onChange={(e) => handleUpdateSelected({ content: e.target.value })}
                    style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              )}

              {/* Positionnement & Dimensions précis */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Géométrie (X, Y, W, H)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>X (px)</span>
                    <input
                      type="number"
                      value={selectedBlock.x ?? 0}
                      step={10}
                      onChange={(e) => handleUpdateSelected({ x: snap(Number(e.target.value)) })}
                      style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Y (px)</span>
                    <input
                      type="number"
                      value={selectedBlock.y ?? 0}
                      step={10}
                      onChange={(e) => handleUpdateSelected({ y: snap(Number(e.target.value)) })}
                      style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Largeur (W)</span>
                    <input
                      type="number"
                      value={selectedBlock.w ?? 100}
                      step={10}
                      onChange={(e) => handleUpdateSelected({ w: snap(Number(e.target.value)) })}
                      style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Hauteur (H)</span>
                    <input
                      type="number"
                      value={selectedBlock.h ?? 50}
                      step={10}
                      onChange={(e) => handleUpdateSelected({ h: snap(Number(e.target.value)) })}
                      style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Typographie & Couleurs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Taille Police</label>
                  <input
                    type="number"
                    value={selectedBlock.fontSize || 16}
                    onChange={(e) => handleUpdateSelected({ fontSize: Number(e.target.value) })}
                    style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Couleur Texte</label>
                  <input
                    type="color"
                    value={selectedBlock.color || '#f8fafc'}
                    onChange={(e) => handleUpdateSelected({ color: e.target.value })}
                    style={{ width: '100%', height: '26px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Alignement texte */}
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Alignement</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['left', 'center', 'right', 'justify'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => handleUpdateSelected({ align })}
                      className={`btn ${(selectedBlock.align === align || (!selectedBlock.align && align === 'left')) ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '4px', justifyContent: 'center' }}
                    >
                      {align === 'left' && <AlignLeft size={13} />}
                      {align === 'center' && <AlignCenter size={13} />}
                      {align === 'right' && <AlignRight size={13} />}
                      {align === 'justify' && <AlignJustify size={13} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style de Fond et Bordure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Fond (RGB/Hex)</label>
                  <input
                    type="text"
                    value={selectedBlock.backgroundColor || ''}
                    placeholder="ex: rgba(0,0,0,0.5)"
                    onChange={(e) => handleUpdateSelected({ backgroundColor: e.target.value })}
                    style={{ width: '100%', padding: '4px', fontSize: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Bordure (Couleur)</label>
                  <input
                    type="color"
                    value={selectedBlock.borderColor || '#3B82F6'}
                    onChange={(e) => handleUpdateSelected({ borderColor: e.target.value })}
                    style={{ width: '100%', height: '26px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 12px', opacity: 0.6 }}>
              <Sparkles size={28} color="#38bdf8" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '0.8rem', margin: 0 }}>
                Cliquez sur un élément de la diapositive pour le déplacer ou modifier ses options visuelles.
              </p>
            </div>
          )}

          {/* Arrière-plan général de la diapositive */}
          <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Palette size={13} /> Couleur de fond du slide
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={slideBgColor}
                onChange={(e) => setSlideBgColor(e.target.value)}
                style={{ width: '32px', height: '26px', padding: 0, border: 'none', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{slideBgColor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
