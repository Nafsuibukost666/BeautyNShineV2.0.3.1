import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function StockOpname() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: '',
    opname_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Detail state
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Add item modal
  const [showAddItem, setShowAddItem] = useState(false);
  const [addItemForm, setAddItemForm] = useState({
    product_id: '',
    system_qty: '',
    physical_qty: '',
    notes: '',
  });
  const [products, setProducts] = useState<any[]>([]);

  const perPage = 20;

  useEffect(() => { fetchSessions(); }, [page, statusFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { page, per_page: perPage };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/inventory/opname', { params });
      setSessions(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat opname');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.code) {
      alert('Kode opname wajib diisi');
      return;
    }
    try {
      setSaving(true);
      await api.post('/inventory/opname', {
        ...createForm,
        opname_date: createForm.opname_date,
      });
      setShowCreate(false);
      setCreateForm({ code: '', opname_date: new Date().toISOString().slice(0, 10), notes: '' });
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat opname');
    } finally {
      setSaving(false);
    }
  };

  const viewDetail = async (session: any) => {
    try {
      setDetailLoading(true);
      setSelectedSession(session);
      const res = await api.get(`/inventory/opname/${session.id}`);
      setDetailItems(res.data?.data?.items || []);
      setShowDetail(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memuat detail opname');
    } finally {
      setDetailLoading(false);
    }
  };

  const updatePhysicalQty = async (itemId: number, physicalQty: string) => {
    if (!selectedSession) return;
    try {
      await api.put(`/inventory/opname/${selectedSession.id}/items/${itemId}`, {
        physical_qty: parseInt(physicalQty) || 0,
      });
      const res = await api.get(`/inventory/opname/${selectedSession.id}`);
      setDetailItems(res.data?.data?.items || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengupdate qty fisik');
    }
  };

  const addItem = async () => {
    if (!selectedSession || !addItemForm.product_id || !addItemForm.physical_qty) {
      alert('Pilih produk dan isi qty fisik');
      return;
    }
    try {
      await api.post(`/inventory/opname/${selectedSession.id}/items`, {
        product_id: parseInt(addItemForm.product_id),
        system_qty: parseInt(addItemForm.system_qty) || 0,
        physical_qty: parseInt(addItemForm.physical_qty) || 0,
        notes: addItemForm.notes,
      });
      setShowAddItem(false);
      setAddItemForm({ product_id: '', system_qty: '', physical_qty: '', notes: '' });
      const res = await api.get(`/inventory/opname/${selectedSession.id}`);
      setDetailItems(res.data?.data?.items || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambah item');
    }
  };

  const completeOpname = async () => {
    if (!selectedSession) return;
    if (!confirm('Finalisasi opname ini? Mutasi stok akan dibuat berdasarkan selisih.')) return;
    try {
      await api.post(`/inventory/opname/${selectedSession.id}/complete`);
      setShowDetail(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal finalisasi opname');
    }
  };

  const openAddItem = async () => {
    try {
      const res = await api.get('/master/products', { params: { per_page: 200 } });
      setProducts(res.data?.data?.items || []);
    } catch (_) {}
    setAddItemForm({ product_id: '', system_qty: '', physical_qty: '', notes: '' });
    setShowAddItem(true);
  };

  const totalPages = Math.ceil(total / perPage);
  const fmt = (v: any) => `Rp ${(parseInt(v) || 0).toLocaleString('id-ID')}`;

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { DRAFT: 'Draft', IN_PROGRESS: 'Berjalan', COMPLETED: 'Selesai' };
    return map[s] || s;
  };

  const statusClass = (s: string) => {
    const map: Record<string, string> = { DRAFT: 'pending', IN_PROGRESS: 'pending', COMPLETED: 'completed' };
    return map[s] || 'pending';
  };

  if (loading && sessions.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Opname Stok</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Buat Opname Baru</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="IN_PROGRESS">Berjalan</option>
          <option value="COMPLETED">Selesai</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Tanggal Opname</th>
                <th>Status</th>
                <th>Total Item</th>
                <th>Total Selisih</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada sesi opname</td></tr>
              ) : (
                sessions.map((s: any) => (
                  <tr key={s.id}>
                    <td style={{ color: '#e8a87c', fontWeight: 600, fontFamily: 'monospace' }}>{s.code}</td>
                    <td>{s.opname_date ? new Date(s.opname_date).toLocaleDateString('id-ID') : '-'}</td>
                    <td><span className={`status-badge ${statusClass(s.status)}`}>{statusLabel(s.status)}</span></td>
                    <td>{s.total_items ?? '-'}</td>
                    <td style={{ fontWeight: 600, color: (s.total_difference || 0) !== 0 ? '#e06c6c' : '#4caf7d' }}>
                      {s.total_difference ?? 0}
                    </td>
                    <td style={{ color: '#a8a4a0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.notes || '-'}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => viewDetail(s)}>
                        {s.status === 'COMPLETED' ? 'Lihat' : 'Kelola'}
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</button>
          <span style={{ color: '#a8a4a0', padding: '4px 12px' }}>Halaman {page} dari {totalPages}</span>
          <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Selanjutnya</button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Buat Opname Baru</h2>
            <div className="form-group">
              <label>Kode Opname *</label>
              <input type="text" value={createForm.code} onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })} placeholder="OPNAME-2026-05" />
            </div>
            <div className="form-group">
              <label>Tanggal Opname</label>
              <input type="date" value={createForm.opname_date} onChange={(e) => setCreateForm({ ...createForm, opname_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Catatan</label>
              <textarea value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} placeholder="Opsional" rows={2} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Buat Opname'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedSession && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <h2>Opname: {selectedSession.code}</h2>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={{ color: '#a8a4a0' }}>Status</label><div><span className={`status-badge ${statusClass(selectedSession.status)}`}>{statusLabel(selectedSession.status)}</span></div></div>
                <div><label style={{ color: '#a8a4a0' }}>Tanggal</label><div>{selectedSession.opname_date ? new Date(selectedSession.opname_date).toLocaleDateString('id-ID') : '-'}</div></div>
              </div>
              {selectedSession.notes && (
                <div style={{ marginTop: 8 }}><label style={{ color: '#a8a4a0' }}>Catatan</label><div>{selectedSession.notes}</div></div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f0ece4', margin: 0 }}>Item Opname</h3>
              {selectedSession.status !== 'COMPLETED' && (
                <button className="btn btn-sm btn-primary" onClick={openAddItem}>+ Tambah Item</button>
              )}
            </div>

            {detailLoading ? (
              <div className="loading-spinner" style={{ padding: 20 }}><div className="spinner" /></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>SKU</th>
                      <th>Qty Sistem</th>
                      <th>Qty Fisik</th>
                      <th>Selisih</th>
                      <th>Harga Satuan</th>
                      <th>Nilai Selisih</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: '#6b6865', padding: 16 }}>Belum ada item. Tambahkan item untuk mulai opname.</td></tr>
                    ) : (
                      detailItems.map((item: any) => {
                        const diff = (item.physical_qty ?? 0) - (item.system_qty ?? 0);
                        return (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 600 }}>{item.product?.name || `Produk #${item.product_id}`}</td>
                            <td style={{ color: '#a8a4a0', fontFamily: 'monospace', fontSize: 13 }}>{item.product?.sku || '-'}</td>
                            <td>{item.system_qty ?? 0}</td>
                            <td>
                              {selectedSession.status === 'COMPLETED' ? (
                                item.physical_qty ?? 0
                              ) : (
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={item.physical_qty ?? 0}
                                  onBlur={(e) => {
                                    if (parseInt(e.target.value) !== item.physical_qty) {
                                      updatePhysicalQty(item.id, e.target.value);
                                    }
                                  }}
                                  style={{
                                    width: 80,
                                    padding: '4px 8px',
                                    background: '#2a2a3e',
                                    border: '1px solid #2e2e3e',
                                    borderRadius: 4,
                                    color: '#f0ece4',
                                    fontSize: 13,
                                  }}
                                />
                              )}
                            </td>
                            <td style={{
                              fontWeight: 600,
                              color: diff === 0 ? '#4caf7d' : diff > 0 ? '#e8a87c' : '#e06c6c',
                            }}>
                              {diff > 0 ? `+${diff}` : diff}
                            </td>
                            <td>{fmt(item.unit_cost)}</td>
                            <td style={{ fontWeight: 600, color: '#e06c6c' }}>{fmt(item.difference_value)}</td>
                            <td style={{ color: '#a8a4a0', fontSize: 12 }}>{item.notes || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 16 }}>
              {selectedSession.status !== 'COMPLETED' && (
                <button className="btn btn-success" onClick={completeOpname} style={{ marginRight: 'auto' }}>
                  ✓ Selesai (Finalisasi)
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Tambah Item Opname</h2>
            <div className="form-group">
              <label>Pilih Produk *</label>
              <select value={addItemForm.product_id} onChange={(e) => setAddItemForm({ ...addItemForm, product_id: e.target.value })}>
                <option value="">-- Pilih Produk --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku || p.id})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Qty Sistem</label>
              <input type="number" min={0} value={addItemForm.system_qty} onChange={(e) => setAddItemForm({ ...addItemForm, system_qty: e.target.value })} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Qty Fisik *</label>
              <input type="number" min={0} value={addItemForm.physical_qty} onChange={(e) => setAddItemForm({ ...addItemForm, physical_qty: e.target.value })} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Catatan</label>
              <textarea value={addItemForm.notes} onChange={(e) => setAddItemForm({ ...addItemForm, notes: e.target.value })} placeholder="Opsional" rows={2} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddItem(false)}>Batal</button>
              <button className="btn btn-primary" onClick={addItem}>Tambah</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
