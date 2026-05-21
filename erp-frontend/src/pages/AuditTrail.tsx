import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function AuditTrail() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [showDetail, setShowDetail] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [tableFilter, actionFilter, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = { page, per_page: 20 };
      if (tableFilter) params.table_name = tableFilter;
      if (actionFilter) params.action = actionFilter;
      const res = await api.get('/audit/logs', { params });
      setLogs(res.data?.data?.items || res.data?.data || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat log audit');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/audit/stats');
      setStats(res.data?.data);
    } catch (_) {
      // stats are optional
    }
  };

  const handleRefresh = () => {
    fetchLogs();
    fetchStats();
  };

  const totalPages = Math.ceil(total / 20);

  const filteredLogs = search
    ? logs.filter(
        (l) =>
          l.summary?.toLowerCase().includes(search.toLowerCase()) ||
          l.performed_by?.toLowerCase().includes(search.toLowerCase()) ||
          l.table_name?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const formatDateTime = (d: string) =>
    d ? new Date(d).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : '-';

  const actionBadgeClass = (action: string) => {
    const map: Record<string, string> = {
      CREATE: 'completed',
      POST: 'completed',
      UPDATE: 'pending',
      DELETE: 'cancelled',
      LOCK: 'pending',
      UNLOCK: 'completed',
      CLOSE: 'cancelled',
      REOPEN: 'completed',
    };
    return map[action?.toUpperCase()] || 'pending';
  };

  if (loading && logs.length === 0) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  const tableNames = [...new Set(logs.map((l) => l.table_name).filter(Boolean))] as string[];
  const actionNames = [...new Set(logs.map((l) => l.action).filter(Boolean))] as string[];

  return (
    <div>
      <div className="page-header">
        <h1>Audit Trail</h1>
        <button className="btn btn-primary" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {stats && (
        <div className="stat-cards" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-label">Total Log</div>
            <div className="stat-value">{stats.total_logs || 0}</div>
            <div className="stat-sub">Seluruh aktivitas</div>
          </div>
          {stats.by_action && Object.entries(stats.by_action).slice(0, 5).map(([action, count]) => (
            <div className="stat-card" key={action}>
              <div className="stat-label">{action}</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{count as number}</div>
              <div className="stat-sub">Aksi</div>
            </div>
          ))}
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Cari ringkasan, pelaku, atau tabel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={tableFilter} onChange={(e) => { setTableFilter(e.target.value); setPage(1); }} style={{ maxWidth: 200 }}>
          <option value="">Semua Tabel</option>
          {tableNames.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} style={{ maxWidth: 180 }}>
          <option value="">Semua Aksi</option>
          {actionNames.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Tabel</th>
                <th>Aksi</th>
                <th>Ringkasan</th>
                <th>Pelaku</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada log audit</td></tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ color: '#a8a4a0', fontSize: 12 }}>
                      {formatDateTime(log.performed_at)}
                    </td>
                    <td>
                      <span style={{ color: '#e8a87c', fontWeight: 600, fontSize: 13 }}>
                        {log.table_name || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${actionBadgeClass(log.action)}`}>
                        {log.action || '-'}
                      </span>
                    </td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.summary || '-'}
                    </td>
                    <td style={{ color: '#f0ece4' }}>{log.performed_by || '-'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setShowDetail(log)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</button>
          <span style={{ color: '#a8a4a0', padding: '4px 12px' }}>Halaman {page} dari {totalPages}</span>
          <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Selanjutnya</button>
        </div>
      )}

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <h2>Detail Log Audit</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ color: '#a8a4a0', fontSize: 12 }}>ID Log</label>
                <div style={{ fontWeight: 600 }}>#{showDetail.id}</div>
              </div>
              <div>
                <label style={{ color: '#a8a4a0', fontSize: 12 }}>Waktu</label>
                <div>{formatDateTime(showDetail.performed_at)}</div>
              </div>
              <div>
                <label style={{ color: '#a8a4a0', fontSize: 12 }}>Tabel</label>
                <div style={{ color: '#e8a87c', fontWeight: 600 }}>{showDetail.table_name || '-'}</div>
              </div>
              <div>
                <label style={{ color: '#a8a4a0', fontSize: 12 }}>Record ID</label>
                <div>{showDetail.record_id || '-'}</div>
              </div>
              <div>
                <label style={{ color: '#a8a4a0', fontSize: 12 }}>Aksi</label>
                <div><span className={`status-badge ${actionBadgeClass(showDetail.action)}`}>{showDetail.action || '-'}</span></div>
              </div>
              <div>
                <label style={{ color: '#a8a4a0', fontSize: 12 }}>Pelaku</label>
                <div>{showDetail.performed_by || '-'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#a8a4a0', fontSize: 12 }}>Ringkasan</label>
              <div style={{ background: '#24243a', borderRadius: 8, padding: 12, marginTop: 4, border: '1px solid #2e2e3e', color: '#f0ece4' }}>
                {showDetail.summary || 'Tidak ada ringkasan'}
              </div>
            </div>

            {showDetail.old_values && Object.keys(showDetail.old_values).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#a8a4a0', fontSize: 12 }}>Nilai Lama</label>
                <pre style={{
                  background: '#24243a',
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 4,
                  border: '1px solid #2e2e3e',
                  color: '#e06c6c',
                  fontSize: 12,
                  overflowX: 'auto',
                  maxHeight: 200,
                }}>
                  {JSON.stringify(showDetail.old_values, null, 2)}
                </pre>
              </div>
            )}

            {showDetail.new_values && Object.keys(showDetail.new_values).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#a8a4a0', fontSize: 12 }}>Nilai Baru</label>
                <pre style={{
                  background: '#24243a',
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 4,
                  border: '1px solid #2e2e3e',
                  color: '#4caf7d',
                  fontSize: 12,
                  overflowX: 'auto',
                  maxHeight: 200,
                }}>
                  {JSON.stringify(showDetail.new_values, null, 2)}
                </pre>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
