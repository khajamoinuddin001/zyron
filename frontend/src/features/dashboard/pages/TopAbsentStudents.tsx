import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';

const TopAbsentStudents: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const groupId = searchParams.get('groupId') || '';
  const dateStr = searchParams.get('date') || '';

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (groupId) query.append('groupId', groupId);
    if (dateStr) query.append('date', dateStr);
    query.append('page', currentPage.toString());
    query.append('limit', '50');

    api.get<{ students: any[], pagination: any }>(`/dashboard/top-absent?${query.toString()}`)
      .then(res => {
        setStudents(res.students || []);
        if (res.pagination) setPagination(res.pagination);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [groupId, dateStr, currentPage]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>
      <button 
        onClick={() => navigate(-1)} 
        className="btn btn-outline" 
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', paddingLeft: 0 }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex-col-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Top Absent Students</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              Showing full list of absent students for the month up to {dateStr || new Date().toISOString().split('T')[0]}.
            </p>
          </div>
          <div style={{ position: 'relative' }} className="w-full-mobile">
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full-mobile"
              style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'transparent', color: 'var(--text-main)', width: '250px', outline: 'none' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <p>No absent students found matching your criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', fontWeight: 500 }}>Student Name</th>
                  <th style={{ padding: '1rem', fontWeight: 500 }}>Class / Group</th>
                  <th style={{ padding: '1rem', fontWeight: 500 }}>Absences</th>
                  <th style={{ padding: '1rem', fontWeight: 500 }}>Working Days</th>
                  <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>Absent %</th>
                  <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>Present %</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 500 }}>{student.name}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{student.group}</td>
                    <td style={{ padding: '1rem', color: '#f43f5e', fontWeight: 500 }}>{student.absentCount} Days</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{student.workingDays} Days</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <span style={{ display: 'inline-block', padding: '0.3rem 0.6rem', backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                        {student.percentage}%
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <span style={{ display: 'inline-block', padding: '0.3rem 0.6rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                        {100 - student.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopAbsentStudents;
