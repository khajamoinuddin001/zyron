import { create } from 'zustand';

interface BrandingState {
  domain: string | null;
  name: string | null;
  logoUrl: string | null;
  theme: string | null;
  publicWebsite: any | null;
  isLoading: boolean;
  setBranding: (data: Partial<BrandingState>) => void;
}

export const useBrandingStore = create<BrandingState>((set) => ({
  domain: null,
  name: null,
  logoUrl: null,
  theme: null,
  publicWebsite: null,
  isLoading: true,
  setBranding: (data) => set((state) => ({ ...state, ...data })),
}));
