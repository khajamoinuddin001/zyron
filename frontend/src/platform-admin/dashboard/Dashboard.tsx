import React, { useState, useEffect } from 'react';
import { Building, Users, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface Organization {
  id: string;
  name: string;
  domain: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  members: { role: string; user: { email: string } }[];
}

const SuperAdminDashboard: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ organizations: Organization[] }>('/organizations');
      setOrgs(data.organizations);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      // Optimistic update
      setOrgs(orgs.map(org => {
        if (org.id === id) {
          return { ...org, status: newStatus as any };
        }
        return org;
      }));
      
      await api.patch(`/organizations/${id}`, { status: newStatus });
    } catch (err) {
      // Revert on error
      console.error('Failed to update status', err);
      fetchOrganizations();
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={40} className="spin" color="var(--primary)" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#f87171', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /> {error}</p>
      </div>
    );
  }

  const activeOrgs = orgs.filter(o => o.status === 'ACTIVE').length;
  const suspendedOrgs = orgs.filter(o => o.status === 'SUSPENDED').length;
  const totalUsers = orgs.reduce((acc, org) => acc + (org.members?.length || 0), 0);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Platform Overview</h1>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Building size={40} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: '2rem', margin: 0 }}>{activeOrgs}</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Active Organizations</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={40} color="var(--secondary)" />
          <div>
            <h3 style={{ fontSize: '2rem', margin: 0 }}>{totalUsers}</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Total Users</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle size={40} color="#ef4444" />
          <div>
            <h3 style={{ fontSize: '2rem', margin: 0 }}>{suspendedOrgs}</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Suspended Accounts</p>
          </div>
        </div>
      </div>

      {/* Organizations List */}
      <h2>Recent Organizations</h2>
      <div className="glass-panel" style={{ marginTop: '1rem', overflow: 'hidden', padding: 0 }}>
        <div className="hide-mobile">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '1rem' }}>Organization Name</th>
              <th style={{ padding: '1rem' }}>Admin Email</th>
              <th style={{ padding: '1rem' }}>Domain</th>
              <th style={{ padding: '1rem' }}>Users</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No organizations found.</td>
              </tr>
            ) : orgs.map((org) => (
              <tr key={org.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{org.name}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{org.members?.find(m => m.role === 'ORG_ADMIN')?.user?.email || '-'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{org.domain || '-'}</td>
                <td style={{ padding: '1rem' }}>{org.members?.length || 0}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '99px', 
                    fontSize: '0.85rem',
                    backgroundColor: org.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' : (org.status === 'PENDING' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                    color: org.status === 'ACTIVE' ? '#4ade80' : (org.status === 'PENDING' ? '#eab308' : '#f87171')
                  }}>
                    {org.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button 
                    onClick={() => toggleStatus(org.id, org.status)}
                    className="btn btn-outline" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderColor: org.status === 'ACTIVE' ? '#ef4444' : '#4ade80', color: org.status === 'ACTIVE' ? '#f87171' : '#4ade80' }}
                  >
                    {org.status === 'ACTIVE' ? <XCircle size={16} /> : <CheckCircle size={16} />} 
                    {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Mobile Cards View */}
        <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
          {orgs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No organizations found.</div>
          ) : orgs.map((org) => (
            <div key={org.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{org.name}</div>
                <span style={{ 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '99px', 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: org.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' : (org.status === 'PENDING' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                  color: org.status === 'ACTIVE' ? '#4ade80' : (org.status === 'PENDING' ? '#eab308' : '#f87171')
                }}>
                  {org.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--text-muted)' }}><strong>Admin:</strong> {org.members?.find(m => m.role === 'ORG_ADMIN')?.user?.email || '-'}</div>
                <div style={{ color: 'var(--text-muted)' }}><strong>Domain:</strong> {org.domain || '-'}</div>
                <div style={{ color: 'var(--text-muted)' }}><strong>Users:</strong> {org.members?.length || 0}</div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => toggleStatus(org.id, org.status)}
                  className="btn btn-outline" 
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', borderColor: org.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(74, 222, 128, 0.3)', color: org.status === 'ACTIVE' ? '#f87171' : '#4ade80' }}
                >
                  {org.status === 'ACTIVE' ? <XCircle size={16} /> : <CheckCircle size={16} />} 
                  {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
