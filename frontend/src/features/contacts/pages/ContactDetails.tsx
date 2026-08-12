import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { ArrowLeft, Mail, Phone, CalendarDays, User, Building, MapPin, Briefcase, Hash } from 'lucide-react';

export const ContactDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMember = async () => {
      try {
        setLoading(true);
        const data = await api.get<{ member: any }>(`/organizations/members/${id}`);
        setMember(data.member);
      } catch (err: any) {
        setError(err.message || 'Failed to load member details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchMember();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spin" style={{ width: '32px', height: '32px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error)' }}>Error</h2>
        <p>{error || 'Member not found.'}</p>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard/contacts')} style={{ marginTop: '1rem' }}>
          Back to Contacts
        </button>
      </div>
    );
  }

  const { user, customRole, role, groups, status, createdAt } = member;
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || user.email.split('@')[0];
  const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || user.email.charAt(0).toUpperCase();
  
  const displayRole = customRole?.name || role;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/dashboard/contacts')}
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: 'var(--text-muted)', fontSize: '0.9rem', padding: 0, marginBottom: '2rem' 
        }}
      >
        <ArrowLeft size={18} /> Back to Contacts
      </button>

      {/* Main Profile Header Card */}
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '16px', display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
        <div style={{ 
          width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', 
          color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontWeight: 700, fontSize: '2.5rem', flexShrink: 0
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', color: 'var(--text-main)' }}>{fullName}</h1>
              <span style={{ 
                display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                color: 'var(--primary)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem'
              }}>
                {displayRole}
              </span>
            </div>
            <div style={{ 
              padding: '0.35rem 1rem', 
              borderRadius: '20px', 
              fontSize: '0.8rem', 
              fontWeight: 600,
              backgroundColor: status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: status === 'ACTIVE' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
            }}>
              {status}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Contact Info Card */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} style={{ color: 'var(--primary)' }} /> Personal Details
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--bg-card)' }}>
                <Mail size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                <p style={{ margin: '0.1rem 0 0 0', fontWeight: 500, color: 'var(--text-main)' }}>{user.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--bg-card)' }}>
                <Phone size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Phone</p>
                <p style={{ margin: '0.1rem 0 0 0', fontWeight: 500, color: 'var(--text-main)' }}>{user.mobile || 'Not provided'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--bg-card)' }}>
                <CalendarDays size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined On</p>
                <p style={{ margin: '0.1rem 0 0 0', fontWeight: 500, color: 'var(--text-main)' }}>
                  {new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Info Card */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={20} style={{ color: 'var(--primary)' }} /> Organization Details
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--bg-card)' }}>
                <Briefcase size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Groups / Classes</p>
                {groups && groups.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {groups.map((g: any) => (
                      <span key={g.group.id} style={{ 
                        padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-light)', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--text-main)'
                      }}>
                        {g.group.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)' }}>No groups assigned</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--bg-card)' }}>
                <Hash size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System ID</p>
                <p style={{ margin: '0.1rem 0 0 0', fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>{member.id}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactDetails;
