import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Activity, LogOut, ShieldAlert, Menu } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

const SuperAdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  
  // Mobile Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Close drawer on route change
  React.useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      {/* Mobile Top Bar */}
      <div className="show-mobile-flex" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '60px', backgroundColor: 'var(--bg-darker)', borderBottom: '1px solid var(--border-light)', alignItems: 'center', padding: '0 1rem', zIndex: 30, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setIsDrawerOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }}>
            <Menu size={24} />
          </button>
          <span style={{ fontWeight: 600 }}>Zyron Admin</span>
        </div>
      </div>

      {/* Drawer Overlay */}
      <div 
        className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`} 
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar-container ${isDrawerOpen ? 'open' : ''}`}>
        <div className="logo" style={{ marginBottom: '2rem', color: 'var(--primary)' }}>
          <ShieldAlert size={28} />
          Zyron Admin
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link to="/admin" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
            <LayoutDashboard size={20} /> Overview
          </Link>
          <Link to="/admin/organizations" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>
            <Users size={20} /> Organizations
          </Link>
          <Link to="/admin" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>
            <Activity size={20} /> Audit Logs
          </Link>
          <Link to="/admin/subscriptions" className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>
            <CreditCard size={20} /> Subscriptions
          </Link>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>Logged in as</p>
          <p style={{ color: 'white', fontWeight: 500 }}>{user?.firstName} {user?.lastName}</p>
        </div>

        <button onClick={handleLogout} className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', color: 'var(--secondary)' }}>
          <LogOut size={20} /> Log Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
