import React, { useState } from 'react';

// --- Types ---
export type BlockType = 'navbar' | 'footer' | 'canvas';

export interface WebsitePage {
  id: string;
  title: string;
  slug: string;
  blocks: PageBlock[];
  isDraft?: boolean;
  graphPosition?: { x: number; y: number };
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
  };
}

export interface NavbarBlock extends BaseBlock {
  type: 'navbar';
  logoText: string;
  logoImageUrl?: string;
  links: { label: string; url: string }[];
  ctaText?: string;
  ctaUrl?: string;
}

export interface FooterBlock extends BaseBlock {
  type: 'footer';
  text: string;
  links: { label: string; url: string }[];
}

export type CanvasElementType = 'text' | 'image' | 'button' | 'shape' | 'icon' | 'video';

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  content: string;
  link?: string;
  desktop: { x: number; y: number; width: number; height: number };
  mobile: { x: number; y: number; width: number; height: number };
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    borderRadius?: string;
    borderWidth?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    borderColor?: string;
    boxShadow?: string;
    opacity?: number;
    zIndex?: number;
    fontFamily?: string;
    iconName?: string; // For icon type
  };
}

export interface CanvasBlock extends BaseBlock {
  type: 'canvas';
  desktopHeight: number;
  mobileHeight: number;
  elements: CanvasElement[];
}

export type PageBlock = NavbarBlock | FooterBlock | CanvasBlock;

