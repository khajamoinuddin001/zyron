import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WebsitePage, CanvasBlock } from './Blocks';

// --- Custom Node ---
const PageNode = ({ data }: { data: { title: string; slug: string; isHome: boolean; isDraft?: boolean; onDoubleClick: () => void } }) => {
  return (
    <div
      onDoubleClick={data.onDoubleClick}
      style={{
        padding: '1rem',
        borderRadius: '12px',
        background: 'white',
        border: `2px ${data.isDraft ? 'dashed' : 'solid'} ${data.isDraft ? '#ef4444' : data.isHome ? '#6366f1' : '#e5e7eb'}`,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minWidth: '200px',
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      {data.isDraft && (
        <span style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>DRAFT</span>
      )}
      {/* Top handles */}
      <Handle type="target" position={Position.Top} id="top-in" style={{ left: '45%', opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="top-out" style={{ left: '55%', opacity: 0 }} />

      {/* Right handles */}
      <Handle type="target" position={Position.Right} id="right-in" style={{ top: '60%', opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right-out" style={{ top: '40%', opacity: 0 }} />

      {/* Bottom handles */}
      <Handle type="target" position={Position.Bottom} id="bottom-in" style={{ left: '55%', opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-out" style={{ left: '45%', opacity: 0 }} />

      {/* Left handles */}
      <Handle type="target" position={Position.Left} id="left-in" style={{ top: '40%', opacity: 0 }} />
      <Handle type="source" position={Position.Left} id="left-out" style={{ top: '60%', opacity: 0 }} />

      <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1f2937', marginBottom: '0.25rem' }}>
        {data.title}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#6b7280', fontFamily: 'monospace' }}>
        {data.slug}
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
        Double click to edit
      </div>
    </div>
  );
};

const nodeTypes = {
  pageNode: PageNode,
};

// --- Graph Component ---
interface SiteGraphProps {
  pages: WebsitePage[];
  onEditPage: (pageId: string) => void;
  onPageMoved: (pageId: string, position: { x: number, y: number }) => void;
  onDeletePage: (pageId: string) => void;
}

export const SiteGraph: React.FC<SiteGraphProps> = ({ pages, onEditPage, onPageMoved, onDeletePage }) => {
  const initialNodes = useMemo(() => {
    return pages.map((page, index) => {
      // Very basic auto-layout: distribute horizontally based on index, with home at top
      const isHome = page.id === 'home' || page.slug === '/';
      const x = page.graphPosition?.x ?? (isHome ? 250 : 100 + (index * 250));
      const y = page.graphPosition?.y ?? (isHome ? 50 : 250 + ((index % 2) * 100));

      return {
        id: page.id,
        type: 'pageNode',
        position: { x, y },
        data: {
          title: page.title,
          slug: page.slug,
          isHome,
          isDraft: page.isDraft,
          onDoubleClick: () => onEditPage(page.id),
        },
      };
    });
  }, [pages, onEditPage]);

  const initialEdges = useMemo(() => {
    const edges: any[] = [];
    
    // Find all links in all canvas blocks
    pages.forEach(sourcePage => {
      const addEdge = (linkUrl: string) => {
        if (!linkUrl) return;
        const targetPage = pages.find(p => p.slug === linkUrl);
        if (targetPage && targetPage.id !== sourcePage.id) {
          const edgeId = `e-${sourcePage.id}-${targetPage.id}`;
          if (!edges.some(e => e.id === edgeId)) {
            edges.push({
              id: edgeId,
              source: sourcePage.id,
              target: targetPage.id,
              animated: true,
              style: { stroke: '#6366f1', strokeWidth: 2 },
              markerStart: 'custom-start-dot',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#6366f1',
              },
            });
          }
        }
      };

      sourcePage.blocks.forEach(block => {
        if (block.type === 'canvas') {
          const canvasBlock = block as CanvasBlock;
          canvasBlock.elements.forEach(el => addEdge(el.link || ''));
        } else if (block.type === 'navbar') {
          const navBlock = block as any;
          navBlock.links?.forEach((l: any) => addEdge(l.url));
          if (navBlock.ctaUrl) addEdge(navBlock.ctaUrl);
        } else if (block.type === 'footer') {
          const footerBlock = block as any;
          footerBlock.links?.forEach((l: any) => addEdge(l.url));
        }
      });
    });

    return edges;
  }, [pages]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Dynamically route edges to the closest handles when nodes move
  useEffect(() => {
    setEdges((eds) => 
      eds.map((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (sourceNode && targetNode) {
          const dx = (targetNode.position.x + 100) - (sourceNode.position.x + 100);
          const dy = (targetNode.position.y + 50) - (sourceNode.position.y + 50);
          
          let sHandle = 'bottom-out';
          let tHandle = 'top-in';

          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) { sHandle = 'right-out'; tHandle = 'left-in'; }
            else { sHandle = 'left-out'; tHandle = 'right-in'; }
          } else {
            if (dy > 0) { sHandle = 'bottom-out'; tHandle = 'top-in'; }
            else { sHandle = 'top-out'; tHandle = 'bottom-in'; }
          }
          return { ...edge, sourceHandle: sHandle, targetHandle: tHandle };
        }
        return edge;
      })
    );
  }, [nodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
        <defs>
          <marker id="custom-start-dot" viewBox="-5 -5 10 10" refX="0" refY="0" markerWidth="6" markerHeight="6" markerUnits="strokeWidth">
            <circle cx="0" cy="0" r="2.5" fill="#6366f1" />
          </marker>
        </defs>
      </svg>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={(deleted) => {
          deleted.forEach(n => onDeletePage(n.id));
        }}
        onNodeDragStop={(event, node) => onPageMoved(node.id, node.position)}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <MiniMap nodeStrokeColor={(n) => {
          if (n.type === 'pageNode') return '#6366f1';
          return '#eee';
        }} nodeColor="#fff" />
      </ReactFlow>
    </div>
  );
};
