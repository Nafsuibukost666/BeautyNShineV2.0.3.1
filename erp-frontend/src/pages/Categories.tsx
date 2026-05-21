import React, { useState, useEffect } from 'react';
import api from '../lib/api';

const TYPE_OPTIONS = [
  { value: 'PRODUCT', label: 'Produk' },
  { value: 'POS', label: 'POS' },
  { value: 'ACCOUNTING', label: 'Akuntansi' },
];

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'PRODUCT', parent_id: '', sort_order: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/master/categories', { params });
      setCategories(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [typeFilter]);

  const openAdd = () => {
    setEditData(null);
    setForm({ name: '', type: 'PRODUCT', parent_id: '', sort_order: '' });
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditData(c);
    setForm({
      name: c.name || '',
      type: c.type || 'PRODUCT',
      parent_id: String(c.parent_id || ''),
      sort_order: String(c.sort_order || ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        name: form.name,
        type: form.type,
      };
      if (form.parent_id) payload.parent_id = parseInt(form.parent_id);
      if (form.sort_order) payload.sort_order = parseInt(form.sort_order);
      if (editData) {
        await api.put(`/master/categories/${editData.id}`, payload);
      } else {
        await api.post('/master/categories', payload);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan kategori');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      await api.delete(`/master/categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus kategori');
    }
  };

  const getParentName = (parentId: number | null) => {
    if (!parentId) return null;
    const parent = categories.find((c: any) => c.id === parentId);
    return parent?.name || null;
  };

  const getTypeLabel = (type: string) => {
    const opt = TYPE_OPTIONS.find((t) => t.value === type);
    return opt?.label || type;
  };

  if (loading && categories.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Kategori</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Kategori</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Semua Tipe</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tipe</th>
                <th>Induk</th>
                <th>Urutan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada kategori</td></tr>
              ) : (
                categories.map((c: any) => {
                  const parentName = getParentName(c.parent_id);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>
                        <span className="status-badge" style={{ background: 'rgba(232,168,124,0.1)', color: '#e8a87c' }}>
                          {getTypeLabel(c.type)}
                        </span>
                      </td>
                      <td style={{ color: '#a8a4a0' }}>{parentName || '-'}</td>
                      <td style={{ color: '#a8a4a0' }}>{c.sort_order ?? '-'}</td>
                      <td>
                        <span className={`status-badge ${c.is_active !== false ? 'completed' : 'cancelled'}`}>
                          {c.is_active !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)} style={{ marginRight: 6 }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Hapus</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editData ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
            <div className="form-group">
              <label>Nama Kategori *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama kategori" />
            </div>
            <div className="form-group">
              <label>Tipe *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Induk</label>
              <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                <option value="">Tidak ada (Kategori Utama)</option>
                {categories
                  .filter((c: any) => c.id !== editData?.id && c.type === form.type)
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>Urutan</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} placeholder="0" />
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
