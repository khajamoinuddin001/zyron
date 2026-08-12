import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'STAFF' | 'CLIENT';

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  status: string;
  logoUrl?: string | null;
  theme?: string | null;
  workingDays?: string;
  terminology?: any;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  organization: Organization | null;
  role: Role | null;
  activeModules?: string[];
  theme?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  installModule: (key: string) => void;
  uninstallModule: (key: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setUser: (user) => set({ user }),
      installModule: (key) => set((state) => ({
        user: state.user ? { ...state.user, activeModules: [...(state.user.activeModules || []), key] } : null,
      })),
      uninstallModule: (key) => set((state) => ({
        user: state.user ? { ...state.user, activeModules: (state.user.activeModules || []).filter(k => k !== key) } : null,
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
