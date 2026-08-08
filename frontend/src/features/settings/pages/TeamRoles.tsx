import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, Shield, Users, CheckCircle, AlertCircle, X } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/auth.store';

interface ModuleOption {
  id: string;
  key: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  isActive: boolean;
  _count: { members: number };
  allowedModules: ModuleOption[];
}

const TeamRoles: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [roles, setRoles] = useState<Role[]>([]);
  const [installedModules, setInstalledModules] = useState<ModuleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
    fetchModules();
  }, [user?.activeModules]);

  const fetchRoles = async () => {
    try {
      const data = await api.get<{ roles: Role[] }>('/organizations/roles');
      setRoles(data.roles);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const data = await api.get<{ modules: any[] }>('/platform/modules');
      if (data.modules) {
        const activeKeys = user?.activeModules || [];
        setInstalledModules(
          data.modules
            .filter((m: any) => activeKeys.includes(m.key))
            .map((m: any) => ({
              id: m.id,
              key: m.key,
              name: m.name,
            }))
        );
      }
    } catch {
      // silently fail
    }
  };

  const openModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, description: role.description || '' });
      setSelectedModuleIds(role.allowedModules.map(m => m.id));
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '' });
      setSelectedModuleIds([]);
    }
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({ name: '', description: '' });
    setSelectedModuleIds([]);
  };

  const toggleModule = (id: string) => {
    setSelectedModuleIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload = { ...formData, allowedModuleIds: selectedModuleIds };
      if (editingRole) {
        await api.patch(`/organizations/roles/${editingRole.id}`, payload);
        setFormSuccess('Role updated successfully');
      } else {
        await api.post('/organizations/roles', payload);
        setFormSuccess('Role created successfully');
      }
      await fetchRoles();
      setTimeout(closeModal, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete role "${name}"? Members with this role will lose their access.`)) {
      try {
        await api.delete(`/organizations/roles/${id}`);
        setRoles(roles.filter(r => r.id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete role');
      }
    }
  };

  const handleToggleActive = async (role: Role) => {
    try {
      await api.patch(`/organizations/roles/${role.id}`, { isActive: !role.isActive });
      setRoles(roles.map(r => r.id === role.id ? { ...r, isActive: !r.isActive } : r));
    } catch (err: any) {
      alert(err.message || 'Failed to update role status');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    marginBottom: '0.4rem',
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Team Roles</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Create roles and choose exactly which applications each role can access.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Create Role
        </button>
      </div>

      {error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-lg)' }}>
          <AlertCircle size={32} style={{ marginBottom: '1rem' }} />
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {roles.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>No custom roles yet</h3>
              <p style={{ marginBottom: '1.5rem' }}>Create roles and assign app access (e.g., "Accountant" only sees Accounts, "Teacher" only sees Attendance).</p>
              <button className="btn btn-outline" onClick={() => openModal()}>
                <Plus size={16} /> Create your first role
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>App Access</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Members</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: role.isActive ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Shield size={16} color={role.isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                        </div>
                        <div>
                          <div>{role.name}</div>
                          {role.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{role.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {role.allowedModules.length === 0 ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No app access</span>
                        ) : (
                          role.allowedModules.map(m => (
                            <span key={m.id} style={{ padding: '0.2rem 0.6rem', backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                              {m.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.85rem' }}>
                        <Users size={14} /> {role._count.members}
                      </div>
                    </td>
                    {/* Toggle switch */}
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleActive(role)}
                        title={role.isActive ? 'Disable role' : 'Enable role'}
                        style={{
                          position: 'relative',
                          width: '44px', height: '24px',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: role.isActive ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                          transition: 'background-color 0.25s',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{
                          position: 'absolute', top: '3px',
                          left: role.isActive ? '23px' : '3px',
                          width: '18px', height: '18px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          transition: 'left 0.25s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }} />
                      </button>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => openModal(role)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px' }} title="Edit">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(role.id, role.name)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px', opacity: 0.8 }} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create / Edit Role Modal */}
      {isModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={22} />
            </button>

            <h2 style={{ margin: '0 0 1.5rem 0' }}>{editingRole ? 'Edit Role' : 'Create Custom Role'}</h2>

            {formError && (
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderLeft: '4px solid #ef4444', color: '#f87171', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ backgroundColor: 'rgba(74,222,128,0.1)', borderLeft: '4px solid #4ade80', color: '#4ade80', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <CheckCircle size={16} /> {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={labelStyle}>Role Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g., Class Teacher, Accountant, Dispatcher"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={labelStyle}>Description (Optional)</label>
                <textarea
                  name="description"
                  placeholder="What does this role do?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              {/* App Access Checkboxes */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>App Access</label>
                {installedModules.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No apps installed. Install apps from the App Store first.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {installedModules.map(mod => (
                      <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem 1rem', backgroundColor: selectedModuleIds.includes(mod.id) ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedModuleIds.includes(mod.id) ? 'rgba(99,102,241,0.4)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
                        <input
                          type="checkbox"
                          checked={selectedModuleIds.includes(mod.id)}
                          onChange={() => toggleModule(mod.id)}
                          style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                        />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{mod.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{mod.key}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={submitting || !formData.name.trim()}>
                  {submitting
                    ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    : (editingRole ? 'Save Changes' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamRoles;
