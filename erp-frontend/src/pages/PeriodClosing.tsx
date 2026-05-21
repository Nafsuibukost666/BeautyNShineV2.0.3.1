import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function PeriodClosing() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closePeriodId, setClosePeriodId] = useState<number | null>(null);
  const [closeNotes, setCloseNotes] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPeriodId, setLogsPeriodId] = useState<number | null>(null);

  useEffect(() => { fetchPeriods(); }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const res = await api.get('/master/periods');
      setPeriods(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data periode');
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async (id: number) => {
    try {
      setActionLoading(id);
      await api.post(`/master/periods/${id}/lock`);
      fetchPeriods();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengunci periode');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlock = async (id: number) => {
    if (!confirm('Yakin ingin membuka kunci periode ini?')) return;
    try {
      setActionLoading(id);
      await api.post(`/master/periods/${id}/unlock`);
      fetchPeriods();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuka kunci periode');
    } finally {
      setActionLoading(null);
    }
  };

  const openCloseModal = (id: number) => {
    setClosePeriodId(id);
    setCloseNotes('');
    setShowCloseModal(true);
  };

  const handleClose = async () => {
    if (!closePeriodId) return;
    try {
      setActionLoading(closePeriodId);
      await api.post(`/master/periods/${closePeriodId}/close`, { notes: closeNotes });
      setShowCloseModal(false);
      setClosePeriodId(null);
      setCloseNotes('');
      fetchPeriods();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menutup periode');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopen = async (id: number) => {
    if (!confirm('Yakin ingin membuka kembali periode yang sudah ditutup?')) return;
    try {
      setActionLoading(id);
      await api.post(`/master/periods/${id}/reopen`);
      fetchPeriods();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuka periode');
    } finally {
      setActionLoading(null);
    }
  };

  const viewLogs = async (id: number) => {
    try {
      setLogsLoading(true);
      setLogsPeriodId(id);
      const res = await api.get(`/master/periods/${id}/close-logs`);
      setLogs(res.data?.data || []);
      setShowLogs(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memuat log penutupan');
    } finally {
      setLogsLoading(false);
    }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

  const statusCard = (period: any) => {
    if (period.is_closed) return { label: 'Ditutup', cls: 'completed' };
    if (period.is_locked) return { label: 'Terkunci', cls: 'pending' };
    return { label: 'Aktif', cls: 'cancelled' };
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Periode Akuntansi</h1>
        <button className="btn btn-primary" onClick={fetchPeriods} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {periods.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: '#6b6865' }}>
            Tidak ada periode ditemukan
          </div>
        ) : (
          periods.map((period: any) => {
            const status = statusCard(period);
            return (
              <div className="card" key={period.id} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f0ece4', margin: 0 }}>{period.name || period.code}</h3>
                    <span style={{ color: '#a8a4a0', fontSize: 12 }}>
                      {formatDate(period.start_date)} — {formatDate(period.end_date)}
                    </span>
                  </div>
                  <span className={`status-badge ${status.cls}`}>{status.label}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16, fontSize: 13, color: '#a8a4a0' }}>
                  {period.is_locked && (
                    <span>Dikunci oleh: <strong style={{ color: '#f0ece4' }}>{period.locked_by || '-'}</strong></span>
                  )}
                  {period.locked_at && (
                    <span>Waktu dikunci: <strong style={{ color: '#f0ece4' }}>{new Date(period.locked_at).toLocaleString('id-ID')}</strong></span>
                  )}
                  {period.is_closed && (
                    <>
                      <span>Ditutup oleh: <strong style={{ color: '#f0ece4' }}>{period.closed_by || '-'}</strong></span>
                      {period.closed_at && (
                        <span>Waktu ditutup: <strong style={{ color: '#f0ece4' }}>{new Date(period.closed_at).toLocaleString('id-ID')}</strong></span>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {!period.is_locked && !period.is_closed && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleLock(period.id)}
                      disabled={actionLoading === period.id}
                    >
                      {actionLoading === period.id ? 'Memproses...' : '🔒 Kunci'}
                    </button>
                  )}
                  {period.is_locked && !period.is_closed && (
                    <>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleUnlock(period.id)}
                        disabled={actionLoading === period.id}
                      >
                        {actionLoading === period.id ? 'Memproses...' : '🔓 Buka Kunci'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => openCloseModal(period.id)}
                        disabled={actionLoading === period.id}
                      >
                        {actionLoading === period.id ? 'Memproses...' : '⛔ Tutup'}
                      </button>
                    </>
                  )}
                  {period.is_closed && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleReopen(period.id)}
                      disabled={actionLoading === period.id}
                    >
                      {actionLoading === period.id ? 'Memproses...' : '🔄 Buka Kembali'}
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => viewLogs(period.id)}
                  >
                    📋 Log
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCloseModal && (
        <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Tutup Periode</h2>
            <p style={{ color: '#a8a4a0', fontSize: 13, marginBottom: 16 }}>
              Apakah Anda yakin ingin menutup periode ini? Tindakan ini akan mengunci semua transaksi pada periode ini.
            </p>
            <div className="form-group">
              <label>Catatan Penutupan</label>
              <textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Alasan penutupan periode..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCloseModal(false)}>Batal</button>
              <button className="btn btn-danger" onClick={handleClose} disabled={actionLoading === closePeriodId}>
                {actionLoading === closePeriodId ? 'Memproses...' : 'Ya, Tutup Periode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h2>Log Penutupan Periode</h2>
            {logsLoading ? (
              <div className="loading-spinner" style={{ padding: 24 }}><div className="spinner" /><span>Memuat log...</span></div>
            ) : logs.length === 0 ? (
              <p style={{ color: '#6b6865', textAlign: 'center', padding: 24 }}>Belum ada log penutupan untuk periode ini</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {logs.map((log: any) => (
                  <div key={log.id} style={{
                    background: '#24243a',
                    borderRadius: 8,
                    padding: 12,
                    border: '1px solid #2e2e3e',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ color: '#e8a87c' }}>{log.closed_by || '-'}</strong>
                      <span style={{ color: '#a8a4a0', fontSize: 12 }}>
                        {log.closed_at ? new Date(log.closed_at).toLocaleString('id-ID') : '-'}
                      </span>
                    </div>
                    <div style={{ color: '#f0ece4', fontSize: 13 }}>{log.notes || 'Tidak ada catatan'}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLogs(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
