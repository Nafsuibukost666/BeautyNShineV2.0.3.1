import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { fmtRp, esc, today } from '../utils/format';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    expense_date: today(),
    category: '',
    description: '',
    amount: '',
    payment_method: 'Cash',
    notes: '',
  });

  const formRef = useRef(null);
  const statusTimeout = useRef(null);

  useEffect(() => {
    loadExpenses();
    return () => { if (statusTimeout.current) clearTimeout(statusTimeout.current); };
  }, []);

  function showStatus(msg, type) {
    if (statusTimeout.current) clearTimeout(statusTimeout.current);
    setStatus({ msg, type });
    if (type === 'success') {
      statusTimeout.current = setTimeout(() => setStatus({ msg: '', type: '' }), 4000);
    }
  }

  async function loadExpenses() {
    setLoading(true);
    setStatus({ msg: '', type: '' });
    try {
      const res = await api.get('/api/expenses');
      setExpenses(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data?.expenses) ? res.data.expenses : []));
    } catch (e) {
      showStatus('Gagal memuat pengeluaran: ' + (e.response?.data?.message || e.message), 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      expense_date: today(),
      category: '',
      description: '',
      amount: '',
      payment_method: 'Cash',
      notes: '',
    });
  }

  function openForm() {
    resetForm();
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    // Validasi
    if (!form.description.trim()) {
      showStatus('Deskripsi wajib diisi', 'error');
      return;
    }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      showStatus('Jumlah harus lebih dari 0', 'error');
      return;
    }
    if (!form.category.trim()) {
      showStatus('Kategori wajib diisi', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/expenses', {
        expense_date: form.expense_date || today(),
        category: form.category.trim(),
        description: form.description.trim(),
        amount: amount,
        payment_method: form.payment_method,
        notes: form.notes.trim(),
      });
      showStatus('✅ Pengeluaran berhasil dicatat!', 'success');
      closeForm();
      loadExpenses();
    } catch (e) {
      showStatus('Gagal menyimpan: ' + (e.response?.data?.message || e.message), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const categoryOptions = [
    'Bahan Baku',
    'Alat',
    'Sewa',
    'Listrik & Air',
    'Gaji Staff',
    'Marketing',
    'Lainnya',
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pengeluaran</h1>
          <p>Catat pengeluaran keuangan salon</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary btn-sm" onClick={openForm} disabled={loading}>
            <i className="fas fa-plus"></i> Tambah Pengeluaran
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadExpenses} disabled={loading}>
            {loading ? <span className="spinner"></span> : <><i className="fas fa-sync"></i> Muat Ulang</>}
          </button>
        </div>
      </div>

      <div className={`status-box show ${status.type}`} style={{ display: status.msg ? 'block' : 'none' }}>
        {status.msg && esc(status.msg)}
      </div>

      {/* ──── Form Modal ──── */}
      {showForm && (
        <div
          className="overlay"
          onClick={e => { if (e.target === e.currentTarget) closeForm(); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            ref={formRef}
            className="card"
            style={{ width: '100%', maxWidth: 480, margin: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
          >
            <div className="card-title">
              <i className="fas fa-money-bill-wave"></i> Tambah Pengeluaran
              <button
                onClick={closeForm}
                style={{
                  float: 'right', background: 'none', border: 'none',
                  fontSize: 20, cursor: 'pointer', color: '#666',
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="form-group">
              <label>Tanggal</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={e => updateField('expense_date', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Kategori *</label>
              <div className="flex" style={{ gap: 8 }}>
                <select
                  value={categoryOptions.includes(form.category) ? form.category : '__custom'}
                  onChange={e => {
                    if (e.target.value === '__custom') updateField('category', '');
                    else updateField('category', e.target.value);
                  }}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom">Lainnya (ketik manual)</option>
                </select>
              </div>
              {!categoryOptions.includes(form.category) && form.category && (
                <input
                  type="text"
                  value={form.category}
                  onChange={e => updateField('category', e.target.value)}
                  placeholder="Ketik kategori..."
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            <div className="form-group">
              <label>Deskripsi *</label>
              <input
                type="text"
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder="Contoh: Beli lem bulu mata"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Jumlah (Rp) *</label>
              <input
                type="number"
                min={0}
                value={form.amount}
                onChange={e => updateField('amount', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)).toString())}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Metode Pembayaran</label>
              <select
                value={form.payment_method}
                onChange={e => updateField('payment_method', e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="QRIS">QRIS</option>
                <option value="Transfer">Transfer</option>
                <option value="Debit">Debit</option>
                <option value="Credit">Credit</option>
              </select>
            </div>

            <div className="form-group">
              <label>Catatan</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => updateField('notes', e.target.value)}
                placeholder="Catatan tambahan (opsional)"
              />
            </div>

            <div className="flex" style={{ gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={closeForm} disabled={submitting}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? (
                  <><span className="spinner"></span> Menyimpan...</>
                ) : (
                  <><i className="fas fa-save"></i> Simpan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Table ──── */}
      <div className="card">
        <div className="card-title">
          <i className="fas fa-money-bill-wave"></i> Daftar Pengeluaran ({expenses.length})
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th className="right">Jumlah</th>
                <th>Metode</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={5}>
                    {loading ? 'Memuat data...' : 'Belum ada data pengeluaran'}
                  </td>
                </tr>
              ) : (
                expenses.map((e, i) => (
                  <tr key={e.id || e.expense_id || i}>
                    <td>{esc(e.date || e.expense_date || e.created_at || '—')}</td>
                    <td>{esc(e.category || '—')}</td>
                    <td>{esc(e.description || '—')}</td>
                    <td className="right" style={{ color: '#dc2626', fontWeight: 600 }}>
                      -{fmtRp(e.amount || e.total || 0)}
                    </td>
                    <td>{esc(e.payment_method || e.method || '—')}</td>
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
