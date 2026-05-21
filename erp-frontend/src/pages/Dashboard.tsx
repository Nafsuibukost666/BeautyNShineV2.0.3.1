import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

const chartTooltipStyle = {
  contentStyle: { background: '#1e1e2e', border: '1px solid #2e2e3e', borderRadius: 8, color: '#f0ece4' },
  labelStyle: { color: '#a8a4a0' },
};

const formatRp = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID');

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState<any>({});
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
      const res = await api.get('/reports/dashboard-summary', { params: { start_date: sevenDaysAgo, end_date: today } });
      const data = res.data?.data || {};
      setKpis(data.kpis || {});
      setRecentTx(data.recent_transactions || []);
      setDailySales(data.daily_sales || []);
      setLowStock(data.low_stock_products || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat dashboard...</span></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard ERP</h1>
        <span style={{ color: '#6b6865', fontSize: 14 }}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Omzet 7 Hari</div>
          <div className="stat-value">{formatRp(kpis.sales_total)}</div>
          <div className="stat-sub">Sales posted</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Omzet Hari Ini</div>
          <div className="stat-value">{formatRp(kpis.today_sales_total)}</div>
          <div className="stat-sub">Hari berjalan</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sales Order</div>
          <div className="stat-value">{kpis.sales_order_count || 0}</div>
          <div className="stat-sub">Avg {formatRp(kpis.average_order_value)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value">{kpis.low_stock_count || 0}</div>
          <div className="stat-sub">Perlu perhatian</div>
        </div>
      </div>

      <div className="stat-cards" style={{ marginTop: 0 }}>
        <div className="stat-card"><div className="stat-label">Produk Aktif</div><div className="stat-value">{kpis.active_products || 0}</div><div className="stat-sub">Master product</div></div>
        <div className="stat-card"><div className="stat-label">Customer Aktif</div><div className="stat-value">{kpis.active_customers || 0}</div><div className="stat-sub">Master customer</div></div>
        <div className="stat-card"><div className="stat-label">Supplier Aktif</div><div className="stat-value">{kpis.active_suppliers || 0}</div><div className="stat-sub">Master supplier</div></div>
        <div className="stat-card"><div className="stat-label">Purchase Total</div><div className="stat-value">{formatRp(kpis.purchase_total)}</div><div className="stat-sub">{kpis.purchase_order_count || 0} PO</div></div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f0ece4' }}>Grafik Penjualan (7 Hari Terakhir)</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e3e" />
              <XAxis dataKey="date" tick={{ fill: '#6b6865', fontSize: 12 }} axisLine={{ stroke: '#2e2e3e' }} />
              <YAxis tick={{ fill: '#6b6865', fontSize: 12 }} axisLine={{ stroke: '#2e2e3e' }} tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}jt`} />
              <Tooltip contentStyle={chartTooltipStyle.contentStyle} labelStyle={chartTooltipStyle.labelStyle} formatter={(value: number) => [formatRp(value), 'Omzet']} />
              <Bar dataKey="sales_total" fill="#e8a87c" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f0ece4' }}>Transaksi Terbaru</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>No. Dokumen</th><th>Tipe</th><th>Total</th><th>Status</th><th>Tanggal</th></tr></thead>
              <tbody>{recentTx.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Belum ada transaksi</td></tr> : recentTx.map((tx: any, i: number) => (
                <tr key={`${tx.type}-${tx.number}-${i}`}>
                  <td style={{ color: '#6b6865', fontFamily: 'monospace', fontSize: 12 }}>{tx.number}</td>
                  <td><span className={`status-badge ${tx.type === 'SALE' ? 'completed' : 'pending'}`}>{tx.type}</span></td>
                  <td style={{ fontWeight: 600 }}>{formatRp(tx.total_amount)}</td>
                  <td><span className={`status-badge ${tx.status?.toLowerCase() === 'posted' || tx.status?.toLowerCase() === 'received' ? 'completed' : 'pending'}`}>{tx.status}</span></td>
                  <td style={{ color: '#6b6865', fontSize: 12 }}>{tx.date}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f0ece4' }}>Low Stock</h3>
          {lowStock.length === 0 ? <p style={{ color: '#6b6865' }}>Tidak ada produk low stock.</p> : lowStock.map((p: any) => (
            <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid #2e2e3e' }}>
              <div style={{ color: '#f0ece4', fontWeight: 600 }}>{p.name}</div>
              <div style={{ color: '#6b6865', fontSize: 12 }}>Stok {p.stock_qty} / Min {p.min_stock}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
