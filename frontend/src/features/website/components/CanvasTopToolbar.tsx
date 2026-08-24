import React from 'react';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, ArrowUp, ArrowDown, Copy, Trash2, Link } from 'lucide-react';
import { CanvasElement, CanvasBlock } from './Blocks';

export interface CanvasTopToolbarProps {
  selectedElement: CanvasElement | null;
  updateElement: (updates: Partial<CanvasElement>) => void;
  deleteElement: () => void;
  duplicateElement: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  pages?: { title: string, slug: string }[];
}

export const CanvasTopToolbar: React.FC<CanvasTopToolbarProps> = ({ 
  selectedElement, 
  updateElement, 
  deleteElement, 
  duplicateElement, 
  bringForward, 
  sendBackward,
  pages = []
}) => {
  if (!selectedElement) {
    return (
      <div style={{ height: '50px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 1rem', color: '#6b7280', fontSize: '0.85rem' }}>
        Select an element to edit properties.
      </div>
    );
  }

  const el = selectedElement;

  return (
    <div style={{ height: '50px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem', overflowX: 'auto' }}>
      
      {/* CONTENT CONTROL */}
      {(el.type === 'text' || el.type === 'button' || el.type === 'image') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid #e5e7eb', paddingRight: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{el.type === 'image' ? 'Image:' : 'Text:'}</span>
          {el.type === 'image' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input 
                type="text" 
                placeholder="https://..."
                style={{ width: '120px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                value={el.content.startsWith('data:') ? '' : el.content}
                onChange={e => updateElement({ content: e.target.value })}
              />
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem 0.5rem', background: '#e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                Upload
                <input 
                  type="file" 
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateElement({ content: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          ) : (
            <input 
              type="text" 
              placeholder="Enter text"
              style={{ width: '150px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}
              value={el.content}
              onChange={e => updateElement({ content: e.target.value })}
            />
          )}
          <Link size={14} color="#6b7280" />
          <input 
            type="text" 
            list="page-links"
            placeholder="Link (e.g. /about)"
            style={{ width: '120px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}
            value={el.link || ''}
            onChange={e => updateElement({ link: e.target.value })}
          />
          <datalist id="page-links">
            {pages.map(p => (
              <option key={p.slug} value={p.slug}>{p.title}</option>
            ))}
          </datalist>
        </div>
      )}

      {/* TEXT CONTROLS */}
      {(el.type === 'text' || el.type === 'button') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid #e5e7eb', paddingRight: '1rem' }}>
          <select 
            style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}
            value={el.styles?.fontFamily || 'inherit'}
            onChange={e => updateElement({ styles: { ...el.styles, fontFamily: e.target.value } })}
          >
            <option value="inherit">Theme Font</option>
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Playfair Display">Playfair Display</option>
            <option value="monospace">Monospace</option>
          </select>

          <input 
            type="number" 
            style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}
            value={parseInt(el.styles?.fontSize as string) || 16}
            onChange={e => updateElement({ styles: { ...el.styles, fontSize: `${e.target.value}px` } })}
          />

          <input 
            type="color" 
            value={el.styles?.color || '#000000'}
            onChange={e => updateElement({ styles: { ...el.styles, color: e.target.value } })}
            style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            title="Text Color"
          />

          <button onClick={() => updateElement({ styles: { ...el.styles, fontWeight: el.styles?.fontWeight === 'bold' ? 'normal' : 'bold' } })} style={{ background: el.styles?.fontWeight === 'bold' ? '#e5e7eb' : 'transparent', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }}>
            <Bold size={16} />
          </button>
          
          <button onClick={() => updateElement({ styles: { ...el.styles, fontStyle: el.styles?.fontStyle === 'italic' ? 'normal' : 'italic' } })} style={{ background: el.styles?.fontStyle === 'italic' ? '#e5e7eb' : 'transparent', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }}>
            <Italic size={16} />
          </button>

          <button onClick={() => updateElement({ styles: { ...el.styles, textAlign: 'left' } })} style={{ background: el.styles?.textAlign === 'left' ? '#e5e7eb' : 'transparent', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }}><AlignLeft size={16} /></button>
          <button onClick={() => updateElement({ styles: { ...el.styles, textAlign: 'center' } })} style={{ background: el.styles?.textAlign === 'center' ? '#e5e7eb' : 'transparent', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }}><AlignCenter size={16} /></button>
          <button onClick={() => updateElement({ styles: { ...el.styles, textAlign: 'right' } })} style={{ background: el.styles?.textAlign === 'right' ? '#e5e7eb' : 'transparent', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }}><AlignRight size={16} /></button>
        </div>
      )}

      {/* SHAPE CONTROLS */}
      {(el.type === 'shape' || el.type === 'button') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid #e5e7eb', paddingRight: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Fill:</span>
            <input 
              type="color" 
              value={el.styles?.backgroundColor || '#ffffff'}
              onChange={e => updateElement({ styles: { ...el.styles, backgroundColor: e.target.value } })}
              style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Border:</span>
            <input 
              type="color" 
              value={el.styles?.borderColor || '#000000'}
              onChange={e => updateElement({ styles: { ...el.styles, borderColor: e.target.value } })}
              style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
          </div>
          <input 
            type="number" 
            placeholder="Border Width"
            style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}
            value={parseInt(el.styles?.borderWidth as string) || 0}
            onChange={e => updateElement({ styles: { ...el.styles, borderWidth: `${e.target.value}px`, borderStyle: 'solid' } })}
          />
          <input 
            type="number" 
            placeholder="Radius"
            style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}
            value={parseInt(el.styles?.borderRadius as string) || 0}
            onChange={e => updateElement({ styles: { ...el.styles, borderRadius: `${e.target.value}px` } })}
          />
        </div>
      )}

      {/* OPACITY */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid #e5e7eb', paddingRight: '1rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Opacity:</span>
        <input 
          type="range" 
          min="0" max="1" step="0.1" 
          value={el.styles?.opacity || 1}
          onChange={e => updateElement({ styles: { ...el.styles, opacity: parseFloat(e.target.value) } })}
        />
      </div>

      {/* FULL WIDTH */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid #e5e7eb', paddingRight: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={!!el.styles?.fullWidth}
              onChange={e => updateElement({ styles: { ...el.styles, fullWidth: e.target.checked } })}
            />
            Full Width
        </label>
      </div>

      {/* LAYERING & ACTIONS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
        <button onClick={bringForward} style={{ background: 'transparent', border: 'none', padding: '0.25rem', cursor: 'pointer' }} title="Bring Forward"><ArrowUp size={16} /></button>
        <button onClick={sendBackward} style={{ background: 'transparent', border: 'none', padding: '0.25rem', cursor: 'pointer' }} title="Send Backward"><ArrowDown size={16} /></button>
        <button onClick={duplicateElement} style={{ background: 'transparent', border: 'none', padding: '0.25rem', cursor: 'pointer' }} title="Duplicate"><Copy size={16} /></button>
        <button onClick={deleteElement} style={{ background: 'transparent', border: 'none', padding: '0.25rem', cursor: 'pointer', color: '#ef4444' }} title="Delete"><Trash2 size={16} /></button>
      </div>

    </div>
  );
};
