import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function BankAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({
    account_name: '',
    bank_name: '',
    account_number: '',
    account_type: 'savings',
    opening_balance: '',
  });

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/bank-accounts');
      setAccounts(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data rekening bank');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditData(null);
    setForm({ account_name: '', bank_name: '', account_number: '', account_type: 'savings', opening_balance: '' });
    setShowModal(true);
  };

  const openEdit = (a: any) => {
    setEditData(a);
    setForm({
      account_name: a.account_name || '',
      bank_name: a.bank_name || '',
      account_number: a.account_number || '',
      account_type: a.account_type || 'savings',
      opening_balance: String(a.opening_balance || ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        opening_balance: parseFloat(form.opening_balance) || 0,
      };
      if (editData) {
        await api.put(`/finance/bank-accounts/${editData.id}`, payload);
      } else {
        await api.post('/finance/bank-accounts', payload);
      }
      setShowModal(false);
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan rekening bank');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus rekening bank ini?')) return;
    try {
      await api.delete(`/finance/bank-accounts/${id}`);
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const accountTypeLabel = (type: string) => {
    switch (type) {
      case 'savings': return 'Tabungan';
      case 'checking': return 'Giro';
      case 'deposit': return 'Deposito';
      default: return type || '-';
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Rekening Bank</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Rekening</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {accounts.length > 0 && (
        <div className="stat-cards" style={{ marginBottom: 24 }}>
          {accounts.slice(0, 4).map((a: any) => (
            <div className="stat-card" key={a.id}>
              <div className="stat-label">{a.bank_name || 'Bank'}</div>
              <div className="stat-value" style={{ fontSize: 20 }}>
                Rp {(a.current_balance || 0).toLocaleString('id-ID')}
              </div>
              <div className="stat-sub">{a.account_name} — {a.account_number || '-'}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama Rekening</th>
                <th>Bank</th>
                <th>No. Rekening</th>
                <th>Tipe</th>
                <th>Saldo Awal</th>
                <th>Saldo Saat Ini</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada rekening bank</td></tr>
              ) : (
                accounts.map((a: any) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.account_name}</td>
                    <td>{a.bank_name || '-'}</td>
                    <td style={{ fontFamily: 'monospace', color: '#a8a4a0' }}>{a.account_number || '-'}</td>
                    <td><span className="status-badge completed">{accountTypeLabel(a.account_type)}</span></td>
                    <td style={{ color: '#e8a87c' }}>Rp {(a.opening_balance || 0).toLocaleString('id-ID')}</td>
                    <td style={{ fontWeight: 600, color: '#4caf7d' }}>Rp {(a.current_balance || 0).toLocaleString('id-ID')}</td>
                    <td>
                      <span className={`status-badge ${a.is_active !== false ? 'confirmed' : 'cancelled'}`}>
                        {a.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(a)} style={{ marginRight: 6 }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Hapus</button>
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
            <h2>{editData ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}</h2>
            <div className="form-group">
              <label>Nama Rekening *</label>
              <input type="text" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="Contoh: Kas Utama" />
            </div>
            <div className="form-group">
              <label>Nama Bank *</label>
              <input type="text" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Contoh: BCA, Mandiri" />
            </div>
            <div className="form-group">
              <label>No. Rekening</label>
              <input type="text" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="1234567890" />
            </div>
            <div className="form-group">
              <label>Tipe Rekening</label>
              <select value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })}>
                <option value="savings">Tabungan</option>
                <option value="checking">Giro</option>
                <option value="deposit">Deposito</option>
              </select>
            </div>
            <div className="form-group">
              <label>Saldo Awal (Rp)</label>
              <input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} placeholder="0" />
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
