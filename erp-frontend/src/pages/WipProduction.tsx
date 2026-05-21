import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function WipProduction() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // Detail
  const [selectedWip, setSelectedWip] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create form
  const [form, setForm] = useState({
    product_id: '',
    batch_number: '',
    planned_qty: '',
    notes: '',
  });
  const [formMaterials, setFormMaterials] = useState<any[]>([
    { product_id: '', planned_qty: '', unit_cost: '' },
  ]);

  const perPage = 20;

  useEffect(() => { fetchItems(); }, [page, tab]);
  useEffect(() => { if (showCreate) fetchProducts(); }, [showCreate]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { page, per_page: perPage };
      if (tab !== 'ALL') params.status = tab;
      const res = await api.get('/inventory/wip', { params });
      setItems(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data WIP');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/master/products', { params: { per_page: 200 } });
      setProducts(res.data?.data?.items || []);
    } catch (_) {}
  };

  const viewDetail = async (wip: any) => {
    try {
      setDetailLoading(true);
      setSelectedWip(wip);
      const res = await api.get(`/inventory/wip/${wip.id}`);
      setSelectedWip(res.data?.data || res.data);
      setShowDetail(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memuat detail WIP');
    } finally {
      setDetailLoading(false);
    }
  };

  const addMaterial = () => {
    setFormMaterials([...formMaterials, { product_id: '', planned_qty: '', unit_cost: '' }]);
  };

  const removeMaterial = (idx: number) => {
    if (formMaterials.length <= 1) return;
    setFormMaterials(formMaterials.filter((_, i) => i !== idx));
  };

  const updateMaterial = (idx: number, field: string, value: string) => {
    const updated = [...formMaterials];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormMaterials(updated);
  };

  const handleCreate = async () => {
    if (!form.product_id || !form.batch_number || !form.planned_qty) {
      alert('Lengkapi produk, batch number, dan qty rencana');
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        product_id: parseInt(form.product_id),
        batch_number: form.batch_number,
        planned_qty: parseInt(form.planned_qty),
        notes: form.notes,
        materials: formMaterials
          .filter(m => m.product_id && m.planned_qty)
          .map(m => ({
            product_id: parseInt(m.product_id),
            planned_qty: parseInt(m.planned_qty),
            unit_cost: parseInt(m.unit_cost) || 0,
          })),
      };
      await api.post('/inventory/wip', payload);
      setShowCreate(false);
      setForm({ product_id: '', batch_number: '', planned_qty: '', notes: '' });
      setFormMaterials([{ product_id: '', planned_qty: '', unit_cost: '' }]);
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat WIP');
    } finally {
      setSaving(false);
    }
  };

  const wipAction = async (id: number, action: 'start' | 'complete' | 'cancel') => {
    const labels: Record<string, string> = { start: 'mulai', complete: 'selesaikan', cancel: 'batalkan' };
    if (!confirm(`Yakin akan ${labels[action]} WIP ini?`)) return;
    try {
      const endpoint = `/inventory/wip/${id}/${action}`;
      await api.post(endpoint);
      setShowDetail(false);
      setSelectedWip(null);
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.message || `Gagal ${labels[action]} WIP`);
    }
  };

  const totalPages = Math.ceil(total / perPage);
  const fmt = (v: any) => `Rp ${(parseInt(v) || 0).toLocaleString('id-ID')}`;

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { PLANNED: 'Direncanakan', IN_PROGRESS: 'Produksi', COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan' };
    return map[s] || s;
  };

  const statusClass = (s: string) => {
    const map: Record<string, string> = { PLANNED: 'pending', IN_PROGRESS: 'pending', COMPLETED: 'completed', CANCELLED: 'cancelled' };
    return map[s] || 'pending';
  };

  const tabs = [
    { key: 'ALL', label: 'Semua' },
    { key: 'PLANNED', label: 'Direncanakan' },
    { key: 'IN_PROGRESS', label: 'Produksi' },
    { key: 'COMPLETED', label: 'Selesai' },
  ];

  if (loading && items.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>WIP / Produksi</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Buat WIP</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setTab(t.key); setPage(1); }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Produk</th>
                <th>Batch</th>
                <th>Qty Rencana</th>
                <th>Qty Aktual</th>
                <th>Status</th>
                <th>Tanggal Mulai</th>
                <th>Total Biaya</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada data WIP</td></tr>
              ) : (
                items.map((w: any) => (
                  <tr key={w.id}>
                    <td style={{ color: '#e8a87c', fontWeight: 600, fontFamily: 'monospace' }}>{w.code || `#${w.id}`}</td>
                    <td style={{ fontWeight: 600 }}>{w.product?.name || '-'}</td>
                    <td style={{ color: '#a8a4a0', fontFamily: 'monospace', fontSize: 13 }}>{w.batch_number || '-'}</td>
                    <td>{w.planned_qty ?? '-'}</td>
                    <td style={{ fontWeight: 600 }}>{w.actual_qty ?? '-'}</td>
                    <td><span className={`status-badge ${statusClass(w.status)}`}>{statusLabel(w.status)}</span></td>
                    <td>{w.start_date ? new Date(w.start_date).toLocaleDateString('id-ID') : '-'}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(w.total_cost)}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => viewDetail(w)}>
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</button>
          <span style={{ color: '#a8a4a0', padding: '4px 12px' }}>Halaman {page} dari {totalPages}</span>
          <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Selanjutnya</button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <h2>Buat WIP Produksi</h2>

            <div className="form-group">
              <label>Produk *</label>
              <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                <option value="">-- Pilih Produk --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku || p.id})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Batch Number *</label>
                <input type="text" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} placeholder="BATCH-001" />
              </div>
              <div className="form-group">
                <label>Qty Rencana *</label>
                <input type="number" min={1} value={form.planned_qty} onChange={(e) => setForm({ ...form, planned_qty: e.target.value })} placeholder="100" />
              </div>
            </div>

            <div className="form-group">
              <label>Catatan</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opsional" rows={2} />
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8, color: '#f0ece4' }}>
              Material Bahan Baku
              <button className="btn btn-sm btn-secondary" onClick={addMaterial} style={{ marginLeft: 12 }}>
                + Tambah Bahan
              </button>
            </h3>

            {formMaterials.map((mat: any, idx: number) => (
              <div key={idx} style={{
                display: 'flex', gap: 8, alignItems: 'flex-end',
                padding: 8, marginBottom: 8,
                background: '#24243a', borderRadius: 6,
              }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label style={{ fontSize: 11 }}>Produk</label>
                  <select
                    value={mat.product_id}
                    onChange={(e) => updateMaterial(idx, 'product_id', e.target.value)}
                    style={{ fontSize: 13 }}
                  >
                    <option value="">-- Pilih --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ fontSize: 11 }}>Qty</label>
                  <input type="number" min={1} value={mat.planned_qty} onChange={(e) => updateMaterial(idx, 'planned_qty', e.target.value)} style={{ fontSize: 13 }} placeholder="1" />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ fontSize: 11 }}>Harga (Rp)</label>
                  <input type="number" min={0} value={mat.unit_cost} onChange={(e) => updateMaterial(idx, 'unit_cost', e.target.value)} style={{ fontSize: 13 }} placeholder="0" />
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => removeMaterial(idx)} style={{ marginBottom: 1 }} disabled={formMaterials.length <= 1}>✕</button>
              </div>
            ))}

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Buat WIP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedWip && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750 }}>
            <h2>Detail WIP: {selectedWip.code || `#${selectedWip.id}`}</h2>

            {detailLoading ? (
              <div className="loading-spinner" style={{ padding: 20 }}><div className="spinner" /></div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div><label style={{ color: '#a8a4a0' }}>Produk</label><div style={{ fontWeight: 600 }}>{selectedWip.product?.name || '-'}</div></div>
                    <div><label style={{ color: '#a8a4a0' }}>Batch</label><div style={{ fontFamily: 'monospace' }}>{selectedWip.batch_number || '-'}</div></div>
                    <div><label style={{ color: '#a8a4a0' }}>Status</label><div><span className={`status-badge ${statusClass(selectedWip.status)}`}>{statusLabel(selectedWip.status)}</span></div></div>
                    <div><label style={{ color: '#a8a4a0' }}>Qty Rencana</label><div>{selectedWip.planned_qty ?? '-'}</div></div>
                    <div><label style={{ color: '#a8a4a0' }}>Qty Aktual</label><div>{selectedWip.actual_qty ?? '-'}</div></div>
                    <div><label style={{ color: '#a8a4a0' }}>Mulai</label><div>{selectedWip.start_date ? new Date(selectedWip.start_date).toLocaleDateString('id-ID') : '-'}</div></div>
                  </div>
                  {selectedWip.notes && (
                    <div style={{ marginTop: 8 }}><label style={{ color: '#a8a4a0' }}>Catatan</label><div>{selectedWip.notes}</div></div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, background: '#24243a', padding: 12, borderRadius: 6 }}>
                  <div>
                    <label style={{ color: '#a8a4a0', fontSize: 12 }}>Biaya Material</label>
                    <div style={{ fontWeight: 600 }}>{fmt(selectedWip.total_material_cost)}</div>
                  </div>
                  <div>
                    <label style={{ color: '#a8a4a0', fontSize: 12 }}>Biaya Tenaga Kerja</label>
                    <div style={{ fontWeight: 600 }}>{fmt(selectedWip.total_labor_cost)}</div>
                  </div>
                  <div>
                    <label style={{ color: '#a8a4a0', fontSize: 12 }}>Biaya Overhead</label>
                    <div style={{ fontWeight: 600 }}>{fmt(selectedWip.total_overhead_cost)}</div>
                  </div>
                  <div>
                    <label style={{ color: '#a8a4a0', fontSize: 12 }}>Total Biaya</label>
                    <div style={{ fontWeight: 600, color: '#e8a87c', fontSize: 16 }}>{fmt(selectedWip.total_cost)}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#f0ece4' }}>Material Bahan Baku</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Produk</th>
                        <th>Qty Rencana</th>
                        <th>Qty Aktual</th>
                        <th>Harga Satuan</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWip.materials?.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: '#6b6865', padding: 16 }}>Tidak ada material</td></tr>
                      ) : (
                        selectedWip.materials?.map((m: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{m.product?.name || '-'}</td>
                            <td>{m.planned_qty ?? '-'}</td>
                            <td style={{ color: '#e8a87c' }}>{m.actual_qty ?? '-'}</td>
                            <td>{fmt(m.unit_cost)}</td>
                            <td style={{ fontWeight: 600 }}>{fmt(m.subtotal)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="modal-actions" style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {selectedWip.status === 'PLANNED' && (
                      <button className="btn btn-success" onClick={() => wipAction(selectedWip.id, 'start')}>
                        ▶ Mulai Produksi
                      </button>
                    )}
                    {selectedWip.status === 'IN_PROGRESS' && (
                      <>
                        <button className="btn btn-success" onClick={() => wipAction(selectedWip.id, 'complete')}>
                          ✓ Selesaikan
                        </button>
                        <button className="btn btn-danger" onClick={() => wipAction(selectedWip.id, 'cancel')}>
                          ✕ Batalkan
                        </button>
                      </>
                    )}
                  </div>
                  <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Tutup</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
