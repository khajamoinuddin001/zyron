import React, { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../../services/api';

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 0, label: 'Sunday' }
];

export const AttendanceSettings: React.FC = () => {
  const [workingDays, setWorkingDays] = useState<number[]>([1,2,3,4,5,6]);
  const [absentTemplateId, setAbsentTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, tplRes] = await Promise.all([
          api.get<any>('/attendance/settings'),
          api.get<any>('/messaging/templates')
        ]);
        
        if (settingsRes.settings) {
          if (settingsRes.settings.workingDays) {
            setWorkingDays(JSON.parse(settingsRes.settings.workingDays));
          }
          if (settingsRes.settings.absentTemplateId) {
            setAbsentTemplateId(settingsRes.settings.absentTemplateId);
          }
        }
        setTemplates(tplRes.templates || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleDay = (id: number) => {
    setWorkingDays(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api.post('/attendance/settings', {
        workingDays,
        absentTemplateId: absentTemplateId || null
      });
      setMsg({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem' }}>Attendance Settings</h3>

      {msg && (
        <div style={{
          backgroundColor: msg.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          color: msg.type === 'success' ? '#4ade80' : '#f87171',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Working Days</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Select the days your organization is open. Unselected days are considered weekends.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {DAYS.map(day => (
            <label key={day.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={workingDays.includes(day.id)} 
                onChange={() => handleToggleDay(day.id)}
              />
              {day.label}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Default Absent Notification</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Select the message template to use when notifying parents of an absence.
        </p>
        <select 
          value={absentTemplateId} 
          onChange={e => setAbsentTemplateId(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
        >
          <option value="">-- Use Default System Message --</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>
          ))}
        </select>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};
