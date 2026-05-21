import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', contact_person: '', phone: '', email: '', address: '', notes: '',
  });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (search) params.search = search;
      const res = await api.get('/suppliers', { params });
      setSuppliers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data supplier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, [search]);

  const openAdd = () => {
    setEditData(null);
    setForm({ name: '', contact_person: '', phone: '', email: '', address: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditData(s);
    setForm({
      name: s.name || '',
      contact_person: s.contact_person || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      notes: s.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editData) {
        await api.put(`/suppliers/${editData.id}`, form);
      } else {
        await api.post('/suppliers', form);
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan supplier');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus supplier ini?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus supplier');
    }
  };

  if (loading && suppliers.length === 0) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Supplier</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Supplier</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input type="text" placeholder="Cari nama, PIC, telepon, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama Supplier</th>
                <th>PIC</th>
                <th>Telepon</th>
                <th>Email</th>
                <th>Alamat</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada supplier</td></tr>
              ) : suppliers.map((s: any) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.contact_person || '-'}</td>
                  <td>{s.phone || '-'}</td>
                  <td>{s.email || '-'}</td>
                  <td style={{ color: '#a8a4a0', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address || '-'}</td>
                  <td style={{ color: '#a8a4a0', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)} style={{ marginRight: 6 }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editData ? 'Edit Supplier' : 'Tambah Supplier'}</h2>
            <div className="form-group">
              <label>Nama Supplier *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama supplier" />
            </div>
            <div className="form-group">
              <label>PIC / Contact Person</label>
              <input type="text" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} placeholder="Nama PIC" />
            </div>
            <div className="form-group">
              <label>No. Telepon</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08123456789" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="supplier@example.com" />
            </div>
            <div className="form-group">
              <label>Alamat</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat supplier..." />
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