// --- Default Data ---
export const getDefaultBlock = (type: BlockType, variant?: 'template' | 'blank'): PageBlock => {
  const id = Math.random().toString(36).substr(2, 9);
  switch (type) {
    case 'navbar': return { id, type, logoText: 'MyWebsite', links: [{ label: 'Home', url: '/' }, { label: 'About', url: '/about' }], ctaText: 'Get Started', ctaUrl: '/register' };
    case 'footer': return { id, type, text: '© 2026 Your Company. All rights reserved.', links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Service', url: '/terms' }] };
    case 'canvas': 
      if (variant === 'blank') {
        return { 
          id, type, desktopHeight: 400, mobileHeight: 400, elements: []
        };
      }
      return { 
        id, type, desktopHeight: 800, mobileHeight: 1200, elements: [
          { id: 'el-bg', type: 'image', content: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2850&auto=format&fit=crop', desktop: { x: 0, y: 0, width: 1200, height: 800 }, mobile: { x: 0, y: 0, width: 375, height: 1200 }, styles: { borderRadius: '0px' } },
          { id: 'el-overlay', type: 'shape', content: '', desktop: { x: 0, y: 0, width: 1200, height: 800 }, mobile: { x: 0, y: 0, width: 375, height: 1200 }, styles: { backgroundColor: 'rgba(0,0,0,0.6)' } },
          { id: 'el-title', type: 'text', content: 'Design with Absolute Freedom', desktop: { x: 200, y: 250, width: 800, height: 100 }, mobile: { x: 20, y: 300, width: 335, height: 120 }, styles: { fontSize: '64px', fontWeight: '800', textColor: '#ffffff', textAlign: 'center' } },
          { id: 'el-subtitle', type: 'text', content: 'Welcome to your Canva-style website builder. Drag, drop, and resize anything.', desktop: { x: 300, y: 370, width: 600, height: 60 }, mobile: { x: 20, y: 440, width: 335, height: 80 }, styles: { fontSize: '20px', fontWeight: '400', textColor: '#d1d5db', textAlign: 'center' } },
          { id: 'el-btn', type: 'button', content: 'Get Started Today', link: '#', desktop: { x: 475, y: 480, width: 250, height: 60 }, mobile: { x: 62.5, y: 550, width: 250, height: 60 }, styles: { backgroundColor: 'var(--primary)', textColor: '#ffffff', fontSize: '18px', fontWeight: '600', borderRadius: '30px' } },
        ]
      };
  }
};

// --- Renderers ---
export const RenderBlock: React.FC<{ block: PageBlock }> = ({ block }) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: block.styles?.backgroundColor || undefined,
    color: block.styles?.textColor || undefined,
    paddingTop: block.styles?.paddingTop || undefined,
    paddingBottom: block.styles?.paddingBottom || undefined,
  };

  const renderContent = () => {
  switch (block.type) {
    case 'navbar':
      return (
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', backgroundColor: 'inherit', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {block.logoImageUrl ? <img src={block.logoImageUrl} alt="Logo" style={{ height: '40px' }} /> : null}
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'inherit' }}>{block.logoText}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {block.links.map((l, i) => <a key={i} href={l.url} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>{l.label}</a>)}
            {block.ctaText && <a href={block.ctaUrl} style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>{block.ctaText}</a>}
          </div>
        </nav>
      );
    case 'footer':
      return (
        <footer style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
              {block.links.map((link, i) => (
                <a key={i} href={link.url} style={{ color: 'white', textDecoration: 'none', fontWeight: 500, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
                  {link.label}
                </a>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{block.text}</p>
          </div>
        </footer>
      );
    case 'canvas':
      return (
        <div className="canvas-block-wrapper" style={{ position: 'relative', width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
          <style dangerouslySetInnerHTML={{__html: `
            .canvas-${block.id} { height: ${block.mobileHeight}px; position: relative; width: 100%; }
            @media (min-width: 768px) {
              .canvas-${block.id} { height: ${block.desktopHeight}px; width: 100%; }
            }
          `}} />
          <div className={`canvas-${block.id}`}>
            {block.elements.map((el, index) => (
              <React.Fragment key={el.id}>
                <style dangerouslySetInnerHTML={{__html: `
                  .canvas-element-${el.id} {
                    left: ${el.styles?.fullWidth ? '0' : `${el.mobile.x}px`};
                    top: ${el.mobile.y}px;
                    width: ${el.styles?.fullWidth ? '100%' : `${el.mobile.width}px`};
                    height: ${el.mobile.height}px;
                  }
                  @media (min-width: 768px) {
                    .canvas-element-${el.id} {
                      left: ${el.styles?.fullWidth ? '0' : `${el.desktop.x}px`} !important;
                      top: ${el.desktop.y}px !important;
                      width: ${el.styles?.fullWidth ? '100%' : `${el.desktop.width}px`} !important;
                      height: ${el.desktop.height}px !important;
                    }
                  }
                `}} />
                <div className={`canvas-element-${el.id}`} style={{
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: el.styles?.textAlign || 'flex-start',
                  backgroundColor: el.styles?.backgroundColor || 'transparent',
                  color: el.styles?.textColor || 'inherit',
                  fontSize: el.styles?.fontSize || 'inherit',
                  fontWeight: el.styles?.fontWeight || 'inherit',
                  borderRadius: el.styles?.borderRadius || '0',
                  borderWidth: el.styles?.borderWidth || '0px',
                  borderStyle: el.styles?.borderStyle || 'solid',
                  borderColor: el.styles?.borderColor || 'transparent',
                  boxShadow: el.styles?.boxShadow || 'none',
                  opacity: el.styles?.opacity ?? 1,
                  zIndex: el.styles?.zIndex || index + 1,
                  fontFamily: el.styles?.fontFamily || 'inherit',
                  overflow: 'hidden'
                }}>
                  <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                    {el.type === 'text' && (
                      el.link 
                        ? <a href={el.link} style={{ width: '100%', display: 'inline-block', textAlign: el.styles?.textAlign || 'left', whiteSpace: 'pre-wrap', textDecoration: 'none', color: 'inherit' }}>{el.content}</a>
                        : <span style={{ width: '100%', display: 'inline-block', textAlign: el.styles?.textAlign || 'left', whiteSpace: 'pre-wrap' }}>{el.content}</span>
                    )}
                  {el.type === 'button' && (
                    <a href={el.link || '#'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: el.styles?.backgroundColor || 'var(--primary)', color: el.styles?.textColor || 'white', textDecoration: 'none', borderRadius: el.styles?.borderRadius || '4px' }}>
                      {el.content}
                    </a>
                  )}
                  {el.type === 'image' && (
                    el.link 
                      ? <a href={el.link} style={{ display: 'block', width: '100%', height: '100%' }}><img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: el.styles?.borderRadius }} /></a>
                      : <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: el.styles?.borderRadius }} />
                  )}
                  {el.type === 'shape' && <div style={{ width: '100%', height: '100%' }}></div>}
                  {el.type === 'video' && <iframe src={el.content} style={{ width: '100%', height: '100%', border: 'none', borderRadius: el.styles?.borderRadius, pointerEvents: 'auto' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
                  {el.type === 'icon' && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {el.styles?.iconName === 'star' ? <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /> :
                         el.styles?.iconName === 'heart' ? <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /> :
                         el.styles?.iconName === 'check' ? <polyline points="20 6 9 17 4 12" /> :
                         <circle cx="12" cy="12" r="10" /> /* default icon circle */}
                      </svg>
                    </div>
                  )}
                </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
  };

  return (
    <div style={containerStyle}>
      {renderContent()}
    </div>
  );
};
