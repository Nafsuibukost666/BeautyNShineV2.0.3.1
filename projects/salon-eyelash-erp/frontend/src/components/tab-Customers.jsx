import { useState, useEffect } from 'react';
import api from '../api';
import { fmtRp, esc, today } from '../utils/format';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // Add customer form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', instagram: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cLoad('');
  }, []);

  async function cLoad(s) {
    const q = s !== undefined ? s : search;
    setLoading(true);
    setStatus({ msg: '', type: '' });
    try {
      const url = q ? '/api/customers?search=' + encodeURIComponent(q) : '/api/customers';
      const res = await api.get(url);
      setCustomers(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data?.customers) ? res.data.customers : []));
    } catch (e) {
      setStatus({ msg: 'Gagal memuat customer: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function cDetail(id) {
    setLoading(true);
    try {
      const res = await api.get('/api/customers/' + id);
      const c = res.data.customer || res.data;
      if (!c || !c.customer_id) {
        setStatus({ msg: 'Customer tidak ditemukan', type: 'error' });
        return;
      }
      const info = [
        'Nama: ' + (c.customer_name || '—'),
        'No. HP: ' + (c.phone || '—'),
        'Instagram: ' + (c.instagram || '—'),
        'Total Transaksi: ' + (c.total_transactions || (res.data.transactions ? res.data.transactions.length : 0)),
        'Total Belanja: ' + fmtRp(c.total_spent || 0),
        '',
        '--- 20 Transaksi Terakhir ---',
      ];
      const txs = res.data.transactions || [];
      if (txs.length === 0) {
        info.push('Belum ada transaksi');
      } else {
        txs.slice(0, 20).forEach((tx, i) => {
          info.push(
            (i + 1) + '. ' + (tx.transaction_date || tx.date || '—') +
            ' | ' + (tx.transaction_code || tx.code || '—') +
            ' | ' + fmtRp(tx.grand_total || tx.total || 0) +
            ' | ' + (tx.payment_status || tx.status || '—')
          );
        });
      }
      alert(info.join('\n'));
    } catch (e) {
      setStatus({ msg: 'Gagal memuat detail customer: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function cSave() {
    if (!form.name.trim()) {
      setStatus({ msg: 'Nama customer wajib diisi', type: 'error' });
      return;
    }
    setSaving(true);
    setStatus({ msg: '', type: '' });
    try {
      await api.post('/api/customers', {
        customer_name: form.name,
        phone: form.phone,
        instagram: form.instagram,
      });
      setStatus({ msg: 'Customer berhasil ditambahkan', type: 'success' });
      setShowForm(false);
      setForm({ name: '', phone: '', instagram: '' });
      cLoad(search);
    } catch (e) {
      setStatus({ msg: 'Gagal menambah customer: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Data Customer</h1>
          <p>Daftar pelanggan Salon Eyelash</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <i className="fas fa-plus"></i> {showForm ? 'Tutup' : 'Tambah Customer'}
          </button>
        </div>
      </div>

      <div className={`status-box show ${status.type}`} style={{ display: status.msg ? 'block' : 'none' }}>
        {status.msg && esc(status.msg)}
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title"><i className="fas fa-user-plus"></i> Customer Baru</div>
          <div className="flex" style={{ gap: 16, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nama</label>
              <input
                type="text"
                placeholder="Nama lengkap"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>No. HP</label>
              <input
                type="text"
                placeholder="08xxxx"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Instagram</label>
              <input
                type="text"
                placeholder="@username"
                value={form.instagram}
                onChange={e => setForm({ ...form, instagram: e.target.value })}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={cSave}
              disabled={saving}
            >
              {saving ? <span className="spinner"></span> : <><i className="fas fa-save"></i> Simpan</>}
            </button>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="flex" style={{ gap: 12, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Cari Customer</label>
            <input
              type="text"
              placeholder="Cari berdasarkan nama, no. HP, atau Instagram..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') cLoad(search); }}
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => cLoad(search)}
            disabled={loading}
          >
            {loading ? <span className="spinner"></span> : <><i className="fas fa-search"></i> Cari</>}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => { setSearch(''); cLoad(''); }}
          >
            <i className="fas fa-times"></i> Reset
          </button>
        </div>
      </div>

      {/* Customer table */}
      <div className="card">
        <div className="card-title"><i className="fas fa-users"></i> Daftar Customer ({customers.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>No. HP</th>
                <th>Instagram</th>
                <th className="right">Transaksi</th>
                <th className="right">Total Belanja</th>
                <th className="no-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={6}>
                    {search ? 'Tidak ada customer yang cocok dengan pencarian' : 'Belum ada data customer'}
                  </td>
                </tr>
              ) : (
                customers.map((c, i) => (
                  <tr key={c.customer_id || c.id || i}>
                    <td><strong>{esc(c.customer_name || c.name || '—')}</strong></td>
                    <td>{esc(c.phone || '—')}</td>
                    <td>{esc(c.instagram || '—')}</td>
                    <td className="right">{c.total_transactions || 0}</td>
                    <td className="right">{fmtRp(c.total_spent || 0)}</td>
                    <td className="no-print">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => cDetail(c.customer_id || c.id)}
                        disabled={loading}
                        title="Lihat detail"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
