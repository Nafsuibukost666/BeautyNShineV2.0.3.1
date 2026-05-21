import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function StockMovement() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    product_id: '',
    movement_type: 'IN',
    quantity: '',
    unit_cost: '',
    notes: '',
    movement_date: new Date().toISOString().slice(0, 10),
  });
  const [products, setProducts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const perPage = 20;

  useEffect(() => { fetchMovements(); }, [page, typeFilter, searchProduct]);
  useEffect(() => { if (showModal) fetchProducts(); }, [showModal]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { page, per_page: perPage };
      if (typeFilter) params.type = typeFilter;
      if (searchProduct) params.product_id = searchProduct;
      const res = await api.get('/inventory/movements', { params });
      setMovements(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data mutasi stok');
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

  const handleSave = async () => {
    if (!form.product_id || !form.quantity) {
      alert('Pilih produk dan isi jumlah');
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        product_id: parseInt(form.product_id),
        movement_type: form.movement_type,
        quantity: parseInt(form.quantity),
        unit_cost: parseInt(form.unit_cost) || 0,
        notes: form.notes,
        movement_date: form.movement_date,
      };
      await api.post('/inventory/movements', payload);
      setShowModal(false);
      fetchMovements();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan mutasi');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);
  const fmt = (v: any) => `Rp ${(parseInt(v) || 0).toLocaleString('id-ID')}`;

  if (loading && movements.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Mutasi Stok</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ ...form, product_id: '', quantity: '', unit_cost: '', notes: '', movement_date: new Date().toISOString().slice(0, 10) }); setShowModal(true); }}>
          + Tambah Mutasi
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Tipe</option>
          <option value="IN">Barang Masuk</option>
          <option value="OUT">Barang Keluar</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Tipe</th>
                <th>Qty</th>
                <th>Harga Satuan</th>
                <th>Total</th>
                <th>Tanggal</th>
                <th>Referensi</th>
                <th>Stok Sebelum</th>
                <th>Stok Setelah</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada mutasi stok</td></tr>
              ) : (
                movements.map((m: any) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>
                      {m.product?.name || `Produk #${m.product_id}`}
                      <span style={{ display: 'block', color: '#a8a4a0', fontSize: 11 }}>{m.product?.sku || ''}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${m.movement_type === 'IN' ? 'completed' : 'cancelled'}`}>
                        {m.movement_type === 'IN' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: m.movement_type === 'IN' ? '#4caf7d' : '#e06c6c' }}>
                      {m.movement_type === 'IN' ? '+' : '-'}{m.quantity}
                    </td>
                    <td>{fmt(m.unit_cost)}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(m.total_cost)}</td>
                    <td>{m.movement_date ? new Date(m.movement_date).toLocaleDateString('id-ID') : '-'}</td>
                    <td style={{ color: '#a8a4a0', fontSize: 13 }}>
                      {m.reference_type ? `${m.reference_type} #${m.reference_id}` : '-'}
                    </td>
                    <td>{m.balance_before ?? '-'}</td>
                    <td style={{ fontWeight: 600, color: '#e8a87c' }}>{m.balance_after ?? '-'}</td>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Tambah Mutasi Stok</h2>
            <div className="form-group">
              <label>Pilih Produk *</label>
              <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                <option value="">-- Pilih Produk --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku || p.id})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tipe Mutasi *</label>
              <select value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value })}>
                <option value="IN">Barang Masuk (IN)</option>
                <option value="OUT">Barang Keluar (OUT)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Jumlah *</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Contoh: 10" />
            </div>
            <div className="form-group">
              <label>Harga Satuan (Rp)</label>
              <input type="number" min={0} value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Tanggal Mutasi</label>
              <input type="date" value={form.movement_date} onChange={(e) => setForm({ ...form, movement_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Catatan</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opsional" rows={2} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
