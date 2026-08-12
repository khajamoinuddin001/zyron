import React, { useState, useEffect } from 'react';
import { Search, Filter, LayoutGrid, List, Plus, GitMerge, Loader2 } from 'lucide-react';
import { ContactCard, Contact } from '../components/ContactCard';
import { api } from '../../../services/api';

export const ContactsApp: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const data = await api.get<{ members: any[] }>('/organizations/members');
        
        const mappedContacts: Contact[] = data.members.map((m: any) => {
          const user = m.user;
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
          
          // Try to get group/role info for manager/department display
          let roleDisplay = m.role || '';
          if (m.groups && m.groups.length > 0) {
            roleDisplay = m.groups.map((g: any) => g.group.name).join(', ');
          }

          return {
            id: m.id,
            name: fullName || user.email.split('@')[0],
            initials: initials || user.email.charAt(0).toUpperCase(),
            email: user.email,
            phone: user.mobile || '',
            manager: roleDisplay,
            date: new Date(m.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: m.status === 'ACTIVE' ? 'Active' : m.status
          };
        });

        setContacts(mappedContacts);
      } catch (err: any) {
        setError(err.message || 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.manager && c.manager.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ paddingBottom: '3rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 700 }}>Contacts</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {loading ? 'Loading contacts...' : `${filteredContacts.length} contacts`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Plus size={18} /> Add Contact
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitMerge size={18} /> Merge
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name, email, phone, role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field" 
            style={{ 
              width: '100%', 
              height: '42px',
              paddingLeft: '2.8rem', 
              paddingRight: '1rem',
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              outline: 'none'
            }} 
          />
        </div>
        
        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-card)', height: '42px', borderRadius: '8px' }}>
          <Filter size={18} /> Filters
        </button>

        <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden', height: '42px' }}>
          <button 
            onClick={() => setViewMode('grid')}
            style={{ 
              padding: '0.5rem 0.75rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <LayoutGrid size={18} />
          </button>
          <div style={{ width: '1px', backgroundColor: 'var(--border-light)' }}></div>
          <button 
            onClick={() => setViewMode('list')}
            style={{ 
              padding: '0.5rem 0.75rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: viewMode === 'list' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          {error}
        </div>
      ) : filteredContacts.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
          No contacts found matching your search.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}

    </div>
  );
};

export default ContactsApp;
