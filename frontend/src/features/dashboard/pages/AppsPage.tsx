import React from 'react';
import { Link } from 'react-router-dom';
import { Store, BookOpen, MessageSquare, Calendar, Users, FileText } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';

const AppsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const activeModules = user?.activeModules || [];

  const boxStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    textAlign: 'center',
    textDecoration: 'none',
    color: 'inherit',
    height: '220px',
    borderRadius: '16px',
    border: '1px solid var(--border-light)'
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
      <h1 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem' }}>Apps</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {activeModules.includes('attendance') && (
          <Link to="/dashboard/attendance" className="glass-panel hover-scale" style={boxStyle}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)', marginBottom: '1rem' }}>
              <BookOpen size={36} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Attendance</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Track student attendance</p>
          </Link>
        )}

        {activeModules.includes('messaging') && (
          <Link to="/dashboard/messaging" className="glass-panel hover-scale" style={boxStyle}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)', marginBottom: '1rem' }}>
              <MessageSquare size={36} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Messaging</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Communicate with students</p>
          </Link>
        )}

        {activeModules.includes('calendar') && (
          <Link to="/dashboard/calendar" className="glass-panel hover-scale" style={boxStyle}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)', marginBottom: '1rem' }}>
              <Calendar size={36} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Calendar</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Schedule events</p>
          </Link>
        )}

        {activeModules.includes('contacts') && (
          <Link to="/dashboard/contacts" className="glass-panel hover-scale" style={boxStyle}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)', marginBottom: '1rem' }}>
              <Users size={36} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Contacts</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage user directory</p>
          </Link>
        )}
        
        {activeModules.includes('accounts') && (
          <Link to="/dashboard" className="glass-panel hover-scale" style={boxStyle}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)', marginBottom: '1rem' }}>
              <FileText size={36} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Accounts</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Billing & invoices</p>
          </Link>
        )}

        {/* App Store Shortcut */}
        <Link to="/dashboard/app-store" className="glass-panel hover-scale" style={boxStyle}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Store size={36} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>App Store</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Discover & Install Apps</p>
        </Link>
      </div>
    </div>
  );
};

export default AppsPage;
