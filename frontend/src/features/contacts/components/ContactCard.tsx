import React from 'react';
import { Mail, Phone, User, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Contact {
  id: string;
  name: string;
  initials: string;
  rating?: string;
  isNew?: boolean;
  code?: string;
  email?: string;
  phone?: string;
  department?: string;
  manager?: string; // used for e.g. "Admissions Counsellor (Khaja Moinuddin)"
  date: string;
  status: string; // e.g. "Reception Check-in", "Manual", "In progress"
}

interface ContactCardProps {
  contact: Contact;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact }) => {
  return (
    <Link to={`/dashboard/contacts/${contact.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="glass-panel hover-scale" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
        {/* Avatar with Badge */}
        <div style={{ position: 'relative' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', 
            color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontWeight: 600, fontSize: '1.1rem' 
          }}>
            {contact.initials}
          </div>
          {contact.rating && (
            <div style={{ 
              position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#f59e0b', color: 'white', fontSize: '0.65rem', fontWeight: 700,
              padding: '2px 6px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '2px',
              border: '2px solid var(--bg-card)'
            }}>
              <span style={{ fontSize: '0.55rem' }}>★</span> {contact.rating}
            </div>
          )}
        </div>

        {/* Name and Badges */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>{contact.name}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {contact.isNew && (
              <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                New
              </span>
            )}
            {contact.code && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, backgroundColor: 'var(--bg-darker)', padding: '2px 8px', borderRadius: '4px' }}>
                {contact.code}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem', flex: 1 }}>
        {contact.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Mail size={14} style={{ opacity: 0.7 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Phone size={14} style={{ opacity: 0.7 }} />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.manager && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <User size={14} style={{ opacity: 0.7 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.manager}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
          <CalendarDays size={14} style={{ opacity: 0.7 }} />
          <span>{contact.date}</span>
        </div>
        
        {contact.status && (
          <span style={{ 
            backgroundColor: contact.status === 'In progress' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-darker)',
            color: contact.status === 'In progress' ? '#3b82f6' : 'var(--text-muted)',
            fontSize: '0.75rem', fontWeight: 500, padding: '4px 10px', borderRadius: '4px',
            display: 'flex', alignItems: 'center', gap: contact.status === 'In progress' ? '4px' : '0'
          }}>
            {contact.status === 'In progress' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>}
            {contact.status}
          </span>
        )}
      </div>
      </div>
    </Link>
  );
};
