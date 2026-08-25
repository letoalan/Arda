// app/components/map/RhumbLinesCanvas.tsx

import React, { useEffect, useRef } from 'react';
import type { StyleRhumbConfig } from '../../../core/styles.config';
import { mapService } from '../../../services/cartography/map-service';

interface RhumbLinesCanvasProps {
  rhumbConfig?: StyleRhumbConfig;
}

export const RhumbLinesCanvas: React.FC<RhumbLinesCanvasProps> = ({ rhumbConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!rhumbConfig || !rhumbConfig.enabled || !canvasRef.current) return;

    const map = mapService.getMap();
    if (!map) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = map.getCanvas().clientWidth;
      const height = map.getCanvas().clientHeight;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      if (!rhumbConfig.centers) return;

      rhumbConfig.centers.forEach(([lng, lat], centerIdx) => {
        const point = map.project([lng, lat]);
        const rayCount = rhumbConfig.rayCount || 16;
        const colors = rhumbConfig.colors || ['#8B0000', '#000080', '#000000', '#DAA520'];
        const radius = 3000;

        for (let i = 0; i < rayCount; i++) {
          const angle = (i * 2 * Math.PI) / rayCount;
          const endX = point.x + Math.cos(angle) * radius;
          const endY = point.y + Math.sin(angle) * radius;

          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = colors[i % colors.length];
          ctx.lineWidth = rhumbConfig.lineWidth || 0.8;
          ctx.globalAlpha = 0.4;
          ctx.stroke();
        }

        // Draw wind rose star center
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = colors[centerIdx % colors.length];
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    render();
    map.on('move', render);
    map.on('resize', render);

    return () => {
      map.off('move', render);
      map.off('resize', render);
    };
  }, [rhumbConfig]);

  if (!rhumbConfig || !rhumbConfig.enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
};
