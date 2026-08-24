import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, MessageSquare, BookOpen, Settings, LogOut, Shield, FileText, AlertTriangle, X, Menu, Calendar, Award, Store, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../services/api';
import { applyTheme } from '../features/settings/pages/OrgSettings';

const SidebarText = ({ show, children }: { show: boolean, children: React.ReactNode }) => (
  <span style={{ 
    opacity: show ? 1 : 0, 
    maxWidth: show ? '200px' : 0,
    overflow: 'hidden', 
    whiteSpace: 'nowrap', 
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
  }}>
    {children}
  </span>
);

const SidebarLink = ({ to, icon: Icon, label, isActive, isCollapsed, onClick }: any) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`btn btn-outline ${isActive ? 'active' : ''}`} 
    style={{ 
      justifyContent: isCollapsed ? 'center' : 'flex-start', 
      border: 'none', 
      padding: isCollapsed ? '0.75rem 0' : '0.5rem 1rem',
      gap: isCollapsed ? 0 : '0.75rem',
      background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
      color: isActive ? 'var(--primary)' : 'var(--text-main)',
      width: '100%',
      transition: 'all 0.2s ease'
    }}
  >
    <Icon size={22} style={{ flexShrink: 0, color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
    <SidebarText show={!isCollapsed}>{label}</SidebarText>
  </Link>
);

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

  // Desktop Sidebar Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
      <aside 
        className={`sidebar-container ${isDrawerOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`} 
        style={{ 
          maxHeight: '100vh', 
          width: isSidebarCollapsed ? '80px' : '260px', 
          padding: isSidebarCollapsed ? '1.5rem 0.5rem' : '1.5rem',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        
        {/* Collapse Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hide-mobile"
          style={{
            position: 'absolute', top: '2rem', right: '-14px', zIndex: 10,
            width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-main)',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-card)';
            e.currentTarget.style.color = 'var(--text-main)';
            e.currentTarget.style.borderColor = 'var(--border-light)';
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        {/* Logo / Org Name */}
        <Link to="/dashboard" className="logo" style={{ marginBottom: '1.5rem', flexShrink: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}>
          {user?.organization?.logoUrl ? (
            <img src={user.organization.logoUrl} alt="org" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{(user?.organization?.name || 'O')[0].toUpperCase()}</span>
            </div>
          )}
          {!isSidebarCollapsed && (
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.organization?.name || 'My Organization'}
            </span>
          )}
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto', paddingRight: isSidebarCollapsed ? '0' : '0.5rem', paddingBottom: '1rem', overflowX: 'hidden' }}>
          <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" isActive={location.pathname === '/dashboard'} isCollapsed={isSidebarCollapsed} />

          {user?.activeModules?.includes('attendance') && (
            <SidebarLink to="/dashboard/attendance" icon={BookOpen} label="Attendance" isActive={location.pathname.startsWith('/dashboard/attendance')} isCollapsed={isSidebarCollapsed} />
          )}

          {user?.activeModules?.includes('messaging') && (
            <SidebarLink to="/dashboard/messaging" icon={MessageSquare} label="Messaging" isActive={location.pathname.startsWith('/dashboard/messaging')} isCollapsed={isSidebarCollapsed} />
          )}

          {user?.activeModules?.includes('accounts') && (
            <SidebarLink to="/dashboard/accounts" icon={FileText} label="Accounts" isActive={location.pathname.startsWith('/dashboard/accounts')} isCollapsed={isSidebarCollapsed} />
          )}

          {user?.activeModules?.includes('calendar') && (
            <SidebarLink to="/dashboard/calendar" icon={Calendar} label="Calendar" isActive={location.pathname.startsWith('/dashboard/calendar')} isCollapsed={isSidebarCollapsed} />
          )}

          {user?.activeModules?.includes('contacts') && (
            <SidebarLink to="/dashboard/contacts" icon={Users} label="Contacts" isActive={location.pathname.startsWith('/dashboard/contacts')} isCollapsed={isSidebarCollapsed} />
          )}

          <SidebarLink to="/dashboard/apps" icon={Package} label="Apps" isActive={location.pathname.startsWith('/dashboard/apps')} isCollapsed={isSidebarCollapsed} />

          <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {user?.isSuperAdmin && (
              <SidebarLink to="/admin" icon={Shield} label="Super Admin" isCollapsed={isSidebarCollapsed} />
            )}

            {user?.role === 'ORG_ADMIN' && (
              <>
                <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', padding: '0 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, opacity: isSidebarCollapsed ? 0 : 1, transition: 'opacity 0.2s', height: isSidebarCollapsed ? 0 : 'auto', overflow: 'hidden' }}>Settings</div>
                <SidebarLink to="/dashboard/team-roles" icon={Shield} label="Team & Roles" isActive={location.pathname === '/dashboard/team-roles'} isCollapsed={isSidebarCollapsed} />
                <SidebarLink to="/dashboard/settings" icon={Award} label="Org Settings" isActive={location.pathname === '/dashboard/settings'} isCollapsed={isSidebarCollapsed} />
              </>
            )}

            <div style={{ marginTop: user?.role === 'ORG_ADMIN' ? '0' : '0.5rem', marginBottom: '0.5rem', padding: '0 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, opacity: isSidebarCollapsed ? 0 : 1, transition: 'opacity 0.2s', height: isSidebarCollapsed ? 0 : 'auto', overflow: 'hidden' }}>Account</div>
            <SidebarLink to="/dashboard/profile" icon={Settings} label="My Profile" isActive={location.pathname === '/dashboard/profile'} isCollapsed={isSidebarCollapsed} />
          </div>
        </nav>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)', marginTop: '0', flexShrink: 0, overflow: 'hidden', height: isSidebarCollapsed ? '60px' : 'auto' }}>
          <div style={{ marginBottom: '1rem', opacity: isSidebarCollapsed ? 0 : 1, transition: 'opacity 0.2s ease', display: isSidebarCollapsed ? 'none' : 'block' }}>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Logged in as</p>
            <p style={{ color: 'var(--text-main)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.firstName} {user?.lastName}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', border: 'none', color: 'var(--text-muted)', padding: isSidebarCollapsed ? '0.75rem 0' : '0.5rem 1rem', gap: isSidebarCollapsed ? 0 : '0.75rem' }}>
            <LogOut size={22} style={{ flexShrink: 0 }} /> <SidebarText show={!isSidebarCollapsed}>Log Out</SidebarText>
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
