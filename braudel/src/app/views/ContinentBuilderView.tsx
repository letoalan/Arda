import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { simplifyFreehandStroke } from '../../acquisition/freehand/simplifyFreehandStroke';
import { draftsToGeoJSON } from '../../utils/draftToGeoJSON';
import { parseSketchImage } from '../../services/import/sketch-parser';
import { ArrowRight } from 'lucide-react';
import { ContinentToolbar } from '../components/continent/ContinentToolbar';
import { ContinentCanvas } from '../components/continent/ContinentCanvas';
import { ContinentChatPanel } from '../components/continent/ContinentChatPanel';

export type TerrainFeatureType = 'continent' | 'mountain' | 'peak' | 'hills' | 'valley' | 'rift' | 'trench' | 'ridge';

export interface TerrainFeatureDraft {
  id: string;
  featureType: TerrainFeatureType;
  name?: string;
  points: { x: number; y: number }[];
  geometryKind?: any;
  sourceMethod?: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const ContinentBuilderView: React.FC = () => {
  const { saveContinents } = useStore();
  const [drafts, setDrafts] = useState<TerrainFeatureDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<TerrainFeatureDraft | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [selectedFeatureType, setSelectedFeatureType] = useState<TerrainFeatureType>('continent');
  const [currentDraftName, setCurrentDraftName] = useState<string>('');
  const [drawingMode, setDrawingMode] = useState<'click' | 'freehand'>('click');
  const [isMouseDown, setIsMouseDown] = useState(false);

  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [refOpacity] = useState<number>(0.5);
  const [showRef] = useState<boolean>(true);

  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: "Bonjour ! Je suis l'assistant cartographe de Tolkien.", timestamp: new Date().toLocaleTimeString() }
  ]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [proposedDrafts, setProposedDrafts] = useState<TerrainFeatureDraft[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingMode === 'click') {
      if (!currentDraft) {
        setCurrentDraft({
          id: crypto.randomUUID(),
          featureType: selectedFeatureType,
          name: currentDraftName || undefined,
          points: [{ x, y }]
        });
      } else {
        setCurrentDraft({
          ...currentDraft,
          points: [...currentDraft.points, { x, y }]
        });
      }
    } else {
      setIsMouseDown(true);
      setCurrentDraft({
        id: crypto.randomUUID(),
        featureType: selectedFeatureType,
        name: currentDraftName || undefined,
        points: [{ x, y }]
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (drawingMode === 'freehand' && isMouseDown && currentDraft) {
      setCurrentDraft({
        ...currentDraft,
        points: [...currentDraft.points, { x, y }]
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (drawingMode === 'freehand' && isMouseDown && currentDraft) {
      setIsMouseDown(false);
      const simplified = simplifyFreehandStroke(currentDraft.points);
      if (simplified.length > 2) {
        setDrafts([...drafts, { ...currentDraft, points: simplified }]);
      }
      setCurrentDraft(null);
    }
  };

  const handleDoubleClick = () => {
    if (drawingMode === 'click' && currentDraft && currentDraft.points.length > 2) {
      setDrafts([...drafts, currentDraft]);
      setCurrentDraft(null);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && pendingFiles.length === 0) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'user', text: userText || "Envoi d'images croquis", timestamp: new Date().toLocaleTimeString() }]);
    setChatInput('');
    setAiLoading(true);

    try {
      if (pendingFiles.length > 0) {
        const file = pendingFiles[0];
        const base64 = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(file);
        });

        setReferenceImage(base64);
        const geojson = await parseSketchImage(file);
        const features = geojson.features || [];
        const newDrafts: TerrainFeatureDraft[] = features.map((feat: any) => ({
          id: crypto.randomUUID(),
          featureType: selectedFeatureType,
          name: feat.properties?.name || 'Feature',
          points: (feat.geometry?.coordinates?.[0] || []).map((pt: number[]) => ({ x: pt[0] || 0, y: pt[1] || 0 }))
        }));

        setProposedDrafts(newDrafts);
        setPendingFiles([]);
        setChatMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'ai', text: `Détection terminée (${features.length} formes). Prévisualisation affichée sur le canevas.`, timestamp: new Date().toLocaleTimeString() }]);
      } else {
        setChatMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'ai', text: "Compris. Ajustez votre tracé selon vos souhaits.", timestamp: new Date().toLocaleTimeString() }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const navigate = useNavigate();
  const worldId = useStore((s) => s.world.world?.[0]?.id);

  const handleSaveAndGenerate = async () => {
    const geojson = draftsToGeoJSON(drafts, 1000, 700);
    await saveContinents(geojson);
    useStore.getState().setMapLoading(true, 8000);
    if (worldId) {
      navigate(`/world/${worldId}`);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <ContinentToolbar
        selectedFeatureType={selectedFeatureType}
        drawingMode={drawingMode}
        currentDraftName={currentDraftName}
        onSelectFeatureType={setSelectedFeatureType}
        onSelectDrawingMode={setDrawingMode}
        onChangeDraftName={setCurrentDraftName}
        onClearAll={() => { setDrafts([]); setCurrentDraft(null); setProposedDrafts([]); }}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative' }}>
          <ContinentCanvas
            drafts={drafts} currentDraft={currentDraft} proposedDrafts={proposedDrafts} mousePos={mousePos}
            referenceImage={referenceImage} refOpacity={refOpacity} showRef={showRef}
            onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onDoubleClick={handleDoubleClick}
          />

          <button
            className="btn btn-primary"
            onClick={handleSaveAndGenerate}
            disabled={drafts.length === 0}
            style={{ position: 'absolute', bottom: '24px', right: '24px', padding: '12px 20px', fontSize: '0.9rem', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
          >
            Générer la Topographie & Entrer dans la Carte <ArrowRight size={18} />
          </button>
        </div>

        <ContinentChatPanel
          chatMessages={chatMessages} chatInput={chatInput} pendingFiles={pendingFiles} proposedDrafts={proposedDrafts} aiLoading={aiLoading}
          onChatInputChange={setChatInput} onAddFiles={(files) => setPendingFiles(prev => [...prev, ...files])}
          onRemoveFile={(idx) => setPendingFiles(prev => prev.filter((_, i) => i !== idx))} onSendMessage={handleSendMessage}
          onAcceptProposal={() => { setDrafts(prev => [...prev, ...proposedDrafts]); setProposedDrafts([]); }} onRejectProposal={() => setProposedDrafts([])}
        />
      </div>
    </div>
  );
};
