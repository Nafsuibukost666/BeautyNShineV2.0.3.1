import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ description: '', amount: '', category: '', date: '', notes: '' });
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => { fetchExpenses(); }, [dateFrom, dateTo, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/expenses', { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setExpenses(data);
      const cats = [...new Set(data.map((e: any) => e.category).filter(Boolean))] as string[];
      setCategories(cats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data pengeluaran');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditData(null);
    setForm({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], notes: '' });
    setShowModal(true);
  };

  const openEdit = (e: any) => {
    setEditData(e);
    setForm({
      description: e.description || '',
      amount: String(e.amount || ''),
      category: e.category || '',
      date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
      notes: e.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, amount: parseInt(form.amount) || 0 };
      if (editData) {
        await api.put(`/expenses/${editData.id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      setShowModal(false);
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan pengeluaran');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pengeluaran ini?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + (parseInt(e.amount) || 0), 0);

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Pengeluaran</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Pengeluaran</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Total Pengeluaran</div>
          <div className="stat-value" style={{ color: '#e06c6c' }}>Rp {totalAmount.toLocaleString('id-ID')}</div>
          <div className="stat-sub">{expenses.length} transaksi</div>
        </div>
      </div>

      <div className="search-bar">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ maxWidth: 180 }} placeholder="Dari tanggal" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ maxWidth: 180 }} placeholder="Sampai tanggal" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th>Jumlah</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada pengeluaran</td></tr>
              ) : (
                expenses.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ color: '#a8a4a0' }}>{e.date ? new Date(e.date).toLocaleDateString('id-ID') : '-'}</td>
                    <td style={{ fontWeight: 600 }}>{e.description}</td>
                    <td><span className="status-badge completed">{e.category || '-'}</span></td>
                    <td style={{ fontWeight: 600, color: '#e06c6c' }}>Rp {(e.amount || 0).toLocaleString('id-ID')}</td>
                    <td style={{ color: '#a8a4a0', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes || '-'}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(e)} style={{ marginRight: 6 }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e.id)}>Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editData ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h2>
            <div className="form-group">
              <label>Deskripsi *</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi pengeluaran" />
            </div>
            <div className="form-group">
              <label>Jumlah *</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="100000" />
            </div>
            <div className="form-group">
              <label>Kategori</label>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Contoh: Sewa, Listrik, Supplies" list="category-list" />
              <datalist id="category-list">
                {categories.map((cat) => <option key={cat} value={cat} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label>Tanggal</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Catatan</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
