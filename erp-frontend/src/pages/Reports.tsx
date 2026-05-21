import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

const chartTooltipStyle = {
  contentStyle: { background: '#1e1e2e', border: '1px solid #2e2e3e', borderRadius: 8, color: '#f0ece4' },
  labelStyle: { color: '#a8a4a0' },
};

const formatRp = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID');

type TabKey = 'sales' | 'trial-balance' | 'income-statement' | 'balance-sheet';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'sales', label: 'Penjualan' },
  { key: 'trial-balance', label: 'Neraca Saldo' },
  { key: 'income-statement', label: 'Laba Rugi' },
  { key: 'balance-sheet', label: 'Neraca' },
];

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('sales');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [salesData, setSalesData] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any[]>([]);
  const [incomeStatement, setIncomeStatement] = useState<any[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<any[]>([]);

  useEffect(() => { fetchReports(); }, [dateFrom, dateTo]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = { start_date: dateFrom, end_date: dateTo };
      const asOfParams = { as_of_date: dateTo };
      const [salesRes, tbRes, isRes, bsRes] = await Promise.all([
        api.get('/reports/sales', { params }).catch(() => ({ data: { data: [] } })),
        api.get('/reports/trial-balance', { params: asOfParams }).catch(() => ({ data: { data: [] } })),
        api.get('/reports/income-statement', { params }).catch(() => ({ data: { data: [] } })),
        api.get('/reports/balance-sheet', { params: asOfParams }).catch(() => ({ data: { data: [] } })),
      ]);
      setSalesData(salesRes.data?.data?.periods || []);
      setTrialBalance(tbRes.data?.data?.rows || tbRes.data?.data?.accounts || tbRes.data?.data?.items || []);
      const isData = isRes.data?.data || {};
      setIncomeStatement([...(isData.revenue_items || []), ...(isData.expense_items || [])]);
      const bsData = bsRes.data?.data || {};
      setBalanceSheet([...(bsData.assets?.items || []), ...(bsData.liabilities?.items || []), ...(bsData.equity?.items || [])]);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const getTotals = (data: any[], debitKey = 'debit_total', creditKey = 'credit_total') => ({
    debit: data.reduce((s: number, r: any) => s + (r[debitKey] || 0), 0),
    credit: data.reduce((s: number, r: any) => s + (r[creditKey] || 0), 0),
  });

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat laporan...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Laporan Keuangan</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ maxWidth: 180 }} />
        <span style={{ color: '#6b6865', alignSelf: 'center' }}>s/d</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ maxWidth: 180 }} />
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #2e2e3e', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab.key ? 'rgba(232,168,124,0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #e8a87c' : '2px solid transparent',
              color: activeTab === tab.key ? '#e8a87c' : '#a8a4a0',
              cursor: 'pointer', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>{tab.label}</button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'sales' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f0ece4' }}>Laporan Penjualan</h3>
            {salesData.length === 0 ? (
              <p style={{ color: '#6b6865', textAlign: 'center', padding: 40 }}>Tidak ada data penjualan</p>
            ) : (
              <>
                <div className="table-container" style={{ marginBottom: 20 }}>
                  <table>
                    <thead>
                      <tr><th>Periode</th><th>Transaksi</th><th>Total</th><th>Rata-rata</th></tr>
                    </thead>
                    <tbody>
                      {salesData.map((s: any, i: number) => (
                        <tr key={i}>
                          <td>{s.period_key || '-'}</td>
                          <td>{s.transaction_count || 0}</td>
                          <td style={{ fontWeight: 600, color: '#e8a87c' }}>{formatRp(s.total_amount || 0)}</td>
                          <td>{formatRp(s.average_per_transaction || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2e2e3e" />
                      <XAxis dataKey="period_key" tick={{ fill: '#6b6865', fontSize: 11 }} axisLine={{ stroke: '#2e2e3e' }} />
                      <YAxis tick={{ fill: '#6b6865', fontSize: 11 }} axisLine={{ stroke: '#2e2e3e' }} tickFormatter={(v) => `Rp${(v/1000000).toFixed(1)}jt`} />
                      <Tooltip contentStyle={chartTooltipStyle.contentStyle} labelStyle={chartTooltipStyle.labelStyle} formatter={(v: number) => [formatRp(v), 'Total']} />
                      <Bar dataKey="total_amount" fill="#e8a87c" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'trial-balance' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f0ece4' }}>Neraca Saldo</h3>
            {trialBalance.length === 0 ? (
              <p style={{ color: '#6b6865', textAlign: 'center', padding: 40 }}>Tidak ada data</p>
            ) : (
              <>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Kode</th><th>Nama Akun</th><th style={{ textAlign: 'right' }}>Debit</th><th style={{ textAlign: 'right' }}>Kredit</th></tr>
                    </thead>
                    <tbody>
                      {trialBalance.map((r: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'monospace', color: '#6b6865', fontSize: 12 }}>{r.account_code || r.code || '-'}</td>
                          <td style={{ fontWeight: 500 }}>{r.account_name || r.name || '-'}</td>
                          <td style={{ textAlign: 'right', color: r.debit_total ? '#4caf7d' : '#6b6865' }}>{r.debit_total ? formatRp(r.debit_total) : '-'}</td>
                          <td style={{ textAlign: 'right', color: r.credit_total ? '#e06c6c' : '#6b6865' }}>{r.credit_total ? formatRp(r.credit_total) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#24243a' }}>
                        <td colSpan={2} style={{ fontWeight: 700 }}>Total</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#4caf7d' }}>{formatRp(getTotals(trialBalance).debit)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#e06c6c' }}>{formatRp(getTotals(trialBalance).credit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'income-statement' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f0ece4' }}>Laporan Laba Rugi</h3>
            {incomeStatement.length === 0 ? (
              <p style={{ color: '#6b6865', textAlign: 'center', padding: 40 }}>Tidak ada data</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Kode</th><th>Nama Akun</th><th style={{ textAlign: 'right' }}>Saldo</th></tr>
                  </thead>
                  <tbody>
                    {incomeStatement.map((r: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'monospace', color: '#6b6865', fontSize: 12 }}>{r.account_code || r.code || '-'}</td>
                        <td style={{ fontWeight: 500 }}>{r.account_name || r.name || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: (r.balance || r.amount || 0) > 0 ? '#4caf7d' : '#e06c6c' }}>
                          {formatRp(r.balance || r.amount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'balance-sheet' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f0ece4' }}>Neraca</h3>
            {balanceSheet.length === 0 ? (
              <p style={{ color: '#6b6865', textAlign: 'center', padding: 40 }}>Tidak ada data</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Kode</th><th>Nama Akun</th><th style={{ textAlign: 'right' }}>Saldo</th></tr>
                  </thead>
                  <tbody>
                    {balanceSheet.map((r: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'monospace', color: '#6b6865', fontSize: 12 }}>{r.account_code || r.code || '-'}</td>
                        <td style={{ fontWeight: 500 }}>{r.account_name || r.name || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#e8a87c' }}>{formatRp(r.balance || r.amount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
