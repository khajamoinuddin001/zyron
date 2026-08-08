import React, { useState, useEffect } from 'react';
import { Package, Users, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface OrganizationModule {
  organizationId: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

interface PlatformModule {
  id: string;
  key: string;
  name: string;
  description: string;
  monthlyPrice: number;
  organizations: OrganizationModule[];
}

const Subscriptions: React.FC = () => {
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const data = await api.get<{ modules: PlatformModule[] }>('/platform/modules');
        setModules(data.modules);
      } catch (err: any) {
        setError(err.message || 'Failed to load modules');
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

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

  const activeSubscriptionsCount = modules.reduce((total, mod) => {
    return total + mod.organizations.filter(o => o.status === 'ACTIVE').length;
  }, 0);

  const totalMrr = modules.reduce((total, mod) => {
    const activeCount = mod.organizations.filter(o => o.status === 'ACTIVE').length;
    return total + (activeCount * mod.monthlyPrice);
  }, 0);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Platform Subscriptions</h1>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Package size={40} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: '2rem', margin: 0 }}>{modules.length}</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Total Modules</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={40} color="var(--secondary)" />
          <div>
            <h3 style={{ fontSize: '2rem', margin: 0 }}>{activeSubscriptionsCount}</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Active Subscriptions</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <DollarSign size={40} color="#4ade80" />
          <div>
            <h3 style={{ fontSize: '2rem', margin: 0 }}>${totalMrr.toLocaleString()}</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Total MRR</p>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <h2>Available Modules</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        {modules.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No modules found.
          </div>
        ) : modules.map((mod) => {
          const activeCount = mod.organizations.filter(o => o.status === 'ACTIVE').length;
          const mrr = activeCount * mod.monthlyPrice;

          return (
            <div key={mod.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{mod.name}</h3>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                    ${mod.monthlyPrice}/mo
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>{mod.description}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>Active Orgs</p>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>{activeCount}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>Generated MRR</p>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', color: '#4ade80' }}>${mrr.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Subscriptions;
