import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';

interface SystemLog {
  id: string;
  endpoint: string;
  method: string;
  durationMs: number;
  statusCode: number;
  errorMessage: string | null;
  organizationId: string | null;
  userId: string | null;
  createdAt: string;
}

export function SystemHealthDashboard() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [metrics, setMetrics] = useState({ totalErrorsToday: 0, slowRequestsToday: 0 });
  const [loading, setLoading] = useState(true);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ logs: SystemLog[], metrics: any }>('/platform/health');
      setLogs(res.logs || []);
      setMetrics(res.metrics || { totalErrorsToday: 0, slowRequestsToday: 0 });
    } catch (error) {
      console.error('Failed to load health data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">System Health</h1>
          <p className="page-subtitle">Monitor API performance and errors across all tenants.</p>
        </div>
        <button className="btn btn-outline" onClick={fetchHealthData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics.totalErrorsToday}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Server Errors (500) Today</div>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics.slowRequestsToday}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Slow Requests ({'>'}1s) Today</div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} /> Recent Logs
          </h3>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Tenant ID</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No performance issues logged recently. Your system is running smoothly!
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.method} {log.endpoint}</div>
                    </td>
                    <td>
                      <span className={`badge ${log.statusCode >= 500 ? 'badge-danger' : log.statusCode >= 400 ? 'badge-warning' : 'badge-success'}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td style={{ color: log.durationMs >= 1000 ? '#ef4444' : 'inherit', fontWeight: log.durationMs >= 1000 ? 600 : 400 }}>
                      {log.durationMs}ms
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {log.organizationId ? log.organizationId.substring(0,8) + '...' : 'System'}
                    </td>
                    <td style={{ color: '#ef4444', fontSize: '0.85rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.errorMessage || ''}>
                      {log.errorMessage || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
