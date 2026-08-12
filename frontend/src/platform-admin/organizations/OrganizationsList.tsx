import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, CheckCircle, XCircle, Clock, Search,
  RefreshCw, Package, Users, Eye, TrendingUp,
  ShieldCheck, ShieldOff, Globe, ToggleLeft, ToggleRight,
  Loader2, Edit2, Save, X, Trash2
} from 'lucide-react';
import { api } from '../../services/api';

// All available modules (must match AppStore catalogue)
const ALL_MODULE_KEYS = [
  { key: 'attendance', name: 'Attendance', price: 15 },
  { key: 'messaging', name: 'Messaging', price: 10 },
  { key: 'accounts', name: 'Accounts & Fees', price: 25 },
  { key: 'examinations', name: 'Examinations', price: 20 },
  { key: 'library', name: 'Library', price: 15 },
  { key: 'transport', name: 'Transport', price: 30 },
  { key: 'inventory', name: 'Inventory', price: 20 },
  { key: 'hostel', name: 'Hostel', price: 20 },
];

interface OrgModule {
  id: string;
  status: string;
  billingStatus: string;
  module: { key: string; name: string; monthlyPrice: number };
}

interface Organization {
  id: string;
  name: string;
  domain: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
  _count: { members: number; modules: number };
  modules: OrgModule[];
}

const statusConfig = {
  ACTIVE: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', icon: <CheckCircle size={12} />, label: 'Active' },
  SUSPENDED: { color: '#f87171', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={12} />, label: 'Suspended' },
  PENDING: { color: '#facc15', bg: 'rgba(250,204,21,0.1)', icon: <Clock size={12} />, label: 'Pending' },
};

