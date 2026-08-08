import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, BookOpen, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../services/api';

const COLORS = ['#10b981', '#f43f5e']; // Green for Present, Red for Absent

const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [trendPeriod, setTrendPeriod] = useState<string>('7');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch groups for the filter dropdown
    api.get<{ groups: any[] }>('/organizations/groups')
      .then(res => setGroups(res.groups || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (selectedGroupId) query.append('groupId', selectedGroupId);
    if (selectedDate) query.append('date', selectedDate);
    if (trendPeriod) query.append('trend', trendPeriod);

    api.get<any>(`/dashboard?${query.toString()}`)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedGroupId, selectedDate, trendPeriod]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const pieData = [
    { name: 'Present', value: data.presentToday },
    { name: 'Absent', value: data.absentToday }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
      {/* Top Header */}
      <div className="flex-col-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 auto', minWidth: '300px' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Welcome back, {user?.firstName || 'Admin'}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '400px', lineHeight: '1.5' }}>Here's what's happening in your institution today.</p>
        </div>
        {/* Filters */}
        <div className="flex-col-mobile" style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end', flex: '0 0 auto' }}>
          <select
            className="w-full-mobile"
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
          >
            <option value="">All Classes</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <div className="w-full-mobile" style={{ padding: '0.6rem 1rem', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem', padding: 0 }}
            />
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Total Students */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px', color: '#4f46e5' }}>
            <Users size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Total Students</p>
            <h3 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem 0' }}>{data.totalStudents.toLocaleString()}</h3>
            <p style={{ color: '#10b981', margin: 0, fontSize: '0.8rem', fontWeight: 500 }}>↑ +12 this month</p>
          </div>
        </div>

        {/* Present Today */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
            <CheckCircle size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Present Today</p>
            <h3 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem 0' }}>{data.presentToday.toLocaleString()}</h3>
            <p style={{ color: '#10b981', margin: 0, fontSize: '0.8rem', fontWeight: 500 }}>↑ {data.presentPercent}% of total</p>
          </div>
        </div>

        {/* Absent Today */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(244, 63, 94, 0.1)', borderRadius: '12px', color: '#f43f5e' }}>
            <XCircle size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Absent Today</p>
            <h3 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem 0' }}>{data.absentToday.toLocaleString()}</h3>
            <p style={{ color: '#f43f5e', margin: 0, fontSize: '0.8rem', fontWeight: 500 }}>↓ {data.absentPercent}% of total</p>
          </div>
        </div>

        {/* Classes */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', color: '#a855f7' }}>
            <BookOpen size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Classes</p>
            <h3 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem 0' }}>{data.classesToday.toLocaleString()}</h3>
            <p style={{ color: '#a855f7', margin: 0, fontSize: '0.8rem', fontWeight: 500 }}>All ongoing</p>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="flex-col-mobile" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Circular Progress */}
        <div className="glass-panel w-full-mobile" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', flex: 1 }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Today's Attendance Overview</h3>
          <div style={{ height: '240px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{data.presentPercent}%</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Present</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[0] }}></span>
              Present <strong style={{ marginLeft: '0.5rem' }}>{data.presentToday} ({data.presentPercent}%)</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[1] }}></span>
              Absent <strong style={{ marginLeft: '0.5rem' }}>{data.absentToday} ({data.absentPercent}%)</strong>
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="glass-panel w-full-mobile" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Attendance Trend</h3>
            <select
              value={trendPeriod}
              onChange={(e) => setTrendPeriod(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="365">1 Year</option>
            </select>
          </div>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attendanceTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(tick) => `${tick}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}
                  formatter={(value: number) => [`${value}%`, 'Present']}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)' }} activeDot={{ r: 6, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Recent Activities */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Recent Activities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {selectedGroupId ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Activity feed is only available for the entire organization.</p>
            ) : data.recentActivity?.length > 0 ? (
              data.recentActivity.map((activity: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.2rem', borderBottom: idx !== data.recentActivity.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.6rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10b981' }}>
                      <CheckCircle size={18} />
                    </div>
                    <span style={{ fontSize: '0.9rem' }}>{activity.action}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No recent activities found.</p>
            )}
          </div>
        </div>

        {/* Top Absent Students */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Top Absent Students</h3>
            <span
              onClick={() => navigate(`/dashboard/top-absent?groupId=${selectedGroupId}&date=${selectedDate}`)}
              style={{ color: '#3b82f6', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}
            >
              View All
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {data.topAbsentStudents?.length > 0 ? (
              data.topAbsentStudents.map((student: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.2rem', borderBottom: idx !== data.topAbsentStudents.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.1rem 0', fontSize: '0.95rem', fontWeight: 500 }}>{student.name}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.group}</p>
                    </div>
                  </div>
                  <span style={{ color: '#f43f5e', fontWeight: 600, fontSize: '0.95rem' }}>
                    {student.percentage}%
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No absent students this month.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
