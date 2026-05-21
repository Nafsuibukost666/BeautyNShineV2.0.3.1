import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Staff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({
    staff_id: '', name: '', role: '', kabin: '',
    commission_type: 'PERCENTAGE', commission_value: '',
  });

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (search) params.search = search;
      const res = await api.get('/master/staff', { params });
      setStaff(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [search]);

  const openAdd = () => {
    setEditData(null);
    setForm({ staff_id: '', name: '', role: '', kabin: '', commission_type: 'PERCENTAGE', commission_value: '' });
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditData(s);
    setForm({
      staff_id: s.staff_id || '',
      name: s.name || '',
      role: s.role || '',
      kabin: s.kabin || '',
      commission_type: s.commission_type || 'PERCENTAGE',
      commission_value: String(s.commission_value || ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        staff_id: form.staff_id,
        name: form.name,
        role: form.role,
        kabin: form.kabin,
        commission_type: form.commission_type,
        commission_value: parseFloat(form.commission_value) || 0,
      };
      if (editData) {
        await api.put(`/master/staff/${editData.id}`, payload);
      } else {
        await api.post('/master/staff', payload);
      }
      setShowModal(false);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan data staff');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus staff ini?')) return;
    try {
      await api.delete(`/master/staff/${id}`);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus staff');
    }
  };

  if (loading && staff.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Staff</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Staff</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Cari staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID Staff</th>
                <th>Nama</th>
                <th>Role</th>
                <th>Kabin</th>
                <th>Tipe Komisi</th>
                <th>Nilai Komisi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada staff</td></tr>
              ) : (
                staff.map((s: any) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 13, color: '#a8a4a0' }}>{s.staff_id || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td><span className="status-badge completed">{s.role || 'Staff'}</span></td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#e8a87c' }}>{s.kabin || '-'}</td>
                    <td>
                      <span className="status-badge" style={{ background: 'rgba(232,168,124,0.1)', color: '#e8a87c' }}>
                        {s.commission_type === 'PERCENTAGE' ? 'Persentase' : s.commission_type === 'FIXED' ? 'Nominal Tetap' : '-'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {s.commission_value
                        ? s.commission_type === 'PERCENTAGE'
                          ? `${s.commission_value}%`
                          : `Rp ${Number(s.commission_value).toLocaleString('id-ID')}`
                        : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${s.is_active !== false ? 'completed' : 'cancelled'}`}>
                        {s.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
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
            <h2>{editData ? 'Edit Staff' : 'Tambah Staff'}</h2>
            <div className="form-group">
              <label>ID Staff *</label>
              <input type="text" value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} placeholder="STF-001" />
            </div>
            <div className="form-group">
              <label>Nama Staff *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama staff" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Therapist, Admin, dll" />
            </div>
            <div className="form-group">
              <label>Kabin</label>
              <input type="text" value={form.kabin} onChange={(e) => setForm({ ...form, kabin: e.target.value })} placeholder="K01, K02, K03..." />
            </div>
            <div className="form-group">
              <label>Tipe Komisi</label>
              <select value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value })}>
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nilai Komisi</label>
              <input type="number" value={form.commission_value} onChange={(e) => setForm({ ...form, commission_value: e.target.value })} placeholder={form.commission_type === 'PERCENTAGE' ? '10' : '50000'} />
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
