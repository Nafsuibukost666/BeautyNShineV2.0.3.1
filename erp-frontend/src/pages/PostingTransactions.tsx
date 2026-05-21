import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function PostingTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    transaction_type: 'SALE',
    total_amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
    lines: [{ product_name: '', quantity: 1, unit_price: 0, subtotal: 0 }] as any[],
  });
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => { fetchTransactions(); }, [typeFilter, statusFilter, page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: any = { page, per_page: 20 };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/transactions', { params });
      setTransactions(res.data?.data?.items || res.data?.data || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  const openAdd = () => {
    setForm({
      transaction_type: 'SALE',
      total_amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: '',
      lines: [{ product_name: '', quantity: 1, unit_price: 0, subtotal: 0 }],
    });
    setShowModal(true);
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { product_name: '', quantity: 1, unit_price: 0, subtotal: 0 }],
    }));
  };

  const removeLine = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx),
    }));
  };

  const updateLine = (idx: number, field: string, value: any) => {
    setForm((prev) => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? value : lines[idx].quantity;
        const price = field === 'unit_price' ? value : lines[idx].unit_price;
        lines[idx].subtotal = (parseInt(qty) || 0) * (parseInt(price) || 0);
      }
      const totalAmount = lines.reduce((sum, l) => sum + (l.subtotal || 0), 0);
      return { ...prev, lines, total_amount: String(totalAmount) };
    });
  };

  const handleSave = async () => {
    try {
      const payload = {
        transaction_type: form.transaction_type,
        total_amount: parseInt(form.total_amount) || 0,
        transaction_date: form.transaction_date,
        notes: form.notes,
        lines: form.lines.map((l) => ({
          product_name: l.product_name,
          quantity: parseInt(l.quantity) || 1,
          unit_price: parseInt(l.unit_price) || 0,
          subtotal: l.subtotal || 0,
        })),
      };
      await api.post('/transactions', payload);
      setShowModal(false);
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan transaksi');
    }
  };

  const handlePost = async (id: number) => {
    try {
      setActionLoading(id);
      await api.post(`/transactions/${id}/post`);
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memposting transaksi');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Batalkan transaksi ini?')) return;
    try {
      setActionLoading(id);
      await api.post(`/transactions/${id}/cancel`);
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membatalkan transaksi');
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'pending',
      POSTED: 'completed',
      CANCELLED: 'cancelled',
    };
    return map[status] || 'pending';
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Posting Transaksi</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Buat Transaksi Baru</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} style={{ maxWidth: 200 }}>
          <option value="">Semua Tipe</option>
          <option value="SALE">Penjualan (SALE)</option>
          <option value="EXPENSE">Pengeluaran (EXPENSE)</option>
          <option value="PAYMENT">Pembayaran (PAYMENT)</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ maxWidth: 200 }}>
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="POSTED">Posted</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>No. Dokumen</th>
                <th>Tipe</th>
                <th>Tanggal</th>
                <th>Total</th>
                <th>Status</th>
                <th>Diposting Oleh</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada transaksi</td></tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx.id}>
                    <td style={{ color: '#a8a4a0' }}>{tx.doc_number || `#${tx.id}`}</td>
                    <td><span className="status-badge completed">{tx.transaction_type}</span></td>
                    <td>{tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('id-ID') : '-'}</td>
                    <td style={{ fontWeight: 600 }}>Rp {(tx.total_amount || 0).toLocaleString('id-ID')}</td>
                    <td>
                      <span className={`status-badge ${statusBadge(tx.status)}`}>
                        {tx.status === 'DRAFT' ? 'Draft' : tx.status === 'POSTED' ? 'Telah Diposting' : 'Dibatalkan'}
                      </span>
                    </td>
                    <td style={{ color: '#a8a4a0' }}>{tx.posted_by || '-'}</td>
                    <td>
                      {tx.status === 'DRAFT' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handlePost(tx.id)}
                          disabled={actionLoading === tx.id}
                          style={{ marginRight: 6 }}
                        >
                          {actionLoading === tx.id ? 'Memproses...' : 'Post'}
                        </button>
                      )}
                      {tx.status === 'POSTED' && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleCancel(tx.id)}
                          disabled={actionLoading === tx.id}
                        >
                          {actionLoading === tx.id ? 'Memproses...' : 'Cancel'}
                        </button>
                      )}
                      {tx.status === 'CANCELLED' && (
                        <span style={{ color: '#6b6865', fontSize: 12 }}>—</span>
                      )}
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
          <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</button>
          <span style={{ color: '#a8a4a0', padding: '4px 12px' }}>Halaman {page} dari {totalPages}</span>
          <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Selanjutnya</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <h2>Buat Transaksi Baru</h2>
            <div className="form-group">
              <label>Tipe Transaksi *</label>
              <select value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
                <option value="SALE">Penjualan (SALE)</option>
                <option value="EXPENSE">Pengeluaran (EXPENSE)</option>
                <option value="PAYMENT">Pembayaran (PAYMENT)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tanggal Transaksi *</label>
              <input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Total (otomatis dari lines)</label>
              <input type="text" value={`Rp ${(parseInt(form.total_amount) || 0).toLocaleString('id-ID')}`} disabled />
            </div>
            <div className="form-group">
              <label>Catatan</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan transaksi..." />
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 12, color: '#f0ece4' }}>Detail Baris Transaksi</h3>
            {form.lines.map((line, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8, flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Nama Produk</label>
                  <input type="text" value={line.product_name} onChange={(e) => updateLine(idx, 'product_name', e.target.value)} placeholder="Nama produk/layanan" />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Qty</label>
                  <input type="number" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value) || 0)} min={1} />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Harga</label>
                  <input type="number" value={line.unit_price} onChange={(e) => updateLine(idx, 'unit_price', parseInt(e.target.value) || 0)} min={0} />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Subtotal</label>
                  <input type="text" value={`Rp ${(line.subtotal || 0).toLocaleString('id-ID')}`} disabled style={{ background: '#24243a' }} />
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => removeLine(idx)} style={{ marginBottom: 2 }} disabled={form.lines.length <= 1}>✕</button>
              </div>
            ))}
            <button className="btn btn-sm btn-secondary" onClick={addLine} style={{ marginTop: 4 }}>+ Tambah Baris</button>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
