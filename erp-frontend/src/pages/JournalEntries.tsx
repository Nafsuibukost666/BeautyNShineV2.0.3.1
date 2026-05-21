import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function JournalEntries() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { fetchJournals(); }, [page, dateFrom, dateTo]);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const params: any = { page, per_page: 20 };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/journals', { params });
      setJournals(res.data?.data?.items || res.data?.data || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data jurnal');
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (id: number) => {
    try {
      const res = await api.get(`/journals/${id}`);
      setSelectedJournal(res.data?.data || res.data);
      setShowDetail(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memuat detail jurnal');
    }
  };

  const totalPages = Math.ceil(total / 20);

  const formatRupiah = (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

  const calcDebitTotal = (lines: any[]) =>
    lines?.reduce((sum: number, l: any) => sum + (parseInt(l.debit_amount) || 0), 0) || 0;

  const calcCreditTotal = (lines: any[]) =>
    lines?.reduce((sum: number, l: any) => sum + (parseInt(l.credit_amount) || 0), 0) || 0;

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Jurnal Entri</h1>
        <button className="btn btn-primary" onClick={fetchJournals} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} style={{ maxWidth: 180 }} placeholder="Dari tanggal" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} style={{ maxWidth: 180 }} placeholder="Sampai tanggal" />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Kode Entri</th>
                <th>Tanggal</th>
                <th>Deskripsi</th>
                <th>Total Debit</th>
                <th>Total Kredit</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {journals.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada data jurnal</td></tr>
              ) : (
                journals.map((j: any) => {
                  const isExpanded = expandedId === j.id;
                  const debitTotal = calcDebitTotal(j.lines);
                  const creditTotal = calcCreditTotal(j.lines);
                  return (
                    <React.Fragment key={j.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : j.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ color: '#a8a4a0', fontSize: 12 }}>
                          {isExpanded ? '▼' : '▶'}
                        </td>
                        <td style={{ color: '#e8a87c', fontWeight: 600 }}>{j.entry_code || `#${j.id}`}</td>
                        <td>{j.entry_date ? new Date(j.entry_date).toLocaleDateString('id-ID') : '-'}</td>
                        <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {j.description || '-'}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatRupiah(debitTotal)}</td>
                        <td style={{ fontWeight: 600 }}>{formatRupiah(creditTotal)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => { e.stopPropagation(); viewDetail(j.id); }}
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                      {isExpanded && j.lines && j.lines.length > 0 && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <div style={{
                              background: '#24243a',
                              padding: '12px 24px',
                              borderBottom: '1px solid #2e2e3e',
                            }}>
                              <table style={{ margin: 0, background: 'transparent' }}>
                                <thead>
                                  <tr>
                                    <th style={{ color: '#a8a4a0', fontSize: 11, padding: '4px 8px', border: 'none' }}>Kode Akun</th>
                                    <th style={{ color: '#a8a4a0', fontSize: 11, padding: '4px 8px', border: 'none' }}>Nama Akun</th>
                                    <th style={{ color: '#a8a4a0', fontSize: 11, padding: '4px 8px', border: 'none', textAlign: 'right' }}>Debit</th>
                                    <th style={{ color: '#a8a4a0', fontSize: 11, padding: '4px 8px', border: 'none', textAlign: 'right' }}>Kredit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {j.lines.map((line: any, idx: number) => (
                                    <tr key={line.id || idx}>
                                      <td style={{ color: '#e8a87c', fontSize: 13, padding: '6px 8px', border: 'none' }}>
                                        {line.account_code || '-'}
                                      </td>
                                      <td style={{ color: '#f0ece4', fontSize: 13, padding: '6px 8px', border: 'none' }}>
                                        {line.account_name || '-'}
                                      </td>
                                      <td style={{ color: '#4caf7d', fontSize: 13, padding: '6px 8px', border: 'none', textAlign: 'right' }}>
                                        {line.debit_amount ? formatRupiah(line.debit_amount) : '-'}
                                      </td>
                                      <td style={{ color: '#e06c6c', fontSize: 13, padding: '6px 8px', border: 'none', textAlign: 'right' }}>
                                        {line.credit_amount ? formatRupiah(line.credit_amount) : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</button>
          <span style={{ color: '#a8a4a0', padding: '4px 12px' }}>Halaman {page} dari {totalPages}</span>
          <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Selanjutnya</button>
        </div>
      )}

      {showDetail && selectedJournal && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <h2>Detail Jurnal</h2>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={{ color: '#a8a4a0' }}>Kode Entri</label><div style={{ color: '#e8a87c', fontWeight: 600 }}>{selectedJournal.entry_code || '-'}</div></div>
                <div><label style={{ color: '#a8a4a0' }}>Tanggal</label><div>{selectedJournal.entry_date ? new Date(selectedJournal.entry_date).toLocaleDateString('id-ID') : '-'}</div></div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ color: '#a8a4a0' }}>Deskripsi</label>
                <div>{selectedJournal.description || '-'}</div>
              </div>
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#f0ece4' }}>Detail Baris</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Kode Akun</th>
                    <th>Nama Akun</th>
                    <th>Debit</th>
                    <th>Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedJournal.lines?.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6b6865', padding: 16 }}>Tidak ada baris jurnal</td></tr>
                  ) : (
                    selectedJournal.lines?.map((line: any, idx: number) => (
                      <tr key={line.id || idx}>
                        <td style={{ color: '#e8a87c' }}>{line.account_code || '-'}</td>
                        <td>{line.account_name || '-'}</td>
                        <td style={{ color: '#4caf7d' }}>{(line.debit_amount || 0) > 0 ? formatRupiah(line.debit_amount) : '-'}</td>
                        <td style={{ color: '#e06c6c' }}>{(line.credit_amount || 0) > 0 ? formatRupiah(line.credit_amount) : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
