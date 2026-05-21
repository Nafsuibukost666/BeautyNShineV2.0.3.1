import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function FixedAssets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({
    asset_code: '',
    name: '',
    category: '',
    purchase_date: '',
    purchase_price: '',
    useful_life_years: '',
    residual_value: '',
  });

  useEffect(() => { fetchAssets(); }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/assets');
      setAssets(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data aset tetap');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditData(null);
    setForm({ asset_code: '', name: '', category: '', purchase_date: '', purchase_price: '', useful_life_years: '', residual_value: '' });
    setShowModal(true);
  };

  const openEdit = (a: any) => {
    setEditData(a);
    setForm({
      asset_code: a.asset_code || '',
      name: a.name || '',
      category: a.category || '',
      purchase_date: a.purchase_date ? a.purchase_date.split('T')[0] : '',
      purchase_price: String(a.purchase_price || ''),
      useful_life_years: String(a.useful_life_years || ''),
      residual_value: String(a.residual_value || ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        purchase_price: parseFloat(form.purchase_price) || 0,
        useful_life_years: parseInt(form.useful_life_years) || 0,
        residual_value: parseFloat(form.residual_value) || 0,
      };
      if (editData) {
        await api.put(`/finance/assets/${editData.id}`, payload);
      } else {
        await api.post('/finance/assets', payload);
      }
      setShowModal(false);
      fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan aset tetap');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus aset tetap ini?')) return;
    try {
      await api.delete(`/finance/assets/${id}`);
      fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const handleDepreciate = async (id: number) => {
    if (!confirm('Hitung depresiasi untuk aset ini?')) return;
    try {
      const res = await api.post(`/finance/assets/${id}/depreciate`);
      alert(res.data?.message || 'Depresiasi berhasil dihitung');
      fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghitung depresiasi');
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return { text: 'Aktif', className: 'confirmed' };
      case 'depreciated': return { text: 'Teredepresiasi', className: 'pending' };
      case 'disposed': return { text: 'Dihapuskan', className: 'cancelled' };
      default: return { text: status || 'Aktif', className: 'confirmed' };
    }
  };

  const formatRupiah = (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

  const filtered = assets.filter((a: any) => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.asset_code?.toLowerCase().includes(search.toLowerCase()) || a.category?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Aset Tetap</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Aset</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input type="text" placeholder="Cari aset..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="depreciated">Teredepresiasi</option>
          <option value="disposed">Dihapuskan</option>
        </select>
      </div>

      {assets.length > 0 && (
        <div className="stat-cards" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Aset</div>
            <div className="stat-value">{assets.length}</div>
            <div className="stat-sub">Semua aset tetap</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Nilai Perolehan</div>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {formatRupiah(assets.reduce((sum: number, a: any) => sum + (a.purchase_price || 0), 0))}
            </div>
            <div className="stat-sub">Harga beli seluruh aset</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Nilai Buku</div>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {formatRupiah(assets.reduce((sum: number, a: any) => sum + (a.book_value || a.purchase_price || 0), 0))}
            </div>
            <div className="stat-sub">Setelah depresiasi</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Kode Aset</th>
                <th>Nama Aset</th>
                <th>Kategori</th>
                <th>Tgl. Perolehan</th>
                <th>Harga Perolehan</th>
                <th>Masa Manfaat</th>
                <th>Nilai Residu</th>
                <th>Akum. Depresiasi</th>
                <th>Nilai Buku</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada aset tetap</td></tr>
              ) : (
                filtered.map((a: any) => {
                  const st = statusLabel(a.status);
                  return (
                    <tr key={a.id}>
                      <td style={{ fontFamily: 'monospace', color: '#a8a4a0', fontSize: 13 }}>{a.asset_code || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{a.name}</td>
                      <td><span className="status-badge completed">{a.category || '-'}</span></td>
                      <td style={{ color: '#a8a4a0', fontSize: 13 }}>
                        {a.purchase_date ? new Date(a.purchase_date).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td style={{ color: '#e8a87c' }}>{formatRupiah(a.purchase_price)}</td>
                      <td>{a.useful_life_years ? `${a.useful_life_years} thn` : '-'}</td>
                      <td style={{ color: '#a8a4a0' }}>{formatRupiah(a.residual_value)}</td>
                      <td style={{ color: '#e06c6c' }}>{formatRupiah(a.accumulated_depreciation)}</td>
                      <td style={{ fontWeight: 600, color: '#4caf7d' }}>{formatRupiah(a.book_value || a.purchase_price)}</td>
                      <td><span className={`status-badge ${st.className}`}>{st.text}</span></td>
                      <td>
                        <button className="btn btn-sm btn-success" onClick={() => handleDepreciate(a.id)} style={{ marginRight: 4, marginBottom: 4 }}>
                          Depresiasi
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(a)} style={{ marginRight: 4, marginBottom: 4 }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Hapus</button>
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
            <h2>{editData ? 'Edit Aset Tetap' : 'Tambah Aset Tetap'}</h2>
            <div className="form-group">
              <label>Kode Aset *</label>
              <input type="text" value={form.asset_code} onChange={(e) => setForm({ ...form, asset_code: e.target.value })} placeholder="Contoh: AST-001" />
            </div>
            <div className="form-group">
              <label>Nama Aset *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Meja Resepsionis" />
            </div>
            <div className="form-group">
              <label>Kategori</label>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Contoh: Furniture, Elektronik" />
            </div>
            <div className="form-group">
              <label>Tanggal Perolehan</label>
              <input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Harga Perolehan (Rp) *</label>
              <input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} placeholder="5000000" />
            </div>
            <div className="form-group">
              <label>Masa Manfaat (Tahun) *</label>
              <input type="number" value={form.useful_life_years} onChange={(e) => setForm({ ...form, useful_life_years: e.target.value })} placeholder="5" />
            </div>
            <div className="form-group">
              <label>Nilai Residu (Rp)</label>
              <input type="number" value={form.residual_value} onChange={(e) => setForm({ ...form, residual_value: e.target.value })} placeholder="0" />
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
