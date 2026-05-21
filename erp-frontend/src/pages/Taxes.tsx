import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Taxes() {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ name: '', rate: '' });

  useEffect(() => { fetchTaxes(); }, []);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/master/taxes');
      setTaxes(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data pajak');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditData(null);
    setForm({ name: '', rate: '' });
    setShowModal(true);
  };

  const openEdit = (t: any) => {
    setEditData(t);
    setForm({
      name: t.name || '',
      rate: String(t.rate || ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        rate: parseFloat(form.rate) || 0,
      };
      if (editData) {
        await api.put(`/master/taxes/${editData.id}`, payload);
      } else {
        await api.post('/master/taxes', payload);
      }
      setShowModal(false);
      fetchTaxes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan pajak');
    }
  };

  const handleToggleActive = async (t: any) => {
    try {
      await api.put(`/master/taxes/${t.id}`, { ...t, is_active: !t.is_active });
      fetchTaxes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah status pajak');
    }
  };

  if (loading && taxes.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tax</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Tax</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tarif (%)</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {taxes.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada pajak</td></tr>
              ) : (
                taxes.map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td style={{ fontWeight: 600, color: '#e8a87c' }}>{t.rate ?? 0}%</td>
                    <td>
                      <span className={`status-badge ${t.is_active !== false ? 'completed' : 'cancelled'}`}>
                        {t.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)} style={{ marginRight: 6 }}>Edit</button>
                      <button
                        className={`btn btn-sm ${t.is_active !== false ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleActive(t)}
                        style={{ background: t.is_active !== false ? 'rgba(224,108,108,0.1)' : 'rgba(76,175,125,0.1)', color: t.is_active !== false ? '#e06c6c' : '#4caf7d', border: 'none' }}
                      >
                        {t.is_active !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
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
            <h2>{editData ? 'Edit Tax' : 'Tambah Tax'}</h2>
            <div className="form-group">
              <label>Nama Tax *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="PPN, PPh 23, dll" />
            </div>
            <div className="form-group">
              <label>Tarif (%) *</label>
              <input type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="11" />
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
