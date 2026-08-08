import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Camera, Palette, Lock, Save, Loader2,
  AlertCircle, CheckCircle, Eye, EyeOff, ChevronRight
} from 'lucide-react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/auth.store';

export const THEMES = [
  { key: 'indigo',  label: 'Indigo',   primary: '#6366f1', secondary: '#818cf8' },
  { key: 'violet',  label: 'Violet',   primary: '#7c3aed', secondary: '#a78bfa' },
  { key: 'teal',    label: 'Teal',     primary: '#0d9488', secondary: '#2dd4bf' },
  { key: 'emerald', label: 'Emerald',  primary: '#059669', secondary: '#34d399' },
  { key: 'rose',    label: 'Rose',     primary: '#e11d48', secondary: '#fb7185' },
  { key: 'amber',   label: 'Amber',    primary: '#d97706', secondary: '#fbbf24' },
  { key: 'sky',     label: 'Sky',      primary: '#0284c7', secondary: '#38bdf8' },
  { key: 'slate',   label: 'Slate',    primary: '#475569', secondary: '#94a3b8' },
];

export function applyTheme(themeKey: string | null | undefined) {
  const [color, mode] = (themeKey || 'indigo:dark').split(':');
  const theme = THEMES.find(t => t.key === color) || THEMES[0];
  document.documentElement.style.setProperty('--primary', theme.primary);
  document.documentElement.style.setProperty('--secondary', theme.secondary);
  
  if (mode === 'light') {
    document.documentElement.classList.add('theme-light');
  } else {
    document.documentElement.classList.remove('theme-light');
  }
}

const OrgSettings: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [orgName, setOrgName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedThemeColor, setSelectedThemeColor] = useState('indigo');
  const [selectedThemeMode, setSelectedThemeMode] = useState('dark');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.organization) {
      setOrgName(user.organization.name || '');
      setLogoPreview(user.organization.logoUrl || null);
      
      const themeKey = user.organization.theme || 'indigo:dark';
      const [color, mode] = themeKey.split(':');
      setSelectedThemeColor(color || 'indigo');
      setSelectedThemeMode(mode || 'dark');
    }
  }, [user]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Logo must be under 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const fullTheme = `${selectedThemeColor}:${selectedThemeMode}`;
      const result = await api.patch<{ organization: any }>('/organizations/profile', {
        name: orgName.trim(),
        logoUrl: logoPreview,
        theme: fullTheme,
      });
      // Update in store
      if (user) {
        setUser({ ...user, organization: result.organization });
      }
      applyTheme(fullTheme);
      setProfileMsg({ type: 'success', text: 'Organization profile updated!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to save.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-main)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-light)',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '1.5rem',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--border-light)',
  };

  const Alert = ({ msg }: { msg: { type: 'success' | 'error'; text: string } }) => (
    <div style={{
      backgroundColor: msg.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
      borderLeft: `4px solid ${msg.type === 'success' ? '#4ade80' : '#ef4444'}`,
      color: msg.type === 'success' ? '#4ade80' : '#f87171',
      padding: '0.85rem 1rem',
      borderRadius: '6px',
      marginBottom: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.9rem',
    }}>
      {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg.text}
    </div>
  );

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>Organization Settings</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Manage your organization's profile, appearance, and security settings.
        </p>
      </div>

      {/* ── Organization Profile ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div style={{ padding: '0.6rem', backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: '10px' }}>
            <Building2 size={20} color="var(--primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Organization Profile</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Name and logo shown across the dashboard</p>
          </div>
        </div>

        {profileMsg && <Alert msg={profileMsg} />}

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          {/* Logo Upload */}
          <div style={{ flexShrink: 0 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '90px', height: '90px', borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '2px dashed var(--border-light)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.2s',
                position: 'relative',
              }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Camera size={22} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Upload</span>
                </>
              )}
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <Camera size={20} color="white" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.4rem' }}>Max 2MB</p>
          </div>

          {/* Name */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              style={inputStyle}
              placeholder="e.g., Skyward Logistics"
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleProfileSave} disabled={profileSaving || !orgName.trim()}>
          {profileSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
          Save Profile
        </button>
      </div>



    </div>
  );
};

export default OrgSettings;
