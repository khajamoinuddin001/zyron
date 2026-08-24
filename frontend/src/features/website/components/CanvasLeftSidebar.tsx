import React, { useState } from 'react';
import { Layout, Type, Image as ImageIcon, Copy, Plus, Trash2, Box, ArrowLeft, Settings } from 'lucide-react';
import { WebsitePage, PageBlock, CanvasBlock, CanvasElement } from './Blocks';

export interface CanvasLeftSidebarProps {
  pages: WebsitePage[];
  currentPageId: string;
  setCurrentPageId: (id: string) => void;
  addPage: () => void;
  updatePageDetails: (id: string, updates: Partial<WebsitePage>) => void;
  deletePage: (id: string) => void;
  
  blocks: PageBlock[];
  updatePageBlocks: (blocks: PageBlock[]) => void;
  
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  
  getDefaultBlock: (type: any, layout?: string) => any;
  
  theme: any;
  setTheme: (t: any) => void;

  addElementToCanvas?: (type: 'text' | 'shape' | 'button' | 'image' | 'video' | 'icon') => void;
}

export const CanvasLeftSidebar: React.FC<CanvasLeftSidebarProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'pages' | 'elements' | 'text' | 'settings'>('pages');

  const handleAddCanvasBlock = () => {
    const existingCanvas = props.blocks.find(b => b.type === 'canvas');
    if (!existingCanvas) {
      props.updatePageBlocks([...props.blocks, props.getDefaultBlock('canvas', 'blank')]);
    } else {
      props.setSelectedBlockId(existingCanvas.id);
    }
  };

  const handleAddNavbar = () => {
    if (!props.blocks.find(b => b.type === 'navbar')) {
      props.updatePageBlocks([props.getDefaultBlock('navbar'), ...props.blocks]);
    }
  };

  const handleAddFooter = () => {
    if (!props.blocks.find(b => b.type === 'footer')) {
      props.updatePageBlocks([...props.blocks, props.getDefaultBlock('footer')]);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* NARROW TABS */}
      <div style={{ width: '70px', backgroundColor: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem', gap: '0.5rem', color: '#9ca3af' }}>
        <TabButton icon={<Layout size={24} />} label="Pages" active={activeTab === 'pages'} onClick={() => setActiveTab('pages')} />
        <TabButton icon={<Box size={24} />} label="Elements" active={activeTab === 'elements'} onClick={() => setActiveTab('elements')} />
        <TabButton icon={<Type size={24} />} label="Text" active={activeTab === 'text'} onClick={() => setActiveTab('text')} />
        <TabButton icon={<Settings size={24} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>

      {/* FLYOUT MENU */}
      <div style={{ width: '300px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827', textTransform: 'capitalize' }}>{activeTab}</h3>
        </div>
        
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeTab === 'pages' && (
            <>
              <button onClick={props.addPage} style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 500 }}>
                <Plus size={16} /> Add New Page
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {props.pages.map(p => (
                  <div key={p.id} 
                    onClick={() => props.setCurrentPageId(p.id)}
                    style={{ padding: '0.75rem', border: `1px solid ${props.currentPageId === p.id ? 'var(--primary)' : '#e5e7eb'}`, borderRadius: '6px', cursor: 'pointer', backgroundColor: props.currentPageId === p.id ? 'rgba(99,102,241,0.05)' : 'white' }}>
                    {props.currentPageId === p.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                           <input 
                             type="text" 
                             value={p.title} 
                             onChange={e => props.updatePageDetails(p.id, { title: e.target.value })} 
                             style={{ fontWeight: 600, fontSize: '0.9rem', border: '1px solid #e5e7eb', padding: '0.25rem', borderRadius: '4px', width: '100%' }} 
                           />
                           {p.isDraft && <span style={{color: 'red', fontSize: '0.7rem', marginLeft: '0.5rem'}}>*Draft</span>}
                         </div>
                         <input 
                           type="text" 
                           value={p.slug} 
                           onChange={e => props.updatePageDetails(p.id, { slug: e.target.value })} 
                           style={{ fontSize: '0.8rem', border: '1px solid #e5e7eb', padding: '0.25rem', borderRadius: '4px', color: '#6b7280', width: '100%' }} 
                         />
                      </div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{p.title} {p.isDraft && <span style={{color: 'red', fontSize: '0.7rem'}}>*Draft</span>}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{p.slug}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'elements' && (
            <>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', marginBottom: '-0.5rem' }}>Structure</div>
              <button onClick={handleAddCanvasBlock} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <Box size={24} color="#8b5cf6" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Freeform Canvas</span>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Drag & Drop Area</span>
              </button>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', marginTop: '1rem', marginBottom: '-0.5rem' }}>Canvas Elements</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button onClick={() => props.addElementToCanvas?.('shape')} style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '20px', height: '20px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Shape</span>
                </button>
                <button onClick={() => props.addElementToCanvas?.('button')} style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ padding: '2px 8px', backgroundColor: '#6366f1', color: 'white', borderRadius: '4px', fontSize: '0.65rem' }}>Btn</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Button</span>
                </button>
                <button onClick={() => props.addElementToCanvas?.('image')} style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <ImageIcon size={20} color="#6b7280" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Image</span>
                </button>
                <button onClick={() => props.addElementToCanvas?.('video')} style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '20px', height: '14px', border: '2px solid #6b7280', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid #6b7280' }}></div></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Video</span>
                </button>
                <button onClick={() => props.addElementToCanvas?.('icon')} style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🌟</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Icon</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'text' && (
            <>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', marginBottom: '-0.5rem' }}>Add Text</div>
              <button onClick={() => props.addElementToCanvas?.('text')} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>H1</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Add a heading</span>
              </button>
              <button onClick={() => props.addElementToCanvas?.('text')} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>H2</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Add a subheading</span>
              </button>
              <button onClick={() => props.addElementToCanvas?.('text')} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1rem' }}>P</span>
                <span style={{ fontSize: '0.85rem' }}>Add body text</span>
              </button>
            </>
          )}

          {activeTab === 'settings' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Primary Color</label>
                  <input type="color" value={props.theme.primaryColor || '#6366f1'} onChange={e => props.setTheme({...props.theme, primaryColor: e.target.value})} style={{ width: '100%', height: '40px', padding: '0', border: 'none', borderRadius: '6px' }} />
               </div>
               <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Font Family</label>
                  <select className="input" style={{ width: '100%' }} value={props.theme.fontFamily || 'Inter'} onChange={e => props.setTheme({...props.theme, fontFamily: e.target.value})}>
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Playfair Display">Playfair Display</option>
                  </select>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    style={{ 
      width: '60px', 
      height: '60px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '0.25rem', 
      background: 'transparent', 
      border: 'none', 
      cursor: 'pointer',
      color: active ? 'white' : '#9ca3af',
      backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
      borderRadius: '8px'
    }}
  >
    {icon}
    <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>{label}</span>
  </button>
);
