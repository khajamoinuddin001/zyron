import React, { useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../services/api';
import {
  Users, MessageSquare, CreditCard, Calendar, BookOpen, Truck,
  Package, Home, Download, Trash2, CalendarDays, Contact, Globe
} from 'lucide-react';

// ─── Module catalogue ────────────────────────────────────────────────────────
const ALL_MODULES = [
  { key: 'attendance',   name: 'Attendance',     desc: 'Real-time biometric & manual tracking.',          icon: <Users        size={24} /> },
  { key: 'messaging',   name: 'Messaging',       desc: 'Send WhatsApp, SMS and email broadcasts.',        icon: <MessageSquare size={24} /> },
  { key: 'calendar',    name: 'Calendar',        desc: 'Manage events, holidays, and schedules.',         icon: <CalendarDays size={24} /> },
  { key: 'contacts',    name: 'Contacts',        desc: 'Manage staff, student, and parent contact information.', icon: <Contact    size={24} /> },
  { key: 'accounts',    name: 'Accounts & Fees', desc: 'Automated fee collection & payroll.',             icon: <CreditCard    size={24} /> },
  { key: 'examinations',name: 'Examinations',    desc: 'Report cards, tickets & schedules.',              icon: <Calendar      size={24} /> },
  { key: 'library',     name: 'Library',         desc: 'Complete library management.',                    icon: <BookOpen      size={24} /> },
  { key: 'transport',   name: 'Transport',       desc: 'GPS tracking and fleet route management.',        icon: <Truck        size={24} /> },
  { key: 'inventory',   name: 'Inventory',       desc: 'Track assets, supplies, and orders.',             icon: <Package      size={24} /> },
  { key: 'hostel',      name: 'Hostel',          desc: 'Manage room allocations and visitors.',           icon: <Home         size={24} /> },
  { key: 'website',     name: 'Website Builder', desc: 'Design and customize your public-facing landing page.', icon: <Globe size={24} /> },
];

const SUPPORTED = new Set(['attendance', 'messaging', 'calendar', 'contacts', 'website']);

const AppStore: React.FC = () => {
  const user           = useAuthStore(s => s.user);
  const installModule  = useAuthStore(s => s.installModule);
  const uninstallModule= useAuthStore(s => s.uninstallModule);

  const activeModules           = user?.activeModules || [];
  const [loadingAction, setLA]  = useState<string | null>(null);

  const handleInstall = async (key: string) => {
    setLA(key);
    try {
      await api.post('/organizations/modules', { moduleKey: key, action: 'install' });
      installModule(key);
    } catch (err: any) { alert(err.message || 'Failed to install module'); }
    finally { setLA(null); }
  };

  const handleUninstall = async (key: string) => {
    if (!window.confirm('Uninstall this module? Your data will be retained.')) return;
    setLA(key);
    try {
      await api.post('/organizations/modules', { moduleKey: key, action: 'uninstall' });
      uninstallModule(key);
    } catch (err: any) { alert(err.message || 'Failed to uninstall'); }
    finally { setLA(null); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ margin:0 }}>App Store</h1>
          <p style={{ color:'var(--text-muted)', marginTop:'0.5rem' }}>Install modules to expand your organization's capabilities.</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.5rem' }}>
        {ALL_MODULES.map(mod => {
          const isSupported = SUPPORTED.has(mod.key);
          const isInstalled = isSupported && activeModules.includes(mod.key);

          return (
            <div key={mod.key} className="glass-panel" style={{ padding:'1.5rem', display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', background: isInstalled ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', color: isInstalled ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {mod.icon}
                </div>
                {isInstalled ? (
                  <span style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.8rem', color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)', padding:'0.25rem 0.75rem', borderRadius:'99px', fontWeight: 500 }}>
                    ✓ Installed
                  </span>
                ) : !isSupported ? (
                  <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', backgroundColor:'rgba(255,255,255,0.05)', padding:'0.25rem 0.75rem', borderRadius:'99px' }}>Coming Soon</span>
                ) : null}
              </div>

              <h3 style={{ margin:'0 0 0.5rem 0', fontSize:'1.2rem' }}>{mod.name}</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'1rem', flex:1 }}>{mod.desc}</p>

              <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', borderTop:'1px solid var(--border-light)', paddingTop:'1rem', gap:'0.5rem' }}>
                {!isSupported ? (
                  <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', padding:'0.4rem 0.8rem', backgroundColor:'rgba(255,255,255,0.05)', borderRadius:'99px' }}>Coming Soon</span>
                ) : isInstalled ? (
                  <button onClick={() => handleUninstall(mod.key)} disabled={loadingAction === mod.key} className="btn btn-outline" style={{ padding:'0.5rem 0.85rem', fontSize:'0.82rem', color:'#f87171', borderColor:'rgba(248,113,113,0.3)', opacity: loadingAction === mod.key ? 0.5 : 1 }}>
                    <Trash2 size={14}/> {loadingAction === mod.key ? '…' : 'Uninstall'}
                  </button>
                ) : (
                  <button onClick={() => handleInstall(mod.key)} disabled={loadingAction === mod.key} className="btn btn-primary" style={{ padding:'0.5rem 1rem', fontSize:'0.85rem', opacity: loadingAction === mod.key ? 0.5 : 1 }}>
                    <Download size={16}/> {loadingAction === mod.key ? 'Installing...' : 'Install'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppStore;
