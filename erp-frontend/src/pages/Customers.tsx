import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditData(null);
    setForm({ name: '', phone: '', email: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditData(c);
    setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', notes: c.notes || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editData) {
        await api.put(`/customers/${editData.id}`, form);
      } else {
        await api.post('/customers', form);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus customer ini?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const filtered = customers.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Customer</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Customer</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input type="text" placeholder="Cari nama atau no. telepon..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Telepon</th>
                <th>Email</th>
                <th>Catatan</th>
                <th>Total Kunjungan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada customer</td></tr>
              ) : (
                filtered.map((c: any) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td style={{ color: '#a8a4a0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes || '-'}</td>
                    <td>{c.total_visits ?? c.totalVisits ?? 0}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)} style={{ marginRight: 6 }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Hapus</button>
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
            <h2>{editData ? 'Edit Customer' : 'Tambah Customer'}</h2>
            <div className="form-group">
              <label>Nama *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama customer" />
            </div>
            <div className="form-group">
              <label>No. Telepon</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08123456789" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
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