const OrganizationsList: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setAL] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setSF] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PENDING'>('ALL');
  const [detailOrg, setDetailOrg] = useState<Organization | null>(null);

  // Domain editing
  const [editingDomain, setEditingDomain] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);

  // Module action loading: "key-orgId"
  const [moduleLoading, setML] = useState<string | null>(null);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ organizations: Organization[] }>('/platform/organizations');
      setOrgs(res.organizations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  useEffect(() => {
    let result = orgs;
    if (statusFilter !== 'ALL') result = result.filter(o => o.status === statusFilter);
    if (search.trim()) result = result.filter(o =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.domain?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredOrgs(result);
  }, [orgs, search, statusFilter]);

  const handleStatusChange = async (org: Organization, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    const label = newStatus === 'SUSPENDED' ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${label} "${org.name}"?`)) return;
    setAL(org.id);
    try {
      await api.patch('/platform/organizations', { organizationId: org.id, status: newStatus });
      const updated = { ...org, status: newStatus };
      setOrgs(prev => prev.map(o => o.id === org.id ? updated : o));
      if (detailOrg?.id === org.id) setDetailOrg(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setAL(null);
    }
  };

  const handleDeleteOrg = async (org: Organization) => {
    if (!window.confirm(`WARNING: Are you absolutely sure you want to DELETE "${org.name}"?\n\nThis will permanently delete ALL data associated with this organization. This action cannot be undone.`)) return;
    setAL(org.id);
    try {
      await api.delete(`/platform/organizations?organizationId=${org.id}`);
      setOrgs(prev => prev.filter(o => o.id !== org.id));
      if (detailOrg?.id === org.id) setDetailOrg(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete organization');
    } finally {
      setAL(null);
    }
  };

  const handleSaveDomain = async () => {
    if (!detailOrg) return;
    setSavingDomain(true);
    try {
      await api.patch('/platform/organizations', { organizationId: detailOrg.id, domain: domainInput.trim() || null });
      const updated = { ...detailOrg, domain: domainInput.trim() || null };
      setDetailOrg(updated);
      setOrgs(prev => prev.map(o => o.id === detailOrg.id ? updated : o));
      setEditingDomain(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update domain');
    } finally {
      setSavingDomain(false);
    }
  };

  const handleModuleToggle = async (orgId: string, moduleKey: string, isCurrentlyActive: boolean) => {
    const action = isCurrentlyActive ? 'revoke' : 'grant';
    const label = isCurrentlyActive ? 'revoke access to' : 'grant access to';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} the "${moduleKey}" module for this org?`)) return;
    const loadKey = `${orgId}-${moduleKey}`;
    setML(loadKey);
    try {
      await api.post('/platform/organizations', { organizationId: orgId, moduleKey, action });
      // Update local state
      setOrgs(prev => prev.map(org => {
        if (org.id !== orgId) return org;
        let newModules: OrgModule[];
        if (action === 'grant') {
          const modDef = ALL_MODULE_KEYS.find(m => m.key === moduleKey)!;
          const existing = org.modules.find(m => m.module.key === moduleKey);
          if (existing) {
            newModules = org.modules.map(m => m.module.key === moduleKey ? { ...m, status: 'ACTIVE', billingStatus: 'ACTIVE' } : m);
          } else {
            newModules = [...org.modules, { id: `${orgId}-${moduleKey}`, status: 'ACTIVE', billingStatus: 'ACTIVE', module: { key: modDef.key, name: modDef.name, monthlyPrice: modDef.price } }];
          }
        } else {
          newModules = org.modules.map(m => m.module.key === moduleKey ? { ...m, status: 'SUSPENDED' } : m);
        }
        const updated = { ...org, modules: newModules, _count: { ...org._count, modules: newModules.filter(m => m.status === 'ACTIVE').length } };
        if (detailOrg?.id === orgId) setDetailOrg(updated);
        return updated;
      }));
    } catch (err: any) {
      alert(err.message || `Failed to ${action} module`);
    } finally {
      setML(null);
    }
  };

  // Revenue stats
  const totalRevenue = orgs.reduce((sum, o) => sum + o.modules.filter(m => m.status === 'ACTIVE').reduce((ms, m) => ms + m.module.monthlyPrice, 0), 0);
  const activeCount = orgs.filter(o => o.status === 'ACTIVE').length;
  const pendingCount = orgs.filter(o => o.status === 'PENDING').length;

  const cardStyle: React.CSSProperties = { padding: '1.5rem', flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' };
  const inp: React.CSSProperties = { padding: '0.6rem 0.9rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', flex: 1 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Organizations</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
            Manage organizations, domains, and application access.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchOrgs}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={cardStyle}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: '12px' }}><Building2 size={22} color="var(--primary)" /></div>
          <div><h3 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem 0' }}>{orgs.length}</h3><p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Total Orgs</p></div>
        </div>
        <div className="glass-panel" style={cardStyle}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: '12px' }}><CheckCircle size={22} color="#4ade80" /></div>
          <div><h3 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem 0' }}>{activeCount}</h3><p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Active</p></div>
        </div>
        <div className="glass-panel" style={cardStyle}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(250,204,21,0.1)', borderRadius: '12px' }}><Clock size={22} color="#facc15" /></div>
          <div><h3 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem 0' }}>{pendingCount}</h3><p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Pending</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-col-mobile" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search by name or domain..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, padding: '0.75rem 1rem 0.75rem 2.75rem', width: '100%', boxSizing: 'border-box', borderRadius: '10px', fontSize: '0.95rem', flex: 'unset' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map(s => (
            <button key={s} onClick={() => setSF(s)} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              {s === 'ALL' ? 'All' : statusConfig[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', display: 'block', margin: '0 auto 1rem' }} />
            Loading organizations...
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No organizations match your search.</div>
        ) : (
          <>
            <div className="hide-mobile">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    {['Organization', 'Domain', 'Status', 'Members', 'Modules', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrgs.map(org => {
                    const cfg = statusConfig[org.status];
                    const revenue = org.modules.filter(m => m.status === 'ACTIVE').reduce((s, m) => s + m.module.monthlyPrice, 0);
                    return (
                      <tr key={org.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600 }}>{org.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: org.domain ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {org.domain ? <><Globe size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />{org.domain}</> : '—'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.75rem', borderRadius: '99px', backgroundColor: cfg.bg, color: cfg.color, fontSize: '0.8rem', fontWeight: 500 }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}><Users size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />{org._count.members}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}><Package size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />{org._count.modules}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(org.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => { setDetailOrg(org); setDomainInput(org.domain || ''); setEditingDomain(false); }}>
                              <Eye size={14} /> Manage
                            </button>
                            {org.status === 'SUSPENDED' ? (
                              <button className="btn btn-outline" disabled={actionLoading === org.id} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }} onClick={() => handleStatusChange(org, 'ACTIVE')}>
                                {actionLoading === org.id ? '…' : 'Activate'}
                              </button>
                            ) : org.status === 'PENDING' ? (
                              <button className="btn btn-outline" disabled={actionLoading === org.id} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }} onClick={() => handleStatusChange(org, 'ACTIVE')}>
                                {actionLoading === org.id ? '…' : 'Approve'}
                              </button>
                            ) : (
                              <button className="btn btn-outline" disabled={actionLoading === org.id} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleStatusChange(org, 'SUSPENDED')}>
                                {actionLoading === org.id ? '…' : 'Suspend'}
                              </button>
                            )}
                            <button className="btn btn-outline" disabled={actionLoading === org.id} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleDeleteOrg(org)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
              {filteredOrgs.map(org => {
                const cfg = statusConfig[org.status];
                return (
                  <div key={org.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{org.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {org.domain ? <><Globe size={10} style={{ display: 'inline', marginRight: '0.2rem' }} />{org.domain}</> : 'No domain'}
                          </div>
                        </div>
                      </div>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '99px', backgroundColor: cfg.bg, color: cfg.color, fontSize: '0.75rem', fontWeight: 600 }}>
                        {cfg.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}><Users size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />{org._count.members} Members</div>
                      <div style={{ color: 'var(--text-muted)' }}><Package size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />{org._count.modules} Modules</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }} onClick={() => { setDetailOrg(org); setDomainInput(org.domain || ''); setEditingDomain(false); }}>
                        Manage
                      </button>
                      {org.status === 'SUSPENDED' ? (
                        <button className="btn btn-outline" disabled={actionLoading === org.id} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }} onClick={() => handleStatusChange(org, 'ACTIVE')}>
                          {actionLoading === org.id ? '…' : 'Activate'}
                        </button>
                      ) : org.status === 'PENDING' ? (
                        <button className="btn btn-outline" disabled={actionLoading === org.id} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }} onClick={() => handleStatusChange(org, 'ACTIVE')}>
                          {actionLoading === org.id ? '…' : 'Approve'}
                        </button>
                      ) : (
                        <button className="btn btn-outline" disabled={actionLoading === org.id} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleStatusChange(org, 'SUSPENDED')}>
                          {actionLoading === org.id ? '…' : 'Suspend'}
                        </button>
                      )}
                      <button className="btn btn-outline" disabled={actionLoading === org.id} style={{ padding: '0.6rem', fontSize: '0.85rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleDeleteOrg(org)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Detail / Manage Modal ── */}
      {detailOrg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(14px)', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', padding: '2.5rem', position: 'relative', borderRadius: '20px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-darker)' }}>
            <button onClick={() => setDetailOrg(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={22} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.3rem', flexShrink: 0 }}>
                {detailOrg.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0 }}>{detailOrg.name}</h2>
                <span style={{ fontSize: '0.82rem', padding: '0.2rem 0.6rem', borderRadius: '99px', backgroundColor: statusConfig[detailOrg.status].bg, color: statusConfig[detailOrg.status].color }}>
                  {statusConfig[detailOrg.status].label}
                </span>
              </div>
            </div>

            {/* Domain */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Globe size={14} /> Custom Domain
              </h4>
              {editingDomain ? (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input style={inp} value={domainInput} onChange={e => setDomainInput(e.target.value)} placeholder="e.g. springfield.edminz.io" />
                  <button className="btn btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={handleSaveDomain} disabled={savingDomain}>
                    {savingDomain ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Save
                  </button>
                  <button className="btn btn-outline" style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setEditingDomain(false)}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <Globe size={16} color="var(--primary)" />
                  <span style={{ flex: 1, fontSize: '0.95rem' }}>{detailOrg.domain || <span style={{ color: 'var(--text-muted)' }}>No domain configured</span>}</span>
                  <button onClick={() => { setDomainInput(detailOrg.domain || ''); setEditingDomain(true); }} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                </div>
              )}
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Used for white-label routing and email domain validation. E.g. <code style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>school.edminz.io</code>
              </p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Members', value: `${detailOrg._count.members} users`, color: 'var(--text-main)' },
                { label: 'Active Modules', value: `${detailOrg._count.modules}`, color: 'var(--text-main)' },
                { label: 'Revenue/mo', value: `$${detailOrg.modules.filter(m => m.status === 'ACTIVE').reduce((s, m) => s + m.module.monthlyPrice, 0)}`, color: '#4ade80' },
              ].map(item => (
                <div key={item.label} style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.label}</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Module access control */}
            <div>
              <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Package size={14} /> Module Access Control
              </h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Grant or revoke application access for this organization. Super admin overrides bypass billing.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {ALL_MODULE_KEYS.map(mod => {
                  const installed = detailOrg.modules.find(m => m.module.key === mod.key);
                  const isActive = installed?.status === 'ACTIVE';
                  const loadKey = `${detailOrg.id}-${mod.key}`;
                  const isLoading = moduleLoading === loadKey;

                  return (
                    <div key={mod.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-light)'}`, transition: 'border-color 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isActive ? '#4ade80' : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                        <div>
                          <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{mod.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>${mod.price}/mo</span>
                        </div>
                        {installed && (
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '99px', backgroundColor: isActive ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', color: isActive ? '#4ade80' : '#f87171' }}>
                            {isActive ? 'Granted' : 'Revoked'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleModuleToggle(detailOrg.id, mod.key, isActive)}
                        disabled={isLoading}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: isActive ? '#f87171' : '#4ade80', borderColor: isActive ? 'rgba(239,68,68,0.3)' : 'rgba(74,222,128,0.3)', opacity: isLoading ? 0.6 : 1 }}
                      >
                        {isLoading ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : isActive ? (
                          <><ShieldOff size={14} /> Revoke</>
                        ) : (
                          <><ShieldCheck size={14} /> Grant</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDetailOrg(null)}>Close</button>
              {detailOrg.status === 'SUSPENDED' ? (
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading === detailOrg.id} onClick={() => handleStatusChange(detailOrg, 'ACTIVE')}>
                  {actionLoading === detailOrg.id ? 'Processing…' : '✓ Activate Organization'}
                </button>
              ) : detailOrg.status === 'PENDING' ? (
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading === detailOrg.id} onClick={() => handleStatusChange(detailOrg, 'ACTIVE')}>
                  {actionLoading === detailOrg.id ? 'Processing…' : '✓ Approve Organization'}
                </button>
              ) : (
                <button className="btn btn-outline" style={{ flex: 1, color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }} disabled={actionLoading === detailOrg.id} onClick={() => handleStatusChange(detailOrg, 'SUSPENDED')}>
                  {actionLoading === detailOrg.id ? 'Processing…' : '✕ Suspend Organization'}
                </button>
              )}
              <button className="btn btn-outline" style={{ flex: 0, padding: '0 1.25rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} disabled={actionLoading === detailOrg.id} onClick={() => handleDeleteOrg(detailOrg)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsList;
