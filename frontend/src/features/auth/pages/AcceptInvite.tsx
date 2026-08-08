import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, User, Phone, Lock, CheckCircle, Eye, EyeOff, Mail, XCircle } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/auth.store';

export const AcceptInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    mobile: '',
    email: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        const res = await api.get<{ invite: any }>(`/organizations/invites/${token}`);
        setInviteDetails(res.invite);
      } catch (err: any) {
        setError(err.message || 'Invalid or expired invite link.');
      } finally {
        setLoading(false);
      }
    };
    fetchInviteDetails();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        password: inviteDetails.organization.name
      };
      const res = await api.post<{ token: string; user: any }>(`/organizations/invites/${token}/accept`, payload);
      login(res.user, res.token);
      
      setSubmitStatus('success');
      
    } catch (err: any) {
      setError(err.message || 'Failed to register.');
      setSubmitStatus('error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
        <Loader2 size={32} className="spin" color="var(--primary)" />
      </div>
    );
  }

  if (error || !inviteDetails) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
          <h2 style={{ margin: '0 0 1rem 0', color: 'var(--danger)' }}>Invite Error</h2>
          <p style={{ color: 'var(--text-muted)' }}>{error || 'Something went wrong.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '450px', position: 'relative', margin: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {inviteDetails.organization?.logoUrl ? (
            <img src={inviteDetails.organization.logoUrl} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '12px', marginBottom: '1rem' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'var(--primary)', margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
              {inviteDetails.organization?.name?.charAt(0)}
            </div>
          )}
          <h2 style={{ margin: '0 0 0.5rem 0' }}>Join {inviteDetails.organization?.name}</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            You've been invited to join as a {inviteDetails.role?.toLowerCase() || 'student'}
            {inviteDetails.group ? ` in ${inviteDetails.group.name}` : ''}.
          </p>
        </div>

        {error && submitStatus === 'idle' && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

          {submitStatus === 'idle' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><User size={18} /></div>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Mobile Number (Required)</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Phone size={18} /></div>
                  <input 
                    type="tel" 
                    placeholder="+1 234 567 8900" 
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Mail size={18} /></div>
                  <input 
                    type="email" 
                    placeholder="student@example.com" 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                {submitting ? <Loader2 size={20} className="spin" style={{ margin: '0 auto' }} /> : 'Complete Registration'}
              </button>
            </form>
          )}

          {submitStatus === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '1.5rem', animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                <CheckCircle size={40} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>Registration Successful!</h3>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>You've been securely added. You can now close this page.</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '1.5rem', animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                <XCircle size={40} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>Registration Failed</h3>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>{error}</p>
              <button onClick={() => { setSubmitStatus('idle'); setError(null); }} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                Try Again
              </button>
            </div>
          )}

          <style>{`
            @keyframes scaleIn {
              0% { transform: scale(0); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes fadeIn {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
          `}</style>
        </div>
    </div>
  );
};
