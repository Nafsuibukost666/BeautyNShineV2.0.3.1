import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', category: '', sub_category: '', unit: '', sku: '',
    cost_price: '', selling_price: '', min_stock: '',
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/master/products', { params });
      setProducts(res.data?.data?.items || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  const openAdd = () => {
    setEditData(null);
    setForm({ name: '', category: '', sub_category: '', unit: '', sku: '', cost_price: '', selling_price: '', min_stock: '' });
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditData(p);
    setForm({
      name: p.name || '',
      category: p.category || '',
      sub_category: p.sub_category || '',
      unit: p.unit || '',
      sku: p.sku || '',
      cost_price: String(p.cost_price || ''),
      selling_price: String(p.selling_price || ''),
      min_stock: String(p.min_stock || ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        category: form.category,
        sub_category: form.sub_category,
        unit: form.unit,
        sku: form.sku,
        cost_price: parseInt(form.cost_price) || 0,
        selling_price: parseInt(form.selling_price) || 0,
        min_stock: parseInt(form.min_stock) || 0,
      };
      if (editData) {
        await api.put(`/master/products/${editData.id}`, payload);
      } else {
        await api.post('/master/products', payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan produk');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await api.delete(`/master/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus produk');
    }
  };

  const isLowStock = (p: any) => {
    const min = parseInt(p.min_stock) || 0;
    return min > 0;
  };

  const categories = [...new Set(products.map((p: any) => p.category).filter(Boolean))];

  if (loading && products.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Produk</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Produk</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((cat: string) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>SKU</th>
                <th>Kategori</th>
                <th>Sub Kategori</th>
                <th>Satuan</th>
                <th>Harga Modal</th>
                <th>Harga Jual</th>
                <th>Min. Stok</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada produk</td></tr>
              ) : (
                products.map((p: any) => {
                  const lowStock = isLowStock(p);
                  return (
                    <tr key={p.id} style={lowStock ? { background: 'rgba(224,108,108,0.05)' } : {}}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ color: '#a8a4a0', fontFamily: 'monospace', fontSize: 13 }}>{p.sku || '-'}</td>
                      <td><span className="status-badge completed">{p.category || '-'}</span></td>
                      <td style={{ color: '#a8a4a0' }}>{p.sub_category || '-'}</td>
                      <td>{p.unit || '-'}</td>
                      <td style={{ color: '#a8a4a0' }}>Rp {(p.cost_price || 0).toLocaleString('id-ID')}</td>
                      <td style={{ fontWeight: 600, color: '#e8a87c' }}>Rp {(p.selling_price || 0).toLocaleString('id-ID')}</td>
                      <td style={{ fontWeight: 600, color: lowStock ? '#e06c6c' : '#4caf7d' }}>
                        {p.min_stock ?? 0}
                        {lowStock && <span style={{ marginLeft: 6, fontSize: 11 }} title="Stok menipis">⚠️</span>}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)} style={{ marginRight: 6 }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Hapus</button>
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
            <h2>{editData ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <div className="form-group">
              <label>Nama Produk *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama produk" />
            </div>
            <div className="form-group">
              <label>SKU</label>
              <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" />
            </div>
            <div className="form-group">
              <label>Kategori</label>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Skincare, Tools, dll" />
            </div>
            <div className="form-group">
              <label>Sub Kategori</label>
              <input type="text" value={form.sub_category} onChange={(e) => setForm({ ...form, sub_category: e.target.value })} placeholder="Sub kategori" />
            </div>
            <div className="form-group">
              <label>Satuan</label>
              <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, botol, tube" />
            </div>
            <div className="form-group">
              <label>Harga Modal (Rp)</label>
              <input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="25000" />
            </div>
            <div className="form-group">
              <label>Harga Jual (Rp) *</label>
              <input type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} placeholder="50000" />
            </div>
            <div className="form-group">
              <label>Min. Stok (peringatan)</label>
              <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} placeholder="2" />
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
