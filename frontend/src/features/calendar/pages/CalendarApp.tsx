import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '@/services/api';
import { Calendar as CalendarIcon, Plus, X, Loader2, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface OrgEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: string;
  location?: string;
  color?: string;
}

export const CalendarApp: React.FC = () => {
  const { user } = useAuthStore();
  const isOrgAdmin = user?.role === 'ORG_ADMIN' || user?.isSuperAdmin;

  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Default Mon-Sat

  useEffect(() => {
    fetchEvents();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get<any>('/attendance/settings');
      if (res.settings && res.settings.workingDays) {
        setWorkingDays(JSON.parse(res.settings.workingDays));
      }
    } catch (err) {
      console.error('Failed to fetch attendance settings:', err);
    }
  };

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OrgEvent | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('GENERAL');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#3b82f6'); // default blue
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ events: OrgEvent[] }>('/calendar/events');
      setEvents(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openNewEventModal = (start?: Date, end?: Date, initialType = 'GENERAL', initialTitle = '') => {
    if (!isOrgAdmin) return;
    setEditingEvent(null);
    setTitle(initialTitle);
    setDescription('');
    
    // Format dates for datetime-local input
    const now = new Date();
    const s = start || now;
    const e = end || new Date(s.getTime() + 60 * 60 * 1000); // +1 hour

    // HTML datetime-local requires YYYY-MM-DDThh:mm format
    const formatForInput = (d: Date) => {
      return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    setStartDate(formatForInput(s));
    setEndDate(formatForInput(e));
    setType(initialType);
    setLocation('');
    setColor('#3b82f6');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (event: OrgEvent) => {
    if (!isOrgAdmin) return;
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    
    const formatForInput = (dateString: string) => {
      const d = new Date(dateString);
      return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    setStartDate(formatForInput(event.startDate));
    setEndDate(formatForInput(event.endDate));
    setType(event.type);
    setLocation(event.location || '');
    setColor(event.color || (event.type === 'HOLIDAY' ? '#ef4444' : '#3b82f6'));
    setError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // If type is HOLIDAY, force red color
    const finalColor = type === 'HOLIDAY' ? '#ef4444' : color;

    try {
      if (editingEvent) {
        await api.put(`/calendar/events/${editingEvent.id}`, {
          title, description, startDate, endDate, type, location, color: finalColor
        });
      } else {
        await api.post('/calendar/events', {
          title, description, startDate, endDate, type, location, color: finalColor
        });
      }
      setShowModal(false);
      fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    setSaving(true);
    try {
      await api.delete(`/calendar/events/${editingEvent.id}`);
      setShowModal(false);
      fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
      setSaving(false);
    }
  };

  const eventPropGetter = (event: OrgEvent) => {
    const isHoliday = event.type === 'HOLIDAY';
    const backgroundColor = isHoliday ? '#ef4444' : (event.color || '#3b82f6');
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        border: 'none',
        display: 'block',
        color: 'white',
      }
    };
  };

  // Map events to format expected by react-big-calendar
  const calendarEvents = events.map(e => ({
    ...e,
    start: new Date(e.startDate),
    end: new Date(e.endDate),
  }));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex-col-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Organization Calendar</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage events, meetings, exams, and holidays.</p>
        </div>
        
        {isOrgAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem' }} className="w-full-mobile">
            <button className="btn btn-outline" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => openNewEventModal(undefined, undefined, 'HOLIDAY', 'Holiday')}>
              <CalendarIcon size={16} /> Mark Holiday
            </button>
            <button className="btn btn-primary" onClick={() => openNewEventModal()}>
              <Plus size={16} /> New Event
            </button>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1rem', height: 'calc(100vh - 200px)', minHeight: '600px', backgroundColor: 'var(--bg-card)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          </div>
        ) : (
          <style dangerouslySetInnerHTML={{__html: `
            .rbc-calendar { font-family: 'Inter', sans-serif; color: var(--text-main); border: none; }
            .rbc-calendar { font-family: 'Inter', sans-serif; color: var(--text-main); border: none; }
            .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: none; border-radius: 12px; overflow: hidden; background: transparent; }
            .rbc-header { border-bottom: 1px solid rgba(255,255,255,0.05); padding: 1rem 0; font-weight: 600; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em; color: var(--text-muted); border-left: none; }
            .rbc-month-row, .rbc-day-bg { border-color: rgba(255,255,255,0.05); }
            .rbc-off-range-bg { background: transparent; opacity: 0.2; }
            .rbc-today { background-color: transparent; }
            .rbc-today .rbc-button-link, .rbc-today .rbc-date-cell > a { background-color: var(--primary); color: white !important; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; font-weight: 600; margin-top: 2px; }
            .rbc-event { padding: 4px 8px; font-size: 0.85rem; font-weight: 500; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s; }
            .rbc-event:hover { transform: scale(1.02); }
            .rbc-day-bg + .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05); }
            .rbc-month-row + .rbc-month-row { border-top: 1px solid rgba(255,255,255,0.05); }
            .rbc-date-cell { padding: 0; }
            .rbc-show-more { color: var(--primary); font-weight: 500; font-size: 0.8rem; margin-top: 4px; }
            .rbc-event:hover { transform: scale(1.02); }
            .rbc-toolbar { margin-bottom: 1.5rem; }
            .rbc-toolbar-label { font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
          `}} />
        )}
        {!loading && (
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            selectable={isOrgAdmin}
            onSelectSlot={(slotInfo) => openNewEventModal(slotInfo.start, slotInfo.end)}
            onSelectEvent={(event) => openEditModal(event as OrgEvent)}
            eventPropGetter={eventPropGetter as any}
            dayPropGetter={(date) => {
              const isWorkingDay = workingDays.includes(date.getDay());
              if (!isWorkingDay) {
                return {
                  style: {
                    backgroundColor: 'rgba(239, 68, 68, 0.03)',
                    boxShadow: 'inset 0 0 15px rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.1)'
                  }
                };
              }
              return {};
            }}
            popup
            components={{
              month: {
                dateHeader: ({ date, label }) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px', position: 'relative' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                        color: isToday ? 'white' : 'var(--text-main)',
                        fontWeight: isToday ? 700 : 400,
                        fontSize: '0.9rem'
                      }}>
                        {label}
                      </div>
                    </div>
                  );
                }
              },
              toolbar: (props) => {
                const nav = (action: 'PREV' | 'NEXT' | 'TODAY') => props.onNavigate(action);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => nav('PREV')} className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center' }} title="Previous">
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={() => nav('TODAY')} className="btn btn-outline" style={{ padding: '0.5rem 1.5rem', borderRadius: '10px', fontWeight: 600 }}>
                        Today
                      </button>
                      <button onClick={() => nav('NEXT')} className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center' }} title="Next">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600 }}>{props.label}</h2>
                    
                    <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '4px' }}>
                      {(props.views as string[]).map((v) => {
                        const isActive = props.view === v;
                        return (
                          <button 
                            key={v} 
                            onClick={() => props.onView(v as View)} 
                            style={{ 
                              background: isActive ? 'var(--primary)' : 'transparent', 
                              border: 'none', 
                              padding: '6px 16px', 
                              borderRadius: '6px', 
                              color: isActive ? 'white' : 'var(--text-main)',
                              cursor: 'pointer',
                              textTransform: 'capitalize',
                              fontWeight: isActive ? 600 : 400,
                              boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            }}
          />
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#111827'} onMouseOut={e => e.currentTarget.style.color='#6b7280'}><X size={20} /></button>
            <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{editingEvent ? 'Edit Event' : 'New Event'}</h3>
            
            {error && (
              <div style={{ padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem' }}>Event Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. End of Term Exams" style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827', boxSizing: 'border-box', fontSize: '1rem', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor='var(--primary)'} onBlur={e => e.currentTarget.style.borderColor='#d1d5db'} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem' }}>Date & Time</label>
                <input type="datetime-local" required value={startDate} onChange={e => {
                  setStartDate(e.target.value);
                  const newEnd = new Date(new Date(e.target.value).getTime() + 60 * 60 * 1000);
                  const formatForInput = (d: Date) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                  setEndDate(formatForInput(newEnd));
                }} style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827', boxSizing: 'border-box', colorScheme: 'light', fontSize: '1rem', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor='var(--primary)'} onBlur={e => e.currentTarget.style.borderColor='#d1d5db'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem' }}>Event Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827', boxSizing: 'border-box', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                    <option value="GENERAL">General</option>
                    <option value="MEETING">Meeting</option>
                    <option value="EXAM">Exam</option>
                    <option value="HOLIDAY">Holiday</option>
                  </select>
                </div>
                {type !== 'HOLIDAY' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem' }}>Color Code</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                      <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ padding: '0', backgroundColor: 'transparent', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden' }} />
                      <span style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 500, textTransform: 'uppercase' }}>{color}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem' }}>Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Main Auditorium" style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827', boxSizing: 'border-box', fontSize: '1rem', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor='var(--primary)'} onBlur={e => e.currentTarget.style.borderColor='#d1d5db'} />
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem' }}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Event details..." style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical', fontSize: '1rem', transition: 'border-color 0.2s', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.currentTarget.style.borderColor='var(--primary)'} onBlur={e => e.currentTarget.style.borderColor='#d1d5db'} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                {editingEvent ? (
                  <button type="button" className="btn btn-outline" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)', padding: '0.75rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleDelete} disabled={saving}>
                    <Trash2 size={18} /> Delete
                  </button>
                ) : <div />}
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={saving} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #d1d5db', color: '#4b5563', backgroundColor: '#ffffff' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.75rem 2rem', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 600 }}>
                    {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Event'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
