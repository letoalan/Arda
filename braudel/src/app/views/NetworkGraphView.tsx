// views/NetworkGraphView.tsx

import React, { useMemo, useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useStore } from '../state/store';
import { filterNetwork } from '../../core/network';
import { computeCentrality } from '../../core/network/metrics';
import { NetworkToolbar } from '../components/network/NetworkToolbar';

export const NetworkGraphView: React.FC = () => {
  const { world, currentTime, networkFilters, setSelectedEntity, selectedEntityId } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [trimLeaves, setTrimLeaves] = useState(false);
  const [explorationMode, setExplorationMode] = useState(false);
  const [sizeMetric, setSizeMetric] = useState<'degree' | 'betweenness' | 'closeness'>('degree');

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const activeEntities = world.entities.filter(e => {
      if (e.properties?.isRelation) return false;
      if (!e.temporalRange) return true;
      return e.temporalRange.validFrom <= currentTime && e.temporalRange.validTo >= currentTime;
    });
    
    const activeEntityIds = new Set(activeEntities.map(e => e.id));
    const activeRelations = world.relations.filter(r => 
      activeEntityIds.has(r.sourceId) && activeEntityIds.has(r.targetId)
    );
    
    const filteredRelations = filterNetwork(activeRelations, activeEntities as any, networkFilters);
    const metrics = computeCentrality(activeEntities, filteredRelations as any);
    
    let finalEntities = activeEntities;
    let finalRelations = filteredRelations;

    if (explorationMode && selectedEntityId) {
      const neighbors = new Set<string>();
      neighbors.add(selectedEntityId);
      
      filteredRelations.forEach(r => {
        if (r.sourceId === selectedEntityId) {
          neighbors.add(r.targetId);
        } else if (r.targetId === selectedEntityId) {
          neighbors.add(r.sourceId);
        }
      });

      finalEntities = activeEntities.filter(e => neighbors.has(e.id));
      const finalEntityIds = new Set(finalEntities.map(e => e.id));
      finalRelations = filteredRelations.filter(r => 
        finalEntityIds.has(r.sourceId) && finalEntityIds.has(r.targetId)
      );
    } else if (trimLeaves) {
      finalEntities = activeEntities.filter(e => metrics[e.id] && metrics[e.id].reducedDegree > 1);
      const finalEntityIds = new Set(finalEntities.map(e => e.id));
      finalRelations = filteredRelations.filter(r => finalEntityIds.has(r.sourceId) && finalEntityIds.has(r.targetId));
    }
    
    const nodes = finalEntities.map(e => {
      const nodeMetric = metrics[e.id] || { degree: 0, betweenness: 0, closeness: 0 };
      
      let nodeVal = 4;
      if (sizeMetric === 'degree') {
        nodeVal = nodeMetric.degree * 2 + 4;
      } else if (sizeMetric === 'betweenness') {
        nodeVal = Math.sqrt(nodeMetric.betweenness) * 4 + 4;
      } else if (sizeMetric === 'closeness') {
        nodeVal = nodeMetric.closeness * 12 + 4;
      }

      return {
        id: e.id,
        name: e.name,
        type: e.type,
        color: e.properties?.color,
        hasWiki: Boolean(e.wikiContent),
        val: nodeVal,
        metrics: nodeMetric
      };
    });

    const links = finalRelations.map(r => ({
      source: r.sourceId,
      target: r.targetId,
      type: r.type,
      weight: r.weight || 1
    }));

    return { nodes, links };
  }, [world.entities, world.relations, currentTime, networkFilters, trimLeaves, explorationMode, selectedEntityId, sizeMetric]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <NetworkToolbar
        explorationMode={explorationMode}
        selectedEntityId={selectedEntityId}
        trimLeaves={trimLeaves}
        sizeMetric={sizeMetric}
        onToggleExploration={() => setExplorationMode(!explorationMode)}
        onToggleTrimLeaves={() => setTrimLeaves(!trimLeaves)}
        onChangeSizeMetric={setSizeMetric}
      />

      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel={(node: any) => `${node.name} (${node.type})${node.hasWiki ? ' 📖 [Wiki]' : ''} - Degré: ${node.metrics.degree}`}
        nodeColor={(node: any) => {
          if (node.id === selectedEntityId) return '#3B82F6';
          if (node.color) return node.color;
          switch (node.type) {
            case 'place': return '#10B981';
            case 'actor': return '#F59E0B';
            case 'event': return '#EF4444';
            default: return '#8B5CF6';
          }
        }}
        nodeRelSize={2}
        linkWidth={(link: any) => Math.sqrt(link.weight || 1)}
        linkColor={() => 'rgba(255, 255, 255, 0.15)'}
        linkDirectionalParticles={(link: any) => link.type === 'trade' || link.type === 'military' ? 2 : 0}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={(node: any) => setSelectedEntity(node.id)}
        onBackgroundClick={() => setSelectedEntity(null)}
      />
    </div>
  );
};
