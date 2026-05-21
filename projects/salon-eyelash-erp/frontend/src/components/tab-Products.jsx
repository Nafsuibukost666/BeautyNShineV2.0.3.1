import { useState, useEffect } from 'react';
import api from '../api';
import { fmtRp, esc } from '../utils/format';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // Add product form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    product_name: '', category: '', sku: '', cost_price: 0,
    selling_price: 0, stock_qty: 0, min_stock: 5, unit: 'pcs'
  });
  const [saving, setSaving] = useState(false);

  // Bulk upload
  const [showBulk, setShowBulk] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true);
    setStatus({ msg: '', type: '' });
    try {
      const res = await api.get('/api/products');
      const data = res.data?.data || res.data?.products || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setStatus({ msg: 'Gagal memuat produk: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally { setLoading(false); }
  }

  function isLowStock(p) {
    return Number(p.stock_qty || p.stock || 0) <= Number(p.min_stock || 0);
  }

  // ── Add Product ──
  async function saveProduct() {
    if (!addForm.product_name.trim()) {
      setStatus({ msg: 'Nama produk wajib diisi', type: 'error' }); return;
    }
    setSaving(true);
    try {
      await api.post('/api/products', addForm);
      setStatus({ msg: 'Produk berhasil ditambahkan!', type: 'success' });
      setShowAdd(false);
      setAddForm({ product_name: '', category: '', sku: '', cost_price: 0, selling_price: 0, stock_qty: 0, min_stock: 5, unit: 'pcs' });
      loadProducts();
    } catch (e) {
      setStatus({ msg: 'Gagal: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally { setSaving(false); }
  }

  // ── Bulk Upload ──
  function downloadTemplate() {
    const headers = 'product_name,category,sku,cost_price,selling_price,stock_qty,min_stock,unit\n';
    const example = 'Classic Eyelash Glue,Eyelash Extension,GLU-001,50000,150000,20,5,pcs\n';
    const csv = headers + example + 'Silicone Brush,Alat,BR-001,25000,75000,10,3,pcs\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template_produk.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  async function uploadBulk() {
    if (!bulkFile) {
      setStatus({ msg: 'Pilih file CSV terlebih dahulu', type: 'error' }); return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      const res = await api.post('/api/products/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus({ msg: res.data?.message || 'Upload berhasil!', type: 'success' });
      setShowBulk(false);
      setBulkFile(null);
      loadProducts();
    } catch (e) {
      setStatus({ msg: 'Upload gagal: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally { setUploading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stok Produk</h1>
          <p>Manajemen stok produk &amp; bahan baku salon</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <i className="fas fa-plus"></i> Tambah Produk
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBulk(true)}>
            <i className="fas fa-upload"></i> Upload Massal
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadProducts} disabled={loading}>
            {loading ? <span className="spinner"></span> : <><i className="fas fa-sync"></i></>}
          </button>
        </div>
      </div>

      <div className={`status-box show ${status.type}`} style={{ display: status.msg ? 'block' : 'none' }}>
        {status.msg && esc(status.msg)}
      </div>

      {/* Product Table */}
      <div className="card">
        <div className="card-title"><i className="fas fa-boxes"></i> Daftar Produk ({products.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produk</th><th>Kategori</th><th>SKU</th>
                <th className="right">Harga Beli</th><th className="right">Harga Jual</th>
                <th className="right">Stok</th><th className="right">Min</th><th>Unit</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td className="empty" colSpan={9}>{loading ? 'Memuat...' : 'Belum ada produk. Klik "Tambah Produk" untuk memulai.'}</td></tr>
              ) : (
                products.map((p, i) => {
                  const low = isLowStock(p);
                  return (
                    <tr key={p.product_id || p.id || i} style={low ? { background: '#fef2f2' } : {}}>
                      <td><strong>{esc(p.product_name || p.name || '—')}</strong></td>
                      <td>{esc(p.category || '—')}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{esc(p.sku || '—')}</td>
                      <td className="right">{fmtRp(p.cost_price || p.purchase_price || 0)}</td>
                      <td className="right">{fmtRp(p.selling_price || p.price || 0)}</td>
                      <td className="right" style={low ? { color: '#dc2626', fontWeight: 700 } : {}}>{p.stock_qty ?? p.stock ?? 0}</td>
                      <td className="right">{p.min_stock ?? 0}</td>
                      <td>{esc(p.unit || 'pcs')}</td>
                      <td>{low ? <span className="badge cancelled">Stok Menipis</span> : <span className="badge done">Tersedia</span>}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Product Modal ── */}
      {showAdd && (
        <div className="overlay" onClick={() => setShowAdd(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 480, margin: 20 }} onClick={e => e.stopPropagation()}>
            <div className="card-title"><i className="fas fa-plus-circle"></i> Tambah Produk Baru</div>
            <div className="form-group"><label>Nama Produk *</label>
              <input type="text" value={addForm.product_name} onChange={e => setAddForm({ ...addForm, product_name: e.target.value })} placeholder="Contoh: Classic Eyelash Glue" /></div>
            <div className="form-group"><label>Kategori</label>
              <input type="text" value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })} placeholder="Eyelash Extension, Alat, Bahan" /></div>
            <div className="form-group"><label>SKU</label>
              <input type="text" value={addForm.sku} onChange={e => setAddForm({ ...addForm, sku: e.target.value })} placeholder="GLU-001" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Harga Beli (Rp)</label>
                <input type="number" value={addForm.cost_price} onChange={e => setAddForm({ ...addForm, cost_price: Number(e.target.value) })} /></div>
              <div className="form-group"><label>Harga Jual (Rp)</label>
                <input type="number" value={addForm.selling_price} onChange={e => setAddForm({ ...addForm, selling_price: Number(e.target.value) })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Stok Awal</label>
                <input type="number" value={addForm.stock_qty} onChange={e => setAddForm({ ...addForm, stock_qty: Number(e.target.value) })} /></div>
              <div className="form-group"><label>Min Stok</label>
                <input type="number" value={addForm.min_stock} onChange={e => setAddForm({ ...addForm, min_stock: Number(e.target.value) })} /></div>
              <div className="form-group"><label>Unit</label>
                <input type="text" value={addForm.unit} onChange={e => setAddForm({ ...addForm, unit: e.target.value })} /></div>
            </div>
            <div className="flex" style={{ marginTop: 18, gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Batal</button>
              <button className="btn btn-primary" onClick={saveProduct} disabled={saving} style={{ flex: 1 }}>
                {saving ? <span className="spinner"></span> : <><i className="fas fa-save"></i> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Upload Modal ── */}
      {showBulk && (
        <div className="overlay" onClick={() => setShowBulk(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 480, margin: 20 }} onClick={e => e.stopPropagation()}>
            <div className="card-title"><i className="fas fa-upload"></i> Upload Massal Produk</div>
            <div style={{ marginBottom: 20, padding: 16, background: '#FFF5F5', borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>
              <strong>Langkah upload:</strong>
              <ol style={{ margin: '8px 0 0 20px', color: '#8A7A7A' }}>
                <li>Download template CSV terlebih dahulu</li>
                <li>Isi data produk di file CSV</li>
                <li>Upload file CSV yang sudah diisi</li>
              </ol>
            </div>
            <button className="btn btn-secondary btn-full" onClick={downloadTemplate} style={{ marginBottom: 18 }}>
              <i className="fas fa-download"></i> Download Template CSV
            </button>
            <div className="form-group">
              <label>Pilih File CSV</label>
              <input type="file" accept=".csv,.xlsx" onChange={e => setBulkFile(e.target.files[0])} />
              {bulkFile && <p className="small" style={{ marginTop: 4 }}>{bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)</p>}
            </div>
            <div className="flex" style={{ gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowBulk(false)} style={{ flex: 1 }}>Batal</button>
              <button className="btn btn-primary" onClick={uploadBulk} disabled={uploading} style={{ flex: 1 }}>
                {uploading ? <><span className="spinner"></span> Upload...</> : <><i className="fas fa-cloud-upload-alt"></i> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
