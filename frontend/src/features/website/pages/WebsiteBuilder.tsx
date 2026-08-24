import { CanvasLeftSidebar } from '../components/CanvasLeftSidebar';
import { CanvasTopToolbar } from '../components/CanvasTopToolbar';
import React, { useState, useEffect, useRef } from 'react';
import { Save, Loader2, ArrowLeft, CheckCircle, AlertCircle, Layout, Trash2, ArrowUp, ArrowDown, Settings, Image as ImageIcon, AlignLeft, MousePointerSquareDashed, MessageSquareQuote, HelpCircle, Images, PanelBottom, FileText, Plus, Edit2, Monitor, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/auth.store';
import { PageBlock, BlockType, getDefaultBlock, RenderBlock, WebsitePage, CanvasBlock } from '../components/Blocks';
import { CanvasEditor } from '../components/CanvasEditor';
import { SiteGraph } from '../components/SiteGraph';

const WebsiteBuilder: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  
  const [publicWebsiteEnabled, setPublicWebsiteEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [pages, setPages] = useState<WebsitePage[]>([
    { id: 'home', title: 'Home', slug: '/', blocks: [
      getDefaultBlock('canvas')
    ]}
  ]);
  const [past, setPast] = useState<WebsitePage[][]>([]);
  const [future, setFuture] = useState<WebsitePage[][]>([]);

  const commitState = (newPages: WebsitePage[]) => {
    setPast(prev => [...prev, pages].slice(-50));
    setFuture([]);
    setPages(newPages);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    setPast(newPast);
    setFuture([pages, ...future]);
    setPages(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast([...past, pages]);
    setFuture(newFuture);
    setPages(next);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, pages]);

  const [theme, setTheme] = useState<{ primaryColor: string }>({ primaryColor: '#4f46e5' });
  
  const [currentPageId, setCurrentPageId] = useState<string>('home');
  const [viewMode, setViewMode] = useState<'sitemap' | 'editor'>('sitemap');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedCanvasElementId, setSelectedCanvasElementId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<'content' | 'appearance'>('content');
  const [showThemeSettings, setShowThemeSettings] = useState(false);

  // Manage Pages State
  const [isEditingPage, setIsEditingPage] = useState<string | null>(null); // page ID being edited (for title/slug)
  const [subdomain, setSubdomain] = useState<string>('');

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dismissMobileWarning, setDismissMobileWarning] = useState(false);

  const initializedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user?.organization && !initializedRef.current) {
      setSubdomain((user.organization as any).domain || '');
      const pw = (user.organization as any).publicWebsite;
      if (pw) {
        initializedRef.current = true;
        setPublicWebsiteEnabled(pw.enabled !== false);
        if (pw.theme) setTheme(pw.theme);
        
        const localDraft = localStorage.getItem('zyron_website_draft_pages');
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
              setPages(parsed);
              return;
            }
          } catch (e) {
            console.error("Failed to parse local draft pages", e);
          }
        }

        // Handle migration from old single-page or simple multi-page structure
        if (Array.isArray(pw.pages)) {
          // Already new structure
          setPages(pw.pages.length > 0 ? pw.pages : [{ id: 'home', title: 'Home', slug: '/', blocks: [] }]);
        } else if (pw.pages && typeof pw.pages === 'object' && !Array.isArray(pw.pages)) {
          // Old Record<string, PageBlock[]> structure
          const migratedPages = Object.keys(pw.pages).map(key => ({
            id: key,
            title: key.charAt(0).toUpperCase() + key.slice(1),
            slug: key === 'home' ? '/' : `/${key}`,
            blocks: pw.pages[key] || []
          }));
          setPages(migratedPages);
        } else if (pw.blocks) {
          // Old single array of blocks
          setPages([{ id: 'home', title: 'Home', slug: '/', blocks: pw.blocks }]);
        } else {
          setPages([{ id: 'home', title: 'Home', slug: '/', blocks: [] }]);
        }
      }
    }
  }, [user]);

  // Save to localStorage when pages change
  useEffect(() => {
    if (initializedRef.current && pages.length > 0) {
      localStorage.setItem('zyron_website_draft_pages', JSON.stringify(pages));
    }
  }, [pages]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const publishedPages = pages.map(p => ({ ...p, isDraft: false }));
      const result = await api.patch<{ organization: any }>('/organizations/profile', {
        domain: subdomain.trim().toLowerCase(),
        publicWebsite: {
          enabled: publicWebsiteEnabled,
          theme: theme,
          pages: publishedPages
        }
      });
      if (user) {
        setUser({ ...user, organization: result.organization });
      }
      setPages(publishedPages);
      localStorage.removeItem('zyron_website_draft_pages');
      setMsg({ type: 'success', text: 'Website saved successfully!' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save website' });
      setTimeout(() => setMsg(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const getPublicUrl = () => {
    if (!user || !(user.organization as any)?.domain) return '#';
    const domain = (user.organization as any).domain;
    if (window.location.hostname.includes('localhost')) {
      return `${window.location.protocol}//${domain}.localhost:${window.location.port}`;
    }
    const parts = window.location.hostname.split('.');
    const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : window.location.hostname;
    return `${window.location.protocol}//${domain}.${rootDomain}`;
  };

  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];
  const blocks = currentPage ? currentPage.blocks : [];

  const updatePageBlocks = (newBlocks: PageBlock[]) => {
    commitState(pages.map(p => p.id === currentPageId ? { ...p, blocks: newBlocks } : p));
  };

  const updatePageDetails = (id: string, updates: Partial<WebsitePage>) => {
    commitState(pages.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addPage = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const newPage: WebsitePage = {
      id,
      title: 'New Page',
      slug: `/new-page-${id.substring(0, 4)}`,
      blocks: [getDefaultBlock('canvas', 'blank')],
      isDraft: true
    };
    commitState([...pages, newPage]);
    setCurrentPageId(id);
    setIsEditingPage(id);
  };

  const deletePage = (id: string) => {
    if (pages.length <= 1) {
      alert("You must have at least one page.");
      return;
    }
    const newPages = pages.filter(p => p.id !== id);
    commitState(newPages);
    if (currentPageId === id) {
      setCurrentPageId(newPages[0].id);
    }
  };

  const addBlock = (type: BlockType, variant?: 'template' | 'blank') => {
    const newBlock = getDefaultBlock(type, variant);
    updatePageBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setEditorTab('content');
  };

  const updateSelectedBlock = (updates: Partial<PageBlock>) => {
    updatePageBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, ...updates } as PageBlock : b));
  };

  const deleteBlock = (id: string) => {
    updatePageBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
      setEditorTab('content');
    }
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    updatePageBlocks(newBlocks);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const handleAddElementToCanvas = (type: 'text' | 'shape' | 'button' | 'image' | 'video' | 'icon') => {
    let targetBlock = blocks.find(b => b.id === selectedBlockId);
    if (!targetBlock || targetBlock.type !== 'canvas') {
      targetBlock = blocks.find(b => b.type === 'canvas');
      if (targetBlock) {
        setSelectedBlockId(targetBlock.id);
      } else {
        alert('Please add a Freeform Canvas first to place elements on.');
        return;
      }
    }

    const newElId = `el-${Date.now()}`;
    const defaultWidth = type === 'shape' ? 100 : type === 'image' || type === 'video' ? 300 : type === 'icon' ? 50 : 200;
    const defaultHeight = type === 'shape' ? 100 : type === 'image' || type === 'video' ? 200 : type === 'icon' ? 50 : 50;

    const newElement: any = {
      id: newElId,
      type: type,
      content: type === 'text' ? '' : type === 'button' ? 'Click Me' : type === 'image' ? 'https://images.unsplash.com/photo-1498050108023-c5249f4df085' : '',
      desktop: { x: 50, y: 50, width: defaultWidth, height: defaultHeight },
      mobile: { x: 10, y: 50, width: defaultWidth, height: defaultHeight },
      styles: type === 'shape' ? { backgroundColor: '#e5e7eb', borderRadius: '8px' } :
              type === 'button' ? { backgroundColor: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px' } :
              type === 'text' ? { fontSize: '16px', color: '#111827' } : {}
    };

    const elements = [...((targetBlock as any).elements || []), newElement];
    updatePageBlocks(blocks.map(b => b.id === targetBlock!.id ? { ...b, elements } : b));
    setSelectedCanvasElementId(newElId);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
      
      {isMobile && !dismissMobileWarning && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <Monitor size={48} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Desktop Recommended</h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem', maxWidth: '400px', lineHeight: '1.5' }}>
            The Website Designer is heavily optimized for larger screens to give you the best drag-and-drop experience. Please open this on a desktop or laptop to fully use all features.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/dashboard/apps')}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              Exit
            </button>
            <button 
              onClick={() => setDismissMobileWarning(true)}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}

      {/* ─── TOP BAR (Global) ─── */}
      <div style={{ 
        height: '60px', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 10,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/dashboard/apps')}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.4rem', backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: '6px' }}>
              <Layout size={16} color="var(--primary)" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#111827', fontWeight: 600 }}>Website Designer</h2>
          </div>
          {viewMode === 'editor' && (
            <button 
              onClick={() => setViewMode('sitemap')} 
              style={{ marginLeft: '1rem', padding: '0.5rem 1rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={14} /> Back to Sitemap
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: 500 }}>Public Access</span>
            <input 
              type="checkbox" 
              checked={publicWebsiteEnabled} 
              onChange={(e) => setPublicWebsiteEnabled(e.target.checked)} 
              style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} 
            />
          </label>

          {publicWebsiteEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="text"
                value={subdomain}
                onChange={e => setSubdomain(e.target.value)}
                placeholder="your-subdomain"
                style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', width: '130px', fontFamily: 'monospace' }}
              />
              <span style={{ fontSize: '0.85rem', color: '#6b7280', fontFamily: 'monospace' }}>.zyron.com</span>
            </div>
          )}

          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '0.5rem 1.25rem', fontWeight: 600 }}>
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            Publish
          </button>

          <a 
            href={getPublicUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#374151', textDecoration: 'none' }}
          >
            <Globe size={16} /> View Live
          </a>
        </div>
      </div>

      {msg && (
        <div style={{ position: 'absolute', top: '5rem', right: '1.5rem', zIndex: 50, padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: msg.type === 'success' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecaca'}`, color: msg.type === 'success' ? '#059669' : '#dc2626', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 500 }}>{msg.text}</span>
        </div>
      )}

      {viewMode === 'sitemap' ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <SiteGraph 
            pages={pages} 
            onEditPage={(pageId) => {
              setCurrentPageId(pageId);
              setViewMode('editor');
            }} 
            onPageMoved={(pageId, position) => {
              updatePageDetails(pageId, { graphPosition: position });
            }}
            onDeletePage={deletePage}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          <CanvasLeftSidebar 
            pages={pages}
            currentPageId={currentPageId}
            setCurrentPageId={setCurrentPageId}
            addPage={addPage}
            updatePageDetails={updatePageDetails}
            deletePage={(id) => setPages(pages.filter(p => p.id !== id))}
            blocks={blocks}
            updatePageBlocks={updatePageBlocks}
            selectedBlockId={selectedBlockId}
            setSelectedBlockId={setSelectedBlockId}
            getDefaultBlock={getDefaultBlock}
            theme={theme}
            setTheme={setTheme}
            addElementToCanvas={handleAddElementToCanvas}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
            
            {/* CONTEXTUAL TOP TOOLBAR */}
            {selectedBlock && selectedBlock.type === 'canvas' && (
              <CanvasTopToolbar 
                pages={pages}
                selectedElement={(selectedBlock as any).elements?.find((e: any) => e.id === selectedCanvasElementId) || null}
                updateElement={(updates) => {
                  const elements = (selectedBlock as any).elements.map((e: any) => e.id === selectedCanvasElementId ? { ...e, ...updates } : e);
                  updatePageBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, elements } : b));
                }}
                deleteElement={() => {
                  const elements = (selectedBlock as any).elements.filter((e: any) => e.id !== selectedCanvasElementId);
                  updatePageBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, elements } : b));
                  setSelectedCanvasElementId(null);
                }}
                duplicateElement={() => {
                  const el = (selectedBlock as any).elements.find((e: any) => e.id === selectedCanvasElementId);
                  if (el) {
                    const newEl = { ...el, id: `el-${Date.now()}`, desktop: { ...el.desktop, x: el.desktop.x + 20, y: el.desktop.y + 20 }, mobile: { ...el.mobile, x: el.mobile.x + 20, y: el.mobile.y + 20 } };
                    const elements = [...(selectedBlock as any).elements, newEl];
                    updatePageBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, elements } : b));
                  }
                }}
                bringForward={() => {
                  const elements = [...(selectedBlock as any).elements];
                  const idx = elements.findIndex((e: any) => e.id === selectedCanvasElementId);
                  if (idx < elements.length - 1) {
                    const temp = elements.splice(idx, 1)[0];
                    elements.push(temp); // Move all the way to the end (top layer)
                    updatePageBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, elements } : b));
                  }
                }}
                sendBackward={() => {
                  const elements = [...(selectedBlock as any).elements];
                  const idx = elements.findIndex((e: any) => e.id === selectedCanvasElementId);
                  if (idx > 0) {
                    const temp = elements.splice(idx, 1)[0];
                    elements.unshift(temp); // Move all the way to the start (bottom layer)
                    updatePageBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, elements } : b));
                  }
                }}
              />
            )}

            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#e5e7eb' }}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: '10rem' }}>
                {blocks.map((block, index) => (
                  <div 
                    key={block.id} 
                    onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); setSelectedCanvasElementId(null); }}
                    style={{ position: 'relative', border: `2px solid ${selectedBlockId === block.id ? '#6366f1' : 'transparent'}`, boxShadow: selectedBlockId === block.id ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  >
                    {selectedBlockId === block.id && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); updatePageBlocks(blocks.filter(b => b.id !== block.id)); setSelectedBlockId(null); }}
                        style={{ position: 'absolute', top: '-28px', right: '-2px', zIndex: 50, background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px 4px 0 0', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Delete Block
                      </button>
                    )}
                    {/* Render Block Content */}
                    {block.type === 'navbar' && <RenderBlock block={block} />}
                    {block.type === 'footer' && <RenderBlock block={block} />}
                    {block.type === 'canvas' && (
                       <CanvasEditor 
                         block={block as CanvasBlock}
                         selectedElementId={selectedBlockId === block.id ? selectedCanvasElementId : null}
                         onSelectElement={setSelectedCanvasElementId}
                         onChange={(updates) => {
                           updatePageBlocks(blocks.map(b => b.id === block.id ? { ...b, ...updates } : b));
                         }}
                       />
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default WebsiteBuilder;
