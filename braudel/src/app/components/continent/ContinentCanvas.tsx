// app/components/continent/ContinentCanvas.tsx

import React, { useEffect, useRef } from 'react';
import type { TerrainFeatureDraft } from '../../views/ContinentBuilderView';

interface ContinentCanvasProps {
  drafts: TerrainFeatureDraft[];
  currentDraft: TerrainFeatureDraft | null;
  proposedDrafts: TerrainFeatureDraft[];
  mousePos: { x: number; y: number } | null;
  referenceImage: string | null;
  refOpacity: number;
  showRef: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onDoubleClick: () => void;
}

export const ContinentCanvas: React.FC<ContinentCanvasProps> = ({
  drafts,
  currentDraft,
  proposedDrafts,
  mousePos,
  referenceImage,
  refOpacity,
  showRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onDoubleClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const refImgElement = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (referenceImage) {
      const img = new Image();
      img.src = referenceImage;
      img.onload = () => {
        refImgElement.current = img;
        drawCanvas();
      };
    } else {
      refImgElement.current = null;
      drawCanvas();
    }
  }, [referenceImage]);

  useEffect(() => {
    drawCanvas();
  }, [drafts, currentDraft, proposedDrafts, mousePos, refOpacity, showRef]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Image de référence (Fond)
    if (showRef && refImgElement.current) {
      ctx.save();
      ctx.globalAlpha = refOpacity;
      ctx.drawImage(refImgElement.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Fonction d'aide au tracé
    const drawDraftPath = (draft: TerrainFeatureDraft, strokeColor: string, fillColor: string, isDashed = false) => {
      if (!draft.points || draft.points.length === 0) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(draft.points[0].x, draft.points[0].y);
      for (let i = 1; i < draft.points.length; i++) {
        ctx.lineTo(draft.points[i].x, draft.points[i].y);
      }
      if (isDashed) {
        ctx.setLineDash([4, 4]);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = draft.featureType === 'continent' ? 3 : 2;
      ctx.stroke();

      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      ctx.restore();
    };

    // 2. Tracés confirmés
    drafts.forEach((d) => {
      const color = d.featureType === 'continent' ? '#10B981' : '#F59E0B';
      const fill = d.featureType === 'continent' ? 'rgba(16, 185, 129, 0.15)' : 'transparent';
      drawDraftPath(d, color, fill);
    });

    // 3. Tracés proposés par l'IA (en pointillés bleus)
    proposedDrafts.forEach((pd) => {
      drawDraftPath(pd, '#3B82F6', 'rgba(59, 130, 246, 0.15)', true);
    });

    // 4. Tracé en cours d'édition
    if (currentDraft && currentDraft.points.length > 0) {
      drawDraftPath(currentDraft, '#EF4444', 'rgba(239, 68, 68, 0.1)', true);

      // Trait élastique vers la position de la souris
      if (mousePos) {
        const lastPt = currentDraft.points[currentDraft.points.length - 1];
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(lastPt.x, lastPt.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = '#EF4444';
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={700}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
      style={{
        background: '#0F1115',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        cursor: 'crosshair',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    />
  );
};
