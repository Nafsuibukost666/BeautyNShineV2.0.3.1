import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', category: '' });

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/services');
      setServices(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data layanan');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditData(null);
    setForm({ name: '', description: '', price: '', duration: '', category: '' });
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditData(s);
    setForm({
      name: s.name || '',
      description: s.description || '',
      price: String(s.price || ''),
      duration: String(s.duration || ''),
      category: s.category || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, price: parseInt(form.price) || 0, duration: parseInt(form.duration) || 0 };
      if (editData) {
        await api.put(`/services/${editData.id}`, payload);
      } else {
        await api.post('/services', payload);
      }
      setShowModal(false);
      fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan layanan');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus layanan ini?')) return;
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const filtered = services.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Layanan</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Layanan</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input type="text" placeholder="Cari layanan..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th>Durasi (menit)</th>
                <th>Harga</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada layanan</td></tr>
              ) : (
                filtered.map((s: any) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td><span className="status-badge completed">{s.category || '-'}</span></td>
                    <td style={{ color: '#a8a4a0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description || '-'}</td>
                    <td>{s.duration ? `${s.duration} menit` : '-'}</td>
                    <td style={{ fontWeight: 600, color: '#e8a87c' }}>Rp {(s.price || 0).toLocaleString('id-ID')}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)} style={{ marginRight: 6 }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Hapus</button>
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
            <h2>{editData ? 'Edit Layanan' : 'Tambah Layanan'}</h2>
            <div className="form-group">
              <label>Nama Layanan *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama layanan" />
            </div>
            <div className="form-group">
              <label>Kategori</label>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Contoh: Lash, Brow, Facial" />
            </div>
            <div className="form-group">
              <label>Deskripsi</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi layanan..." />
            </div>
            <div className="form-group">
              <label>Durasi (menit)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="60" />
            </div>
            <div className="form-group">
              <label>Harga *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="100000" />
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
