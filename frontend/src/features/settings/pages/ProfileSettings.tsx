import React, { useState } from 'react';
import { Lock, Save, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Palette } from 'lucide-react';
import { api } from '../../../services/api';
import { THEMES, applyTheme } from './OrgSettings';
import { useAuthStore } from '../../../store/auth.store';

const ProfileSettings: React.FC = () => {
  const { user, setUser } = useAuthStore();
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Theme state
  const [selectedThemeColor, setSelectedThemeColor] = useState('indigo');
  const [selectedThemeMode, setSelectedThemeMode] = useState('dark');
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMsg, setThemeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (user) {
      const themeKey = user.theme || user.organization?.theme || 'indigo:dark';
      const [color, mode] = themeKey.split(':');
      setSelectedThemeColor(color || 'indigo');
      setSelectedThemeMode(mode || 'dark');
    }
  }, [user]);

  const handleThemeSave = async () => {
    setThemeSaving(true);
    setThemeMsg(null);
    try {
      const fullTheme = `${selectedThemeColor}:${selectedThemeMode}`;
      await api.patch('/auth/profile', { theme: fullTheme });
      if (user) {
        setUser({ ...user, theme: fullTheme });
      }
      applyTheme(fullTheme);
      setThemeMsg({ type: 'success', text: 'Theme updated successfully!' });
    } catch (err: any) {
      setThemeMsg({ type: 'error', text: err.message || 'Failed to save theme.' });
    } finally {
      setThemeSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordSaving(false);
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
        <h1 style={{ margin: '0 0 0.5rem 0' }}>My Profile</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Manage your personal account settings.
        </p>
      </div>

      {/* ── Theme ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div style={{ padding: '0.6rem', backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: '10px' }}>
            <Palette size={20} color="var(--primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Dashboard Theme</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose your personal color palette</p>
          </div>
        </div>

        {themeMsg && <Alert msg={themeMsg} />}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {THEMES.map(t => (
            <button
              key={t.key}
              onClick={() => setSelectedThemeColor(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1rem',
                borderRadius: '10px',
                border: selectedThemeColor === t.key ? `2px solid ${t.primary}` : '2px solid transparent',
                backgroundColor: selectedThemeColor === t.key ? `${t.primary}22` : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: t.primary, flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', color: selectedThemeColor === t.key ? t.primary : 'var(--text-muted)', fontWeight: selectedThemeColor === t.key ? 600 : 400 }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Appearance Mode</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setSelectedThemeMode('light')}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '10px', cursor: 'pointer',
                border: selectedThemeMode === 'light' ? '2px solid var(--primary)' : '2px solid var(--border-light)',
                backgroundColor: selectedThemeMode === 'light' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                color: selectedThemeMode === 'light' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 500, transition: 'all 0.2s'
              }}
            >
              Light Mode
            </button>
            <button
              onClick={() => setSelectedThemeMode('dark')}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '10px', cursor: 'pointer',
                border: selectedThemeMode === 'dark' ? '2px solid var(--primary)' : '2px solid var(--border-light)',
                backgroundColor: selectedThemeMode === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                color: selectedThemeMode === 'dark' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 500, transition: 'all 0.2s'
              }}
            >
              Dark Mode
            </button>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleThemeSave} disabled={themeSaving}>
          {themeSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Palette size={16} />}
          Apply Theme
        </button>
      </div>

      {/* ── Change Password ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div style={{ padding: '0.6rem', backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: '10px' }}>
            <Lock size={20} color="var(--primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Change Password</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Update your account password</p>
          </div>
        </div>

        {passwordMsg && <Alert msg={passwordMsg} />}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '3rem' }}
                placeholder="Your current password"
                required
              />
              <button type="button" onClick={() => setShowCurrent(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '3rem' }}
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
              <button type="button" onClick={() => setShowNew(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={inputStyle}
              placeholder="Repeat new password"
              required
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
              {passwordSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
