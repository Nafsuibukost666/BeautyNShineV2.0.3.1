import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function StockCard() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { fetchCards(); }, [period, productFilter]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/master/products', { params: { per_page: 200 } });
      setProducts(res.data?.data?.items || []);
    } catch (_) {}
  };

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (period) params.period = period;
      if (productFilter) params.product_id = productFilter;
      const res = await api.get('/inventory/stock-cards', { params });
      setCards(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat kartu stok');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: any) => `Rp ${(parseInt(v) || 0).toLocaleString('id-ID')}`;

  if (loading && cards.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Kartu Stok</h1>
        <button className="btn btn-secondary" onClick={fetchCards} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
          <option value="">Semua Produk</option>
          {products.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name} ({p.sku || p.id})</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Periode (contoh: 2026-05)"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ maxWidth: 200 }}
        />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Periode</th>
                <th>Stok Awal</th>
                <th>Masuk</th>
                <th>Keluar</th>
                <th>Adjustment</th>
                <th>Stok Akhir</th>
                <th>Rata-rata Harga</th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada data kartu stok</td></tr>
              ) : (
                cards.map((c: any, idx: number) => (
                  <tr key={c.id || idx}>
                    <td style={{ fontWeight: 600 }}>
                      {c.product?.name || `Produk #${c.product_id}`}
                      <span style={{ display: 'block', color: '#a8a4a0', fontSize: 11 }}>{c.product?.sku || ''}</span>
                    </td>
                    <td><span className="status-badge completed">{c.period_code || '-'}</span></td>
                    <td style={{ fontWeight: 600 }}>{c.opening_qty ?? 0}</td>
                    <td style={{ color: '#4caf7d' }}>+{c.in_qty ?? 0}</td>
                    <td style={{ color: '#e06c6c' }}>-{c.out_qty ?? 0}</td>
                    <td style={{ color: '#e8a87c' }}>{c.adjustment_qty ?? 0}</td>
                    <td style={{ fontWeight: 600, color: '#e8a87c' }}>{c.closing_qty ?? 0}</td>
                    <td>{fmt(c.avg_unit_cost)}</td>
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
