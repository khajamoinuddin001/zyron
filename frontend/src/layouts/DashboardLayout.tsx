import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, MessageSquare, BookOpen, Settings, LogOut, Shield, FileText, AlertTriangle, X, Menu, Calendar, Award } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../services/api';
import { applyTheme } from '../features/settings/pages/OrgSettings';

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  // Billing health: tracks modules in GRACE or SUSPENDED
  const [billingAlerts, setBillingAlerts] = useState<{ name: string; status: string; graceEndsAt: string | null }[]>([]);
  const [dismissedAlert, setDismissedAlert] = useState(false);

  // Mobile Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Apply saved org theme on mount
  useEffect(() => {
    applyTheme(user?.theme || user?.organization?.theme);
  }, [user?.theme, user?.organization?.theme]);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Silent background refresh every 30 seconds — picks up role/module/profile changes instantly
  useEffect(() => {
    const refresh = async () => {
      try {
        const data = await api.get<any>('/auth/me');
        if (data && user) {
          setUser({
            ...user,
            activeModules: data.activeModules || [],
            theme: data.theme || user.theme,
            organization: data.organization || user.organization
          });
        }
      } catch {
        // If 403, the org was suspended — log out
        logout();
        navigate('/login');
      }
    };

    refresh(); // initial fetch on mount (catches name changes after hard refresh)
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check billing health on mount and after module changes
  useEffect(() => {
    if (!user?.activeModules?.length) return;
    api.get<{ modules: any[] }>('/organizations/modules')
      .then(r => {
        const alerts = (r.modules || []).filter(m => m.billingStatus === 'GRACE' || m.billingStatus === 'SUSPENDED');
        setBillingAlerts(alerts.map(m => ({ name: m.module.name, status: m.billingStatus, graceEndsAt: m.graceEndsAt })));
        setDismissedAlert(false);
      })
      .catch(() => { });
  }, [user?.activeModules?.length]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-dark)' }}>
      {/* Mobile Top Bar */}
      <div className="show-mobile-flex" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '60px', backgroundColor: 'var(--bg-darker)', borderBottom: '1px solid var(--border-light)', alignItems: 'center', padding: '0 1rem', zIndex: 30, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setIsDrawerOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }}>
            <Menu size={24} />
          </button>
          <Link to="/dashboard" style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>
            {user?.organization?.name || 'Edminz'}
          </Link>
        </div>
      </div>

      {/* Drawer Overlay */}
      <div
        className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar-container ${isDrawerOpen ? 'open' : ''}`} style={{ maxHeight: '100vh' }}>
        {/* Logo / Org Name */}
        <Link to="/dashboard" className="logo" style={{ marginBottom: '1.5rem', flexShrink: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          {user?.organization?.logoUrl ? (
            <img src={user.organization.logoUrl} alt="org" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{(user?.organization?.name || 'O')[0].toUpperCase()}</span>
            </div>
          )}
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.organization?.name || 'My Organization'}
          </span>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '1rem' }}>
          <Link to="/dashboard" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>

          {user?.activeModules?.includes('attendance') && (
            <Link to="/dashboard/attendance" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>
              <BookOpen size={20} /> Attendance
            </Link>
          )}

          {user?.activeModules?.includes('messaging') && (
            <Link to="/dashboard/messaging" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>
              <MessageSquare size={20} /> Messaging
            </Link>
          )}

          {user?.activeModules?.includes('accounts') && (
            <Link to="/dashboard" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>
              <FileText size={20} /> Accounts
            </Link>
          )}

          {user?.activeModules?.includes('calendar') && (
            <Link to="/dashboard/calendar" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>
              <Calendar size={20} /> Calendar
            </Link>
          )}


          <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {user?.isSuperAdmin && (
              <Link to="/admin" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>Switch to Super Admin</Link>
            )}

            {user?.role === 'ORG_ADMIN' && (
              <>
                <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', padding: '0 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Settings</div>
                <Link
                  to="/dashboard/team-roles"
                  className={`btn btn-outline ${location.pathname === '/dashboard/team-roles' ? 'active' : ''}`}
                  style={{ justifyContent: 'flex-start', border: 'none', color: location.pathname === '/dashboard/team-roles' ? 'var(--primary)' : 'inherit' }}
                >
                  <Shield size={20} /> Team & Roles
                </Link>
                <Link
                  to="/dashboard/app-store"
                  className={`btn btn-outline ${location.pathname === '/dashboard/app-store' ? 'active' : ''}`}
                  style={{ justifyContent: 'flex-start', border: 'none', color: location.pathname === '/dashboard/app-store' ? 'var(--primary)' : 'inherit' }}
                >
                  <Settings size={20} /> App Store
                </Link>
                <Link
                  to="/dashboard/settings"
                  className={`btn btn-outline ${location.pathname === '/dashboard/settings' ? 'active' : ''}`}
                  style={{ justifyContent: 'flex-start', border: 'none', color: location.pathname === '/dashboard/settings' ? 'var(--primary)' : 'inherit' }}
                >
                  <Award size={26} /> Organization Settings
                </Link>
              </>
            )}

            <div style={{ marginTop: user?.role === 'ORG_ADMIN' ? '0' : '0.5rem', marginBottom: '0.5rem', padding: '0 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Account</div>
            <Link
              to="/dashboard/profile"
              className={`btn btn-outline ${location.pathname === '/dashboard/profile' ? 'active' : ''}`}
              style={{ justifyContent: 'flex-start', border: 'none', color: location.pathname === '/dashboard/profile' ? 'var(--primary)' : 'inherit' }}
            >
              <Settings size={20} /> My Profile
            </Link>
          </div>
        </nav>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)', marginTop: '0', flexShrink: 0 }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Logged in as</p>
            <p style={{ color: 'var(--text-main)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.firstName} {user?.lastName}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', color: 'var(--text-muted)' }}>
            <LogOut size={20} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Billing warning banner */}
        {billingAlerts.length > 0 && !dismissedAlert && (
          <div style={{ backgroundColor: billingAlerts.some(a => a.status === 'SUSPENDED') ? 'rgba(239,68,68,0.12)' : 'rgba(250,204,21,0.1)', borderBottom: `1px solid ${billingAlerts.some(a => a.status === 'SUSPENDED') ? 'rgba(239,68,68,0.3)' : 'rgba(250,204,21,0.25)'}`, padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={18} color={billingAlerts.some(a => a.status === 'SUSPENDED') ? '#f87171' : '#facc15'} />
              <span style={{ fontSize: '0.9rem', color: billingAlerts.some(a => a.status === 'SUSPENDED') ? '#f87171' : '#facc15' }}>
                {billingAlerts.some(a => a.status === 'SUSPENDED')
                  ? `⚠️ ${billingAlerts.filter(a => a.status === 'SUSPENDED').map(a => a.name).join(', ')} suspended due to non-payment.`
                  : `⏳ Payment overdue for: ${billingAlerts.map(a => {
                    const d = a.graceEndsAt ? Math.ceil((new Date(a.graceEndsAt).getTime() - Date.now()) / 86_400_000) : 0;
                    return `${a.name} (${d}d grace left)`;
                  }).join(', ')}`
                }
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/dashboard/app-store" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', textDecoration: 'underline' }}>Update Payment →</Link>
              <button onClick={() => setDismissedAlert(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={16} /></button>
            </div>
          </div>
        )}
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', flex: 1, padding: 'max(1rem, var(--spacing-lg))' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
