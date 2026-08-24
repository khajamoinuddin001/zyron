import React from 'react';
import { useBrandingStore } from '../store/branding.store';
import { RenderBlock, PageBlock, WebsitePage } from '../features/website/components/Blocks';
import { useLocation } from 'react-router-dom';

const TenantLandingPage: React.FC = () => {
  const { name, publicWebsite } = useBrandingStore();
  const location = useLocation();

  let blocksToRender: PageBlock[] = [];

  if (publicWebsite) {
    if (Array.isArray(publicWebsite.pages)) {
      // New array-based dynamic pages structure
      const match = publicWebsite.pages.find((p: WebsitePage) => p.slug === location.pathname);
      if (match) {
        blocksToRender = match.blocks || [];
      }
    } else if (publicWebsite.pages && typeof publicWebsite.pages === 'object') {
      // Legacy Record<string, PageBlock[]> support for backward compatibility during transition
      const pageKey = location.pathname === '/' ? 'home' : location.pathname.substring(1);
      if (publicWebsite.pages[pageKey]) {
        blocksToRender = publicWebsite.pages[pageKey];
      }
    } else if (location.pathname === '/' && publicWebsite.blocks) {
      // Legacy single-page blocks array support
      blocksToRender = publicWebsite.blocks;
    }
  }

  // If there are custom blocks designed in the Website Designer, render them
  if (blocksToRender.length > 0) {
    const primaryColor = (publicWebsite as any)?.theme?.primaryColor || '#4f46e5';
    
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', overflowX: 'hidden', '--primary': primaryColor } as React.CSSProperties}>
        {blocksToRender.map((block: PageBlock) => (
          <RenderBlock key={block.id} block={block} />
        ))}
      </div>
    );
  }

  // Fallback for empty pages or 404
  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '3rem', color: '#111827', marginBottom: '1rem' }}>
        {location.pathname === '/' ? `Welcome to ${name}` : '404 - Page Not Found'}
      </h1>
      <p style={{ color: '#6b7280', fontSize: '1.2rem' }}>
        {location.pathname === '/' ? 'This organization has not published their website yet.' : 'The page you are looking for does not exist.'}
      </p>
    </div>
  );
};

export default TenantLandingPage;
