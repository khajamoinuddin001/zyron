import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Building, User, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../services/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    organizationName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      const { confirmPassword, ...registerData } = formData;
      const data = await api.post<{ token: string, user: any }>('/auth/register', registerData);
      
      // Update store and local storage
      login(
        {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          isSuperAdmin: data.user.isSuperAdmin,
          organization: data.user.organization,
          role: data.user.isSuperAdmin ? 'SUPER_ADMIN' : (data.user.role || 'ORG_ADMIN'),
          activeModules: data.user.activeModules || [],
        },
        data.token
      );

      navigate('/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="hero-bg-glow" style={{ opacity: 0.5 }}></div>
      
      <div className="glass-panel animate-float" style={{ 
        width: '100%', 
        maxWidth: '500px', 
        padding: '3rem 2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="logo-icon" style={{ margin: '0 auto 1rem', width: '50px', height: '50px' }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Create Your Organization</h1>
          <p style={{ color: 'var(--text-muted)' }}>Get started with Edminz Business OS.</p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            borderLeft: '4px solid #ef4444', 
            color: '#f87171', 
            padding: '1rem', 
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Organization Name</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Building size={18} />
              </div>
              <input 
                type="text" 
                name="organizationName"
                placeholder="Acme Corp" 
                value={formData.organizationName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontFamily: 'inherit',
                  fontSize: '1rem'
                }}
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>First Name</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  name="firstName"
                  placeholder="John" 
                  value={formData.firstName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontFamily: 'inherit',
                    fontSize: '1rem'
                  }}
                  required 
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Last Name</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  name="lastName"
                  placeholder="Doe" 
                  value={formData.lastName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontFamily: 'inherit',
                    fontSize: '1rem'
                  }}
                  required 
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Work Email</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                name="email"
                placeholder="admin@acme.com" 
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontFamily: 'inherit',
                  fontSize: '1rem'
                }}
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.75rem',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontFamily: 'inherit',
                  fontSize: '1rem'
                }}
                required 
                minLength={8}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ 
              maxHeight: formData.password.length > 0 ? '200px' : '0px', 
              opacity: formData.password.length > 0 ? 1 : 0, 
              overflow: 'hidden', 
              transition: 'all 0.3s ease',
              marginTop: formData.password.length > 0 ? '0.75rem' : '0'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div style={{ color: formData.password.length >= 8 ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}>
                  {formData.password.length >= 8 ? <CheckCircle size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid currentColor', opacity: 0.5 }}></div>}
                  At least 8 characters
                </div>
                <div style={{ color: /[A-Z]/.test(formData.password) ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}>
                  {/[A-Z]/.test(formData.password) ? <CheckCircle size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid currentColor', opacity: 0.5 }}></div>}
                  One uppercase letter
                </div>
                <div style={{ color: /[0-9]/.test(formData.password) ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}>
                  {/[0-9]/.test(formData.password) ? <CheckCircle size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid currentColor', opacity: 0.5 }}></div>}
                  One number
                </div>
                <div style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}>
                  {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? <CheckCircle size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid currentColor', opacity: 0.5 }}></div>}
                  One special character
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                name="confirmPassword"
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.75rem',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontFamily: 'inherit',
                  fontSize: '1rem'
                }}
                required 
                minLength={8}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="spin" /> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
