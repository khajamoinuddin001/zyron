import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { CanvasBlock, CanvasElement } from './Blocks';
import { Monitor, Smartphone, ZoomIn, ZoomOut } from 'lucide-react';

interface CanvasEditorProps {
  block: CanvasBlock;
  onChange: (updates: Partial<CanvasBlock>) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ block, onChange, selectedElementId, onSelectElement }) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [zoom, setZoom] = useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  React.useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const canvasWidth = viewMode === 'desktop' ? 1200 : 375;
  const canvasHeight = viewMode === 'desktop' ? block.desktopHeight : block.mobileHeight;

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    onChange({
      elements: block.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Canvas Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', backgroundColor: '#1f2937', color: 'white', borderRadius: '8px 8px 0 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setViewMode('desktop')} style={{ background: viewMode === 'desktop' ? '#374151' : 'transparent', border: 'none', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Monitor size={16} /> Desktop</button>
          <button onClick={() => setViewMode('mobile')} style={{ background: viewMode === 'mobile' ? '#374151' : 'transparent', border: 'none', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Smartphone size={16} /> Mobile</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><ZoomOut size={16} /></button>
          <span style={{ fontSize: '0.85rem' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.25))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><ZoomIn size={16} /></button>
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{ flex: 1, backgroundColor: '#e5e7eb', position: 'relative', overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }} onClick={() => onSelectElement(null)}>
        <div
          ref={containerRef}
          style={{
            width: viewMode === 'desktop' ? '100%' : `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            backgroundColor: block.styles?.backgroundColor || 'white',
            position: 'relative',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'width 0.3s ease'
          }}
        >
          {block.elements.map((el, index) => {
            const displayX = el.styles?.fullWidth ? 0 : el[viewMode].x;
            const displayWidth = el.styles?.fullWidth ? containerWidth : el[viewMode].width;
            
            return (
            <Rnd
              key={el.id}
              scale={zoom}
              size={{ width: displayWidth, height: el[viewMode].height }}
              position={{ x: displayX, y: el[viewMode].y }}
              disableDragging={!!el.styles?.fullWidth}
              enableResizing={!el.styles?.fullWidth}
              onDragStop={(e, d) => {
                if (!el.styles?.fullWidth) {
                  updateElement(el.id, { [viewMode]: { ...el[viewMode], x: d.x, y: d.y } });
                }
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                updateElement(el.id, {
                  [viewMode]: {
                    ...el[viewMode],
                    width: parseInt(ref.style.width, 10),
                    height: parseInt(ref.style.height, 10),
                    x: position.x,
                    y: position.y
                  }
                });
              }}
              cancel=".cancel-drag"
              onClick={(e: any) => { e.stopPropagation(); onSelectElement(el.id); }}
              onDoubleClick={(e: any) => {
                e.stopPropagation();
                if (el.type === 'text') setEditingElementId(el.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: el.styles?.textAlign || 'flex-start',
                backgroundColor: el.styles?.backgroundColor || 'transparent',
                color: el.styles?.textColor || 'inherit',
                fontSize: el.styles?.fontSize || 'inherit',
                fontWeight: el.styles?.fontWeight || 'inherit',
                borderRadius: el.styles?.borderRadius || '0',
                border: selectedElementId === el.id ? '2px solid var(--primary)' : (el.styles?.border || '1px dashed transparent'),
                outline: selectedElementId === el.id ? '2px solid rgba(99,102,241,0.3)' : 'none',
                cursor: 'move',
                zIndex: el.styles?.zIndex || index + 1
              }}
            >
              <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: editingElementId === el.id ? 'auto' : 'none' }}>
                {el.type === 'text' && (
                  editingElementId === el.id ? (
                    <textarea
                      className="cancel-drag"
                      autoFocus
                      style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', resize: 'none', outline: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', textAlign: (el.styles?.textAlign as any) || 'left', fontFamily: 'inherit', pointerEvents: 'auto' }}
                      value={el.content}
                      onChange={e => updateElement(el.id, { content: e.target.value })}
                      onBlur={() => setEditingElementId(null)}
                      onKeyDown={e => { if (e.key === 'Escape') setEditingElementId(null); }}
                    />
                  ) : (
                    <span style={{ width: '100%', display: 'inline-block', textAlign: (el.styles?.textAlign as any) || 'left', whiteSpace: 'pre-wrap', minHeight: '1.5em' }}>
                      {el.content}
                    </span>
                  )
                )}
                {el.type === 'button' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: el.styles?.backgroundColor || 'var(--primary)', color: el.styles?.textColor || 'white', borderRadius: el.styles?.borderRadius || '4px' }}>
                    {el.content}
                  </div>
                )}
                {el.type === 'image' && <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: el.styles?.borderRadius }} />}
                {el.type === 'shape' && <div style={{ width: '100%', height: '100%' }}></div>}
              </div>
            </Rnd>
            );
          })}
        </div>
      </div>
    </div>
  );
};
