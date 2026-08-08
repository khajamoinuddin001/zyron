import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings, Plus, Send, History, Trash2, Edit2, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { api } from '../../../services/api';

interface Template {
  id: string;
  name: string;
  content: string;
  channel: string;
  createdAt: string;
}

interface MessageLog {
  id: string;
  recipient: string;
  channel: string;
  content: string;
  status: string;
  createdAt: string;
}

interface Member {
  id: string;
  userId: string;
  user: {
    email: string;
    firstName: string;
    lastName: string | null;
  };
  role: string;
}

const MessagingApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'logs'>('send');
  
  // Data state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Send state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Custom Message State
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [customContent, setCustomContent] = useState('');
  const [customChannel, setCustomChannel] = useState<'EMAIL'|'SMS'|'WHATSAPP'>('EMAIL');
  
  // Filter State
  const [filterAbsentToday, setFilterAbsentToday] = useState(false);
  const [absentMemberIds, setAbsentMemberIds] = useState<string[]>([]);

  // Template Form State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', content: '', channel: 'WHATSAPP' });
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [tplRes, logsRes, memRes, attRes] = await Promise.all([
        api.get<{ templates: Template[] }>('/messaging/templates'),
        api.get<{ logs: MessageLog[] }>('/messaging/logs'),
        api.get<{ members: Member[] }>('/organizations/members'),
        api.get<any>(`/attendance?date=${today}`)
      ]);
      setTemplates(tplRes.templates || []);
      setLogs(logsRes.logs || []);
      setMembers(memRes.members || []);
      
      if (attRes.records) {
        const absents = attRes.records.filter((r: any) => r.status === 'ABSENT').map((r: any) => r.memberId);
        setAbsentMemberIds(absents);
      }
      if (tplRes.templates?.length > 0) {
        setSelectedTemplateId(tplRes.templates[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!useCustomMessage && !selectedTemplateId) {
      setSendMsg({ type: 'error', text: 'Please select a template or write a custom message.' });
      return;
    }
    if (useCustomMessage && !customContent.trim()) {
      setSendMsg({ type: 'error', text: 'Please enter message content.' });
      return;
    }
    if (selectedRecipientIds.length === 0) {
      setSendMsg({ type: 'error', text: 'Please select at least one recipient.' });
      return;
    }

    setSending(true);
    setSendMsg(null);
    try {
      await api.post('/messaging/send', {
        templateId: useCustomMessage ? undefined : selectedTemplateId,
        customContent: useCustomMessage ? customContent : undefined,
        channel: useCustomMessage ? customChannel : undefined,
        recipientIds: selectedRecipientIds
      });
      setSendMsg({ type: 'success', text: `Message sent to ${selectedRecipientIds.length} recipients.` });
      setSelectedRecipientIds([]);
      // Refresh logs
      const logsRes = await api.get<{ logs: MessageLog[] }>('/messaging/logs');
      setLogs(logsRes.logs || []);
    } catch (err: any) {
      setSendMsg({ type: 'error', text: err.message || 'Failed to send message.' });
    } finally {
      setSending(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTemplate(true);
    try {
      await api.post('/messaging/templates', templateForm);
      const tplRes = await api.get<{ templates: Template[] }>('/messaging/templates');
      setTemplates(tplRes.templates || []);
      setIsTemplateModalOpen(false);
      setTemplateForm({ name: '', content: '', channel: 'WHATSAPP' });
    } catch (err: any) {
      alert(err.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredMembers = members.filter(m => filterAbsentToday ? absentMemberIds.includes(m.id) : true);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-main)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    marginBottom: '1rem'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex-col-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Messaging Center</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Broadcast announcements or send templates via WhatsApp & SMS.</p>
        </div>
        <div className="w-full-mobile" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', overflowX: 'auto', backgroundColor: 'var(--bg-card)', padding: '0.4rem', borderRadius: '12px' }}>
        <button
          className={`btn ${activeTab === 'send' ? 'btn-primary' : 'btn-outline'}`}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setActiveTab('send')}
        >
          <Send size={16} /> Send Message
        </button>
        <button
          className={`btn ${activeTab === 'templates' ? 'btn-primary' : 'btn-outline'}`}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setActiveTab('templates')}
        >
          <Settings size={16} /> Templates
        </button>
        <button
          className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-outline'}`}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setActiveTab('logs')}
        >
          <History size={16} /> History Logs
        </button>
        </div>
      </div>

      {activeTab === 'send' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Compose Message</h3>
          
          {sendMsg && (
            <div style={{
              backgroundColor: sendMsg.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
              borderLeft: `4px solid ${sendMsg.type === 'success' ? '#4ade80' : '#ef4444'}`,
              color: sendMsg.type === 'success' ? '#4ade80' : '#f87171',
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              {sendMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {sendMsg.text}
            </div>
          )}

          <div className="flex-col-mobile" style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Message Content</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={useCustomMessage} onChange={() => setUseCustomMessage(!useCustomMessage)} />
                  Write Custom Message
                </label>
              </div>

              {!useCustomMessage ? (
                <>
                  {templates.length === 0 ? (
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                      No templates found. Go to Templates tab to create one.
                    </div>
                  ) : (
                    <select 
                      style={inputStyle} 
                      value={selectedTemplateId} 
                      onChange={e => setSelectedTemplateId(e.target.value)}
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>
                      ))}
                    </select>
                  )}

                  {selectedTemplateId && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Template Preview</h4>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                        {templates.find(t => t.id === selectedTemplateId)?.content}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <select 
                    style={inputStyle} 
                    value={customChannel} 
                    onChange={e => setCustomChannel(e.target.value as any)}
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                  <textarea 
                    style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }}
                    placeholder="Type your message here... Use {name} or {date} for variables."
                    value={customContent}
                    onChange={e => setCustomContent(e.target.value)}
                  />
                </>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div className="flex-col-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Recipients ({selectedRecipientIds.length} selected)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: '#f43f5e', fontWeight: 500 }}>
                  <input type="checkbox" checked={filterAbsentToday} onChange={() => setFilterAbsentToday(!filterAbsentToday)} />
                  Absent Today Only
                </label>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.5rem' }}>
                {filteredMembers.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', cursor: 'pointer', borderRadius: '4px', backgroundColor: selectedRecipientIds.includes(m.id) ? 'rgba(99,102,241,0.1)' : 'transparent' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedRecipientIds.includes(m.id)}
                      onChange={() => toggleRecipient(m.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>{m.user.firstName} {m.user.lastName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.user.email} • {m.role}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary w-full-mobile" onClick={handleSend} disabled={sending || (!useCustomMessage && !selectedTemplateId) || selectedRecipientIds.length === 0}>
              {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              Send Broadcast
            </button>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex-col-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Message Templates</h3>
            <button className="btn btn-primary w-full-mobile" onClick={() => setIsTemplateModalOpen(true)}>
              <Plus size={16} /> New Template
            </button>
          </div>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Channel</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Content Preview</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No templates found.</td>
                </tr>
              ) : (
                templates.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{t.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                        {t.channel}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.content}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Message History</h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Recipient</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Channel</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No messages sent yet.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{log.recipient}</td>
                    <td style={{ padding: '1rem' }}>{log.channel}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: log.status === 'SENT' ? '#4ade80' : '#ef4444' }}>{log.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {isTemplateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setIsTemplateModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Create WhatsApp Template</h3>
            <form onSubmit={handleSaveTemplate}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Template Name</label>
              <input style={inputStyle} required value={templateForm.name} onChange={e => setTemplateForm({...templateForm, name: e.target.value})} placeholder="e.g. Absent Notification" />

              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Channel</label>
              <select style={inputStyle} required value={templateForm.channel} onChange={e => setTemplateForm({...templateForm, channel: e.target.value})}>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
              </select>

              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Content</label>
              <textarea style={{...inputStyle, minHeight: '100px'}} required value={templateForm.content} onChange={e => setTemplateForm({...templateForm, content: e.target.value})} placeholder="Dear Parent, {name} is absent today ({date})." />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
                Variables: {'{name}'}, {'{date}'}
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsTemplateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingTemplate}>
                  {savingTemplate ? <Loader2 size={16} /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingApp;
