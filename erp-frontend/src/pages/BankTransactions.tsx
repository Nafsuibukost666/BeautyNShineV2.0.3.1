import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function BankTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    bank_account_id: '',
    transaction_type: 'income',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, acctRes] = await Promise.all([
        api.get('/finance/bank-transactions'),
        api.get('/finance/bank-accounts'),
      ]);
      const txData = txRes.data?.data || txRes.data;
      setTransactions(Array.isArray(txData) ? txData : txData?.items || []);
      setAccounts(Array.isArray(acctRes.data) ? acctRes.data : acctRes.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm({
      bank_account_id: accounts.length > 0 ? String(accounts[0].id) : '',
      transaction_type: 'income',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.bank_account_id) {
      alert('Pilih rekening bank terlebih dahulu');
      return;
    }
    try {
      const payload = {
        bank_account_id: parseInt(form.bank_account_id),
        transaction_type: form.transaction_type,
        amount: parseFloat(form.amount) || 0,
        transaction_date: form.transaction_date,
        description: form.description,
      };
      await api.post('/finance/bank-transactions', payload);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan transaksi');
    }
  };

  const getAccountName = (id: number) => {
    const acct = accounts.find((a) => a.id === id);
    return acct ? `${acct.account_name} (${acct.bank_name || 'Bank'})` : 'Rekening #' + id;
  };

  const filtered = transactions.filter((t: any) => {
    const matchSearch = !search || t.description?.toLowerCase().includes(search.toLowerCase()) || getAccountName(t.bank_account_id)?.toLowerCase().includes(search.toLowerCase());
    const matchAccount = !filterAccount || String(t.bank_account_id) === filterAccount;
    const matchType = !filterType || t.transaction_type === filterType;
    return matchSearch && matchAccount && matchType;
  });

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Transaksi Bank</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Transaksi</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input type="text" placeholder="Cari transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
          <option value="">Semua Rekening</option>
          {accounts.map((a: any) => (
            <option key={a.id} value={a.id}>{a.account_name}</option>
          ))}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Semua Tipe</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Rekening</th>
                <th>Tipe</th>
                <th>Deskripsi</th>
                <th>Jumlah</th>
                <th>Saldo Sebelum</th>
                <th>Saldo Sesudah</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada transaksi</td></tr>
              ) : (
                [...filtered]
                  .sort((a, b) => new Date(b.transaction_date || b.created_at).getTime() - new Date(a.transaction_date || a.created_at).getTime())
                  .map((t: any) => (
                    <tr key={t.id}>
                      <td style={{ color: '#a8a4a0', fontFamily: 'monospace', fontSize: 13 }}>
                        {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{getAccountName(t.bank_account_id)}</td>
                      <td>
                        <span className={`status-badge ${t.transaction_type === 'income' ? 'confirmed' : t.transaction_type === 'expense' ? 'cancelled' : 'pending'}`}>
                          {t.transaction_type === 'income' ? 'Pemasukan' : t.transaction_type === 'expense' ? 'Pengeluaran' : 'Transfer'}
                        </span>
                      </td>
                      <td style={{ color: '#a8a4a0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description || '-'}
                      </td>
                      <td style={{
                        fontWeight: 600,
                        color: t.transaction_type === 'income' ? '#4caf7d' : t.transaction_type === 'expense' ? '#e06c6c' : '#e8a87c',
                      }}>
                        {t.transaction_type === 'income' ? '+' : t.transaction_type === 'expense' ? '−' : '↔'} Rp {(t.amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td style={{ color: '#a8a4a0' }}>Rp {(t.balance_before || 0).toLocaleString('id-ID')}</td>
                      <td style={{ fontWeight: 600 }}>Rp {(t.balance_after || 0).toLocaleString('id-ID')}</td>
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
            <h2>Tambah Transaksi Bank</h2>
            <div className="form-group">
              <label>Rekening Bank *</label>
              <select value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}>
                <option value="">-- Pilih Rekening --</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.account_name} — {a.bank_name || 'Bank'} (Rp {(a.current_balance || 0).toLocaleString('id-ID')})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tipe Transaksi *</label>
              <select value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Jumlah (Rp) *</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="100000" />
            </div>
            <div className="form-group">
              <label>Tanggal Transaksi</label>
              <input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Deskripsi</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Keterangan transaksi..." />
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
