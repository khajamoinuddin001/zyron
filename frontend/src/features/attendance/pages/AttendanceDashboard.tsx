import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle, Save, Loader2, Clock, Send, Users, Plus, Trash2, Edit2, X, RefreshCw, Download, Settings, Search, Eye, EyeOff, Link as LinkIcon, Copy } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/auth.store';
import { AttendanceSettings } from './AttendanceSettings';
import { AttendanceHolidays } from './AttendanceHolidays';

interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  groupId: string | null;
}

interface Member {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
  role: string;
  groups?: {
    group: {
      name: string;
      type: string;
    };
  }[];
}

interface OrgGroup {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  _count: { members: number };
}

const AttendanceDashboard: React.FC = () => {
  const authUser = useAuthStore(s => s.user);
  const isOrgAdmin = authUser?.role === 'ORG_ADMIN' || authUser?.isSuperAdmin;
  const [activeTab, setActiveTab] = useState<'TAKE_ATTENDANCE' | 'MANAGE_GROUPS' | 'SETTINGS' | 'HOLIDAYS'>('TAKE_ATTENDANCE');

  // Groups State
  const [groups, setGroups] = useState<OrgGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [editGroup, setEditGroup] = useState<OrgGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupType, setEditGroupType] = useState('CLASS');

  // Attendance State
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notifyAbsent, setNotifyAbsent] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [holidayName, setHolidayName] = useState<string | null>(null);

  // Group Management Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('CLASS');

  const [manageGroup, setManageGroup] = useState<OrgGroup | null>(null);
  const [allOrgMembers, setAllOrgMembers] = useState<Member[]>([]);
  const [manageGroupMembers, setManageGroupMembers] = useState<string[]>([]); // array of memberIds
  const [savingMembers, setSavingMembers] = useState(false);

  // Add new member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberData, setNewMemberData] = useState({ firstName: '', lastName: '', email: '', mobile: '', password: '', role: 'STUDENT', groupId: '' });
  const [addingMember, setAddingMember] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Invite Link State
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  const generateInviteLink = async (groupId: string) => {
    try {
      setGeneratingLink(groupId);
      const res = await api.post<{ invite: { token: string } }>('/organizations/invites', { groupId });
      const link = `${window.location.origin}/invite/${res.invite.token}`;
      setGeneratedInviteLink(link);
    } catch (err: any) {
      alert('Failed to generate link: ' + err.message);
    } finally {
      setGeneratingLink(null);
    }
  };

  // Take Attendance Wizard State
  const [takingAttendanceIndex, setTakingAttendanceIndex] = useState<number | null>(null);
  const currentAttendanceMember = takingAttendanceIndex !== null && groupMembers[takingAttendanceIndex] ? groupMembers[takingAttendanceIndex] : null;

  const handleNextAttendance = (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (currentAttendanceMember) {
      handleStatusChange(currentAttendanceMember.id, status);
    }
    if (takingAttendanceIndex !== null && takingAttendanceIndex + 1 < groupMembers.length) {
      setTakingAttendanceIndex(takingAttendanceIndex + 1);
    } else {
      setTakingAttendanceIndex(null);
    }
  };

  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await api.get<{ groups: OrgGroup[] }>('/organizations/groups');
      setGroups(res.groups || []);
      if (res.groups?.length > 0 && !selectedGroupId) {
        setSelectedGroupId(res.groups[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroups(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedGroupId) return;
    setLoadingAttendance(true);
    setSaveMsg(null);
    try {
      const [memRes, attRes, eventsRes] = await Promise.all([
        api.get<{ members: Member[] }>(`/organizations/groups/${selectedGroupId}/members`),
        api.get<{ records: AttendanceRecord[] }>(`/attendance?date=${date}&groupId=${selectedGroupId}`),
        api.get<{ events: any[] }>(`/calendar/events`)
      ]);
      setGroupMembers(memRes.members || []);

      const recMap: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
      (attRes.records || []).forEach(r => {
        recMap[r.memberId] = r.status;
      });
      setRecords(recMap);

      // Check if current date is a holiday
      const holidayEvent = (eventsRes.events || []).find(e => {
        if (e.type !== 'HOLIDAY') return false;

        // Convert UTC date to local date string (YYYY-MM-DD) for accurate comparison
        const eventDate = new Date(e.startDate);
        const localDateStr = new Date(eventDate.getTime() - (eventDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        return localDateStr === date;
      });

      // Check if it's a non-working day
      const parts = date.split('-');
      const targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const dayOfWeek = targetDate.getDay();
      
      let workingDaysArr = [1, 2, 3, 4, 5, 6];
      try {
        if (authUser?.organization?.workingDays) {
          workingDaysArr = JSON.parse(authUser.organization.workingDays);
        }
      } catch (e) {
        console.error('Failed to parse workingDays', e);
      }
      const isNonWorkingDay = !workingDaysArr.includes(dayOfWeek);

      if (holidayEvent) {
        setHolidayName(holidayEvent.title);
      } else if (isNonWorkingDay) {
        setHolidayName("Non-Working Day (Weekend)");
      } else {
        setHolidayName(null);
      }

      const isOrgAdmin = authUser?.role === 'ORG_ADMIN' || authUser?.isSuperAdmin;
      const attExists = (attRes.records || []).length > 0;

      setIsLocked((!isOrgAdmin && attExists) || !!holidayEvent || isNonWorkingDay);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendance(false);
    }
  }, [selectedGroupId, date]);

  useEffect(() => {
    if (activeTab === 'TAKE_ATTENDANCE') {
      fetchAttendance();
    }
  }, [fetchAttendance, activeTab]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/organizations/groups', { name: newGroupName, type: newGroupType });
      setShowCreateGroup(false);
      setNewGroupName('');
      fetchGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to create group');
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroup) return;
    try {
      await api.patch(`/organizations/groups/${editGroup.id}`, { name: editGroupName, type: editGroupType });
      setEditGroup(null);
      fetchGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to update group');
    }
  };

  const openManageMembers = async (group: OrgGroup) => {
    setManageGroup(group);
    setMemberSearchQuery('');
    try {
      const [allRes, memRes] = await Promise.all([
        api.get<{ members: Member[] }>('/organizations/members'),
        api.get<{ members: Member[] }>(`/organizations/groups/${group.id}/members`)
      ]);
      setAllOrgMembers(allRes.members || []);
      setManageGroupMembers((memRes.members || []).map(m => m.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMembers = async () => {
    if (!manageGroup) return;
    setSavingMembers(true);
    try {
      await api.post(`/organizations/groups/${manageGroup.id}/members`, { memberIds: manageGroupMembers });
      setManageGroup(null);
      fetchGroups();
      if (selectedGroupId === manageGroup.id) fetchAttendance();
    } catch (err: any) {
      alert(err.message || 'Failed to update members');
    } finally {
      setSavingMembers(false);
    }
  };

  const handleStatusChange = (memberId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setRecords(prev => ({ ...prev, [memberId]: status }));
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    const recMap: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    groupMembers.forEach(m => recMap[m.id] = status);
    setRecords(recMap);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const payloadRecords = Object.keys(records).map(memberId => ({
        memberId,
        status: records[memberId]
      }));

      await api.post('/attendance', {
        date,
        groupId: selectedGroupId,
        records: payloadRecords,
        notifyAbsent
      });

      setSaveMsg({ type: 'success', text: `Attendance saved successfully for ${payloadRecords.length} members.` });

      const isOrgAdmin = authUser?.role === 'ORG_ADMIN' || authUser?.isSuperAdmin;
      setIsLocked(!isOrgAdmin);
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message || 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = () => {
    if (!groupMembers.length) return;
    const groupName = groups.find(g => g.id === selectedGroupId)?.name || 'Class';

    const headers = ['First Name', 'Last Name', 'Email', 'Role', 'Status'];
    const rows = groupMembers.map(m => [
      m.user.firstName,
      m.user.lastName || '',
      m.user.email,
      m.role,
      records[m.id] || 'UNMARKED'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Attendance_${groupName.replace(/\s+/g, '_')}_${date}.csv`;
    link.click();
  };

  const presentCount = Object.values(records).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(records).filter(s => s === 'ABSENT').length;
  const lateCount = Object.values(records).filter(s => s === 'LATE').length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex-col-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Attendance</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage classes, departments, and daily attendance.</p>
        </div>
        <div className="w-full-mobile" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', overflowX: 'auto', backgroundColor: 'var(--bg-card)', padding: '0.4rem', borderRadius: '12px' }}>
          <button className={`btn ${activeTab === 'TAKE_ATTENDANCE' ? 'btn-primary' : ''}`} style={{ background: activeTab === 'TAKE_ATTENDANCE' ? '' : 'transparent', border: 'none', color: activeTab === 'TAKE_ATTENDANCE' ? 'white' : 'var(--text-muted)', whiteSpace: 'nowrap' }} onClick={() => setActiveTab('TAKE_ATTENDANCE')}>
            <CheckCircle size={16} /> Mark Attendance
          </button>
          <button className={`btn ${activeTab === 'MANAGE_GROUPS' ? 'btn-primary' : ''}`} style={{ background: activeTab === 'MANAGE_GROUPS' ? '' : 'transparent', border: 'none', color: activeTab === 'MANAGE_GROUPS' ? 'white' : 'var(--text-muted)', whiteSpace: 'nowrap' }} onClick={() => setActiveTab('MANAGE_GROUPS')}>
            <Users size={16} /> Manage Groups
          </button>
          {isOrgAdmin && (
            <>
              <button className={`btn ${activeTab === 'HOLIDAYS' ? 'btn-primary' : ''}`} style={{ background: activeTab === 'HOLIDAYS' ? '' : 'transparent', border: 'none', color: activeTab === 'HOLIDAYS' ? 'white' : 'var(--text-muted)', whiteSpace: 'nowrap' }} onClick={() => setActiveTab('HOLIDAYS')}>
                <CalendarIcon size={16} /> Holidays
              </button>
              <button className={`btn ${activeTab === 'SETTINGS' ? 'btn-primary' : ''}`} style={{ background: activeTab === 'SETTINGS' ? '' : 'transparent', border: 'none', color: activeTab === 'SETTINGS' ? 'white' : 'var(--text-muted)', whiteSpace: 'nowrap' }} onClick={() => setActiveTab('SETTINGS')}>
                <Settings size={16} /> Settings
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'MANAGE_GROUPS' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex-col-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Classes / Departments</h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline w-full-mobile" onClick={() => {
                setNewMemberData(prev => ({ ...prev, password: authUser?.organization?.name || '' }));
                setShowAddMember(true);
              }}>
                <Plus size={16} /> Add New Person
              </button>
              <button className="btn btn-primary w-full-mobile" onClick={() => setShowCreateGroup(true)}>
                <Plus size={16} /> Create Group
              </button>
            </div>
          </div>

          {loadingGroups ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : groups.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
              <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)' }}>No groups found. Create a class or department to start taking attendance.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Type</th>
                    <th style={{ padding: '1rem' }}>Members</th>
                    <th style={{ padding: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(g => (
                    <tr key={g.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{g.name}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', backgroundColor: 'var(--bg-card)', borderRadius: '99px' }}>{g.type}</span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{g._count.members} members</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openManageMembers(g)}>
                            <Users size={14} /> Manage Members
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => { setEditGroup(g); setEditGroupName(g.name); setEditGroupType(g.type); }} title="Rename Group">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => generateInviteLink(g.id)} disabled={generatingLink === g.id}>
                            {generatingLink === g.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LinkIcon size={14} />} Link
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'TAKE_ATTENDANCE' && (
        <div className="flex-col-mobile" style={{ display: 'flex', gap: '2rem' }}>
          {/* Left Sidebar */}
          <div className="w-full-mobile" style={{ flex: 1, minWidth: '300px' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Configuration</h4>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Select Group</label>
                <select
                  className="input-field"
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="" disabled>-- Select Group --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Date</label>
                <div style={{ position: 'relative' }}>
                  <CalendarIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="date"
                    value={date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', boxSizing: 'border-box',
                      backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)',
                      borderRadius: '8px', color: 'var(--text-main)', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  id="notify"
                  checked={notifyAbsent}
                  onChange={(e) => setNotifyAbsent(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="notify" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  Send auto-notification to absentees via messaging module
                </label>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Summary</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Members</span>
                <strong>{groupMembers.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#4ade80' }}>Present</span>
                <strong>{presentCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#facc15' }}>Late</span>
                <strong>{lateCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: '#f87171' }}>Absent</span>
                <strong>{absentCount}</strong>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', opacity: isLocked ? 0.5 : 1 }}
                onClick={handleSaveAttendance}
                disabled={saving || groupMembers.length === 0 || isLocked}
                title={holidayName ? `Attendance cannot be marked. Holiday: ${holidayName}` : isLocked ? "Attendance already submitted. Only admins can modify." : ""}
              >
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Submit Attendance'}
              </button>

              {holidayName && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  <AlertCircle size={16} /> Attendance blocked: <strong>{holidayName}</strong>.
                </div>
              )}

              {saveMsg && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: saveMsg.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', color: saveMsg.type === 'success' ? '#4ade80' : '#f87171' }}>
                  {saveMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {saveMsg.text}
                </div>
              )}
            </div>
          </div>

          {/* Main List */}
          <div className="glass-panel w-full-mobile" style={{ flex: 3, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Roster</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name : 'Select a group'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={handleDownloadReport} disabled={!groupMembers.length}>
                  <Download size={16} /> Download CSV
                </button>
                <button className="btn btn-primary" style={{ fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: isLocked ? 0.5 : 1 }} onClick={() => setTakingAttendanceIndex(0)} disabled={!groupMembers.length || isLocked} title={isLocked ? "Locked" : ""}>
                  <BookOpen size={16} /> Start Attendance
                </button>
              </div>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {loadingAttendance ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : !selectedGroupId ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Please select a group to take attendance.</div>
              ) : groupMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No members in this group.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {groupMembers.map(member => {
                    const status = records[member.id];
                    return (
                      <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-main)' }}>
                            {member.user.firstName.charAt(0)}{member.user.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{member.user.firstName} {member.user.lastName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.user.email}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-dark)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                          <button
                            className="btn"
                            disabled={isLocked}
                            style={{
                              padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
                              backgroundColor: status === 'PRESENT' ? 'rgba(74,222,128,0.2)' : 'transparent',
                              color: status === 'PRESENT' ? '#4ade80' : 'var(--text-muted)',
                              fontWeight: status === 'PRESENT' ? 600 : 400,
                              opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => handleStatusChange(member.id, 'PRESENT')}
                          >
                            <CheckCircle size={16} /> Present
                          </button>

                          <button
                            className="btn"
                            disabled={isLocked}
                            style={{
                              padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
                              backgroundColor: status === 'LATE' ? 'rgba(250,204,21,0.2)' : 'transparent',
                              color: status === 'LATE' ? '#facc15' : 'var(--text-muted)',
                              fontWeight: status === 'LATE' ? 600 : 400,
                              opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => handleStatusChange(member.id, 'LATE')}
                          >
                            <Clock size={16} /> Late
                          </button>

                          <button
                            className="btn"
                            disabled={isLocked}
                            style={{
                              padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
                              backgroundColor: status === 'ABSENT' ? 'rgba(239,68,68,0.2)' : 'transparent',
                              color: status === 'ABSENT' ? '#f87171' : 'var(--text-muted)',
                              fontWeight: status === 'ABSENT' ? 600 : 400,
                              opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => handleStatusChange(member.id, 'ABSENT')}
                          >
                            <XCircle size={16} /> Absent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAKE ATTENDANCE WIZARD MODAL */}
      {takingAttendanceIndex !== null && currentAttendanceMember && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2rem', position: 'relative', textAlign: 'center', backgroundColor: 'var(--bg-darker)', border: '1px solid var(--border-light)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <button onClick={() => setTakingAttendanceIndex(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-dark)', border: '1px solid var(--border-light)', color: 'var(--text-muted)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
              Student {takingAttendanceIndex + 1} of {groupMembers.length}
            </p>

            <div key={currentAttendanceMember.id} className="animate-slide-in">
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#3b82f6', fontSize: '2.5rem', margin: '0 auto 1.5rem auto' }}>
                {currentAttendanceMember.user.firstName.charAt(0)}{currentAttendanceMember.user.lastName?.charAt(0)}
              </div>

              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{currentAttendanceMember.user.firstName} {currentAttendanceMember.user.lastName}</h2>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 2.5rem 0', fontSize: '0.95rem' }}>{currentAttendanceMember.user.email}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <button
                  className="btn"
                  style={{ padding: '1.25rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(74,222,128,0.1)', color: 'var(--text-main)', border: '2px solid rgba(74,222,128,0.5)', borderRadius: '16px', transition: 'all 0.2s ease' }}
                  onClick={() => handleNextAttendance('PRESENT')}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(74,222,128,0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <CheckCircle size={32} color="#4ade80" /> <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Present</span>
                </button>
                <button
                  className="btn"
                  style={{ padding: '1.25rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(250,204,21,0.1)', color: 'var(--text-main)', border: '2px solid rgba(250,204,21,0.5)', borderRadius: '16px', transition: 'all 0.2s ease' }}
                  onClick={() => handleNextAttendance('LATE')}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(250,204,21,0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Clock size={32} color="#facc15" /> <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Late</span>
                </button>
                <button
                  className="btn"
                  style={{ padding: '1.25rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--text-main)', border: '2px solid rgba(239,68,68,0.5)', borderRadius: '16px', transition: 'all 0.2s ease' }}
                  onClick={() => handleNextAttendance('ABSENT')}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(239,68,68,0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <XCircle size={32} color="#f87171" /> <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Absent</span>
                </button>
              </div>
            </div>

            <button className="btn btn-outline" style={{ marginTop: '2rem', width: '100%', padding: '0.85rem', borderRadius: '12px', color: 'var(--text-main)' }} onClick={() => handleNextAttendance(records[currentAttendanceMember.id] || 'PRESENT')}>
              Skip / Leave Current
            </button>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', backgroundColor: 'var(--bg-darker)' }}>
            <button onClick={() => setShowCreateGroup(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Create Group</h3>
            <form onSubmit={handleCreateGroup}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Name</label>
                <input required value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Class 10A, Sales Dept" style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Type</label>
                <select value={newGroupType} onChange={e => setNewGroupType(e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', boxSizing: 'border-box' }}>
                  <option value="CLASS">Class</option>
                  <option value="DEPARTMENT">Department</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>Create Group</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GROUP MODAL */}
      {editGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', backgroundColor: 'var(--bg-darker)' }}>
            <button onClick={() => setEditGroup(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Rename Group</h3>
            <form onSubmit={handleEditGroup}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Name</label>
                <input required value={editGroupName} onChange={e => setEditGroupName(e.target.value)} placeholder="e.g. Class 10A, Sales Dept" style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Type</label>
                <select value={editGroupType} onChange={e => setEditGroupType(e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', boxSizing: 'border-box' }}>
                  <option value="CLASS">Class</option>
                  <option value="DEPARTMENT">Department</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL */}
      {manageGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', height: '650px', maxHeight: '90vh', padding: '2rem', position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-darker)' }}>
            <button onClick={() => setManageGroup(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0' }}>Manage Members: {manageGroup.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Select the staff, students, or employees that belong to this group.</p>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <Search size={16} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
                <input type="text" placeholder="Search members by name or email..." value={memberSearchQuery} onChange={e => setMemberSearchQuery(e.target.value)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }} />
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '1rem', marginBottom: '1.5rem' }}>
              {(() => {
                const filteredMembers = allOrgMembers.filter(m => {
                  const matchesSearch = (m.user.firstName + ' ' + m.user.lastName).toLowerCase().includes(memberSearchQuery.toLowerCase()) || m.user.email.toLowerCase().includes(memberSearchQuery.toLowerCase());
                  if (!matchesSearch) return false;
                  
                  if (manageGroup.type === 'CLASS') {
                    return m.role === 'STUDENT';
                  } else if (manageGroup.type === 'DEPARTMENT') {
                    return m.role !== 'STUDENT';
                  }
                  return true;
                });
                
                const groupedMembers: { [key: string]: typeof allOrgMembers } = {};
                
                filteredMembers.forEach(m => {
                  if (!m.groups || m.groups.length === 0) {
                    if (!groupedMembers['Unassigned']) groupedMembers['Unassigned'] = [];
                    groupedMembers['Unassigned'].push(m);
                  } else {
                    const primaryGroup = m.groups[0].group;
                    const typeStr = primaryGroup.type ? primaryGroup.type.charAt(0).toUpperCase() + primaryGroup.type.slice(1).toLowerCase() : 'Group';
                    const groupKey = `${typeStr}:- ${primaryGroup.name}`;
                    if (!groupedMembers[groupKey]) groupedMembers[groupKey] = [];
                    groupedMembers[groupKey].push(m);
                  }
                });

                const sortedGroups = Object.entries(groupedMembers).sort((a, b) => {
                  if (a[0] === 'Unassigned') return -1;
                  if (b[0] === 'Unassigned') return 1;
                  return a[0].localeCompare(b[0]);
                });

                return sortedGroups.map(([groupKey, members]) => (
                  <div key={groupKey} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      {groupKey}
                    </div>
                    {members.map(m => {
                      const isSelected = manageGroupMembers.includes(m.id);
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderBottom: '1px solid var(--bg-card)', cursor: 'pointer' }} onClick={() => {
                          if (isSelected) {
                            setManageGroupMembers(prev => prev.filter(id => id !== m.id));
                          } else {
                            if (manageGroup.type === 'CLASS' && m.role === 'STUDENT') {
                              const otherClasses = m.groups?.filter(g => g.group.type === 'CLASS' && g.group.name !== manageGroup.name);
                              if (otherClasses && otherClasses.length > 0) {
                                const classNames = otherClasses.map(g => g.group.name).join(', ');
                                const confirmMsg = `${m.user.firstName} is already assigned to ${classNames}. Adding them to ${manageGroup.name} will remove them from their current class. Do you want to continue?`;
                                if (!window.confirm(confirmMsg)) {
                                  return;
                                }
                              }
                            }
                            setManageGroupMembers(prev => [...prev, m.id]);
                          }
                        }}>
                          <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500 }}>
                              {m.user.firstName} {m.user.lastName}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {m.user.email} · {m.role}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setManageGroup(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveMembers} disabled={savingMembers} style={{ minWidth: '120px', display: 'flex', justifyContent: 'center' }}>
                {savingMembers ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Members'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW MEMBER MODAL */}
      {showAddMember && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', backgroundColor: 'var(--bg-darker)' }}>
            <button onClick={() => setShowAddMember(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Add New Person</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setAddingMember(true);
              try {
                const res = await api.post<{ member: any }>('/organizations/members', newMemberData);
                // Refresh list and auto-select
                const allRes = await api.get<{ members: Member[] }>('/organizations/members');
                setAllOrgMembers(allRes.members || []);
                setManageGroupMembers(prev => [...prev, res.member.id]);
                setShowAddMember(false);
                setNewMemberData({ firstName: '', lastName: '', email: '', mobile: '', password: authUser?.organization?.name || '', role: 'STUDENT', groupId: '' });
              } catch (err: any) {
                alert(err.message || 'Failed to add member');
              } finally {
                setAddingMember(false);
              }
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Role</label>
                <select required value={newMemberData.role} onChange={e => setNewMemberData({ ...newMemberData, role: e.target.value })} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', boxSizing: 'border-box' }}>
                  <option value="STUDENT">Student</option>
                  <option value="STAFF">Staff / Employee</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Class / Department (Optional)</label>
                <select value={newMemberData.groupId} onChange={e => setNewMemberData({ ...newMemberData, groupId: e.target.value })} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', boxSizing: 'border-box' }}>
                  <option value="">None (Just add to Organization)</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.type})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Name</label>
                <input required value={newMemberData.firstName} onChange={e => setNewMemberData({ ...newMemberData, firstName: e.target.value, lastName: '' })} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Mobile Number <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Required)</span></label>
                <input required type="tel" value={newMemberData.mobile} onChange={e => setNewMemberData({ ...newMemberData, mobile: e.target.value })} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Optional)</span></label>
                <input type="email" value={newMemberData.email} onChange={e => setNewMemberData({ ...newMemberData, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Temporary Password</label>
                <div style={{ position: 'relative' }}>
                  <input required type={showPassword ? 'text' : 'password'} value={newMemberData.password} onChange={e => setNewMemberData({ ...newMemberData, password: e.target.value })} style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={addingMember} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                {addingMember ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Create Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && isOrgAdmin && <AttendanceSettings />}
      {activeTab === 'HOLIDAYS' && isOrgAdmin && <AttendanceHolidays />}

      {/* GENERATED INVITE LINK MODAL */}
      {generatedInviteLink && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative', backgroundColor: 'var(--bg-darker)' }}>
            <button onClick={() => setGeneratedInviteLink(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '1rem' }}>
                <LinkIcon size={28} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Invite Link Generated!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>This is a single-use link. When a student registers using this link, they will be automatically added to the selected class/department.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.5rem 0.5rem 0.5rem 1rem' }}>
              <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                {generatedInviteLink}
              </div>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => {
                  navigator.clipboard.writeText(generatedInviteLink);
                  alert('Link copied to clipboard!');
                }}
              >
                <Copy size={14} /> Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;
