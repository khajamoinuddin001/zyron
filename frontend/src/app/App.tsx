import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useBrandingStore } from '../store/branding.store';
import { THEMES } from '../features/settings/pages/OrgSettings';
import { api } from '../services/api';

const App: React.FC = () => {
  const setBranding = useBrandingStore((state) => state.setBranding);

  useEffect(() => {
    const fetchBranding = async () => {
      const hostname = window.location.hostname;
      // Basic subdomain check: if it's not localhost, 127.0.0.1, or www/root domain
      // For local testing: oxford.localhost
      const parts = hostname.split('.');
      let subdomain = null;
      
      if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost') {
        subdomain = parts[0];
      } else if (parts.length > 2 && parts[0] !== 'www') {
        subdomain = parts[0];
      }

      if (subdomain) {
        try {
          const data = await api.get<{ name: string, domain: string, logoUrl: string, theme: string, publicWebsite: any }>(`/platform/branding?domain=${subdomain}`);
          if (data && data.name) {
            setBranding({ 
              domain: subdomain, 
              name: data.name, 
              logoUrl: data.logoUrl, 
              theme: data.theme,
              publicWebsite: data.publicWebsite,
              isLoading: false 
            });

            // Inject theme
            if (data.theme) {
              const [color, mode] = data.theme.split(':');
              const themeData = THEMES.find(t => t.key === color);
              if (themeData) {
                document.documentElement.style.setProperty('--primary', themeData.primary);
                document.documentElement.style.setProperty('--secondary', themeData.secondary);
                // Can also inject these specific vars for login pages if needed
                document.documentElement.style.setProperty('--brand-primary', themeData.primary);
                document.documentElement.style.setProperty('--brand-bg', `${themeData.primary}15`); // 15% opacity
              }
              if (mode === 'dark') {
                document.documentElement.classList.add('theme-dark');
              }
            }
            return;
          }
        } catch (err) {
          console.error("Failed to fetch branding:", err);
        }
      }
      
      setBranding({ isLoading: false });
    };

    fetchBranding();
  }, [setBranding]);

  return <RouterProvider router={router} />;
};

export default App;
