import React, { useState, useEffect } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import '../../../calendar-responsive.css';

interface Holiday {
  id: string;
  date: string;
  name: string;
}

export const AttendanceHolidays: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [holidayName, setHolidayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, [currentDate]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      // Fetch all calendar events and filter for holidays to ensure sync across modules
      const res = await api.get<{ events: any[] }>(`/calendar/events`);
      const holidayEvents = (res.events || [])
        .filter(e => e.type === 'HOLIDAY')
        .map(e => {
          // Convert UTC startDate to local date string for consistent matching
          const d = new Date(e.startDate);
          const localStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          return {
            id: e.id,
            date: localStr,
            name: e.title
          };
        });
      setHolidays(holidayEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existing = holidays.find(h => h.date.startsWith(dateStr));
    if (!existing) {
      setSelectedDate(date);
      setHolidayName('');
      setShowModal(true);
    }
  };

  const handleSaveHoliday = async () => {
    if (!selectedDate || !holidayName.trim()) return;
    setSaving(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      // Format as expected by datetime-local (required by backend processing)
      const dateTimeStr = `${dateStr}T00:00`; 
      await api.post('/calendar/events', { 
        title: holidayName,
        startDate: dateTimeStr,
        endDate: dateTimeStr,
        type: 'HOLIDAY',
        color: '#ef4444'
      });
      setShowModal(false);
      fetchHolidays();
    } catch (err: any) {
      alert(err.message || 'Failed to create holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove this holiday?')) return;
    try {
      await api.delete(`/calendar/events/${id}`);
      fetchHolidays();
    } catch (err) {
      console.error(err);
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} className="calendar-day blank"></div>);
    
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(Date.UTC(year, month, i + 1));
      const dateStr = date.toISOString().split('T')[0];
      const holiday = holidays.find(h => h.date.startsWith(dateStr));

      return (
        <div 
          key={i + 1} 
          className="calendar-day-cell" 
          onClick={() => handleDayClick(date)}
          style={{ 
            cursor: holiday ? 'default' : 'pointer',
            backgroundColor: holiday ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-card)'
          }}
        >
          <span style={{ fontWeight: 600, color: holiday ? '#f43f5e' : 'var(--text-main)' }}>{i + 1}</span>
          {holiday && (
            <div className="holiday-text">
              {holiday.name}
              <button 
                onClick={(e) => handleDeleteHoliday(holiday.id, e)}
                style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 0 }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      );
    });

    return [...blanks, ...days];
  };

  return (
    <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Organization Holidays</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Declare holidays to block attendance submission.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn-outline" onClick={handleNextMonth}><ChevronRight size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" /></div>
      ) : (
        <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden', width: '100%' }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-light)' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-header-cell">
                  <span className="calendar-hide-mobile">{day}</span>
                  <span className="calendar-show-mobile">{day.charAt(0)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {renderCalendar()}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Declare Holiday</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Date</label>
              <input type="text" readOnly value={selectedDate?.toLocaleDateString()} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }} />
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Holiday Name</label>
              <input type="text" value={holidayName} onChange={e => setHolidayName(e.target.value)} placeholder="e.g. Summer Break" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveHoliday} disabled={saving || !holidayName.trim()}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Holiday'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
