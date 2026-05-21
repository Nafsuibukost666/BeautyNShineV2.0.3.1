import { useState, useEffect } from 'react';
import api from '../api';
import { fmtRp, esc, today } from '../utils/format';

export default function Laporan() {
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [pingResult, setPingResult] = useState('');
  const [status, setStatus] = useState({ msg: '', type: '' });

  // Summary
  const [summary, setSummary] = useState({ transactions: 0, omzet: 0, paid: 0, unpaid: 0 });

  // Breakdown arrays
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [therapistPerformance, setTherapistPerformance] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [servicesSold, setServicesSold] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Export modules
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [activeModule, setActiveModule] = useState('transactions');
  const [profitLoss, setProfitLoss] = useState(null);
  const [rangeSummary, setRangeSummary] = useState(null); // data untuk filter periode

  useEffect(() => {
    const d = today();
    setDate(d);
    rptLoad(d);
  }, []);

  async function rptLoad(d) {
    const targetDate = d || date;
    if (!targetDate) { setStatus({ msg: 'Pilih tanggal terlebih dahulu', type: 'error' }); return; }
    setLoading(true);
    setStatus({ msg: '', type: '' });
    try {
      const res = await api.get('/api/report/daily/' + targetDate);
      const data = res.data || {};
      setSummary(data.summary || { transaction_count: 0, grand_total: 0, total_paid: 0, unpaid_amount: 0 });
      // Arrays
      setPaymentBreakdown(data.payment_breakdown || []);
      setTherapistPerformance(data.therapist_breakdown || []);
      setCommissions(data.commission_breakdown || []);
      setServicesSold(data.service_breakdown || []);
      setTransactions(data.transactions || []);
      setStatus({ msg: 'Laporan ' + targetDate + ' berhasil dimuat', type: 'success' });
    } catch (e) {
      setStatus({ msg: 'Gagal: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally { setLoading(false); }
  }

  async function rptPing() {
    setPingResult('');
    try {
      const res = await api.get('/api/report/ping');
      setPingResult('Ping OK: ' + JSON.stringify(res.data));
    } catch (e) { setPingResult('Ping GAGAL: ' + (e.response?.data?.message || e.message)); }
  }

  const loadProfitLoss = async () => {
    try {
      const res = await api.get(`/api/report/profit-loss?start_date=${startDate}&end_date=${endDate}`);
      setProfitLoss(res.data.data);
    } catch (e) { /* silent */ }
  };

  const loadRangeData = async () => {
    if (!startDate || !endDate) {
      setStatus({ msg: 'Pilih tanggal mulai dan selesai', type: 'error' });
      return;
    }
    setLoading(true);
    setRangeSummary(null);
    setStatus({ msg: '', type: '' });
    try {
      const [txRes, plRes] = await Promise.all([
        api.get(`/api/report/range?start_date=${startDate}&end_date=${endDate}`),
        api.get(`/api/report/profit-loss?start_date=${startDate}&end_date=${endDate}`)
      ]);
      const txData = txRes.data || {};
      const plData = plRes.data?.data || {};
      setRangeSummary({
        transactions: txData.transaction_count || 0,
        omzet: txData.grand_total || 0,
        expenses: plData.expenses || 0,
        profit: plData.profit || 0,
      });
      setStatus({ msg: `Data periode ${startDate} — ${endDate} berhasil dimuat`, type: 'success' });
    } catch (e) {
      setStatus({ msg: 'Gagal memuat data periode: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = (mod, format) => {
    const url = `/api/reports/${mod}/${format}?start_date=${startDate}&end_date=${endDate}`;
    setStatus({ msg: `Mengunduh ${mod} ${format.toUpperCase()}...`, type: 'info' });
    fetch(url, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${mod}-${startDate}-${endDate}.${format === 'excel' ? 'xlsx' : format}`;
        a.click();
        URL.revokeObjectURL(a.href);
        setStatus({ msg: `Download ${mod} ${format.toUpperCase()} berhasil!`, type: 'success' });
      })
      .catch(e => {
        setStatus({ msg: `Download gagal: ${e.message}. Pastikan service reports berjalan.`, type: 'error' });
      });
  };

  return (
    <div>
      {/* ════ Daily Report ════ */}
      <div className="page-header">
        <div>
          <h1>Laporan Harian</h1>
          <p>Rekap transaksi dan performa harian</p>
        </div>
        <div className="page-header-right">
          <div className="flex">
            <input type="date" value={date}
              onChange={e => { setDate(e.target.value); rptLoad(e.target.value); }}
              style={{ width: 'auto', minWidth: 180 }} />
            <button className="btn btn-secondary btn-sm" onClick={() => rptLoad(date)} disabled={loading}>
              {loading ? <span className="spinner"></span> : <><i className="fas fa-sync"></i> Muat</>}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { const d = today(); setDate(d); rptLoad(d); }}>
              <i className="fas fa-calendar-day"></i> Hari Ini
            </button>
            <button className="btn btn-secondary btn-sm" onClick={rptPing} title="Test koneksi">
              <i className="fas fa-plug"></i>
            </button>
          </div>
        </div>
      </div>

      {pingResult && (
        <div className={`status-box show ${pingResult.startsWith('Ping OK') ? 'success' : 'error'}`}>
          {esc(pingResult)}
        </div>
      )}
      <div className={`status-box show ${status.type}`} style={{ display: status.msg ? 'block' : 'none' }}>
        {status.msg && esc(status.msg)}
      </div>

      {/* Stat Cards */}
      <div className="grid-4">
        <div className="stat-card"><div className="stat-label">Transaksi</div><div className="stat-value">{summary.transaction_count || 0}</div></div>
        <div className="stat-card"><div className="stat-label">Omzet</div><div className="stat-value">{fmtRp(summary.grand_total || 0)}</div></div>
        <div className="stat-card"><div className="stat-label">Dibayar</div><div className="stat-value" style={{ color: '#166534' }}>{fmtRp(summary.total_paid || 0)}</div></div>
        <div className="stat-card"><div className="stat-label">Belum Dibayar</div><div className="stat-value" style={{ color: '#991b1b' }}>{fmtRp(summary.unpaid_amount || 0)}</div></div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title"><i className="fas fa-credit-card"></i> Breakdown Pembayaran</div>
            <div className="table-wrap">
              <table><thead><tr><th>Metode</th><th className="right">Total</th><th className="right">Jumlah</th></tr></thead>
                <tbody>{!Array.isArray(paymentBreakdown) || paymentBreakdown.length === 0 ? <tr><td className="empty" colSpan={3}>Tidak ada data</td></tr>
                  : paymentBreakdown.map((pb, i) => <tr key={i}><td>{esc(pb.method || pb.payment_method || '—')}</td><td className="right">{fmtRp(pb.total || 0)}</td><td className="right">{pb.count || 0}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title"><i className="fas fa-user-md"></i> Performa Therapist</div>
            <div className="table-wrap">
              <table><thead><tr><th>Therapist</th><th className="right">Transaksi</th><th className="right">Revenue</th></tr></thead>
                <tbody>{!Array.isArray(therapistPerformance) || therapistPerformance.length === 0 ? <tr><td className="empty" colSpan={3}>Tidak ada data</td></tr>
                  : therapistPerformance.map((tp, i) => <tr key={i}><td>{esc(tp.name || tp.therapist_name || '—')}</td><td className="right">{tp.transactions || 0}</td><td className="right">{fmtRp(tp.revenue || tp.total || 0)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title"><i className="fas fa-coins"></i> Komisi</div>
            <div className="table-wrap">
              <table><thead><tr><th>Therapist</th><th>Layanan</th><th className="right">Komisi</th></tr></thead>
                <tbody>{!Array.isArray(commissions) || commissions.length === 0 ? <tr><td className="empty" colSpan={3}>Tidak ada data</td></tr>
                  : commissions.map((cm, i) => <tr key={i}><td>{esc(cm.therapist || cm.therapist_name || '—')}</td><td>{esc(cm.service || cm.service_name || '—')}</td><td className="right">{fmtRp(cm.commission || cm.amount || 0)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title"><i className="fas fa-concierge-bell"></i> Layanan Terjual</div>
            <div className="table-wrap">
              <table><thead><tr><th>Layanan</th><th className="right">Qty</th><th className="right">Revenue</th></tr></thead>
                <tbody>{!Array.isArray(servicesSold) || servicesSold.length === 0 ? <tr><td className="empty" colSpan={3}>Tidak ada data</td></tr>
                  : servicesSold.map((ss, i) => <tr key={i}><td>{esc(ss.name || ss.service_name || '—')}</td><td className="right">{ss.qty || ss.quantity || 0}</td><td className="right">{fmtRp(ss.revenue || ss.total || 0)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title"><i className="fas fa-receipt"></i> Transaksi</div>
            <div className="table-wrap">
              <table><thead><tr><th>Kode</th><th>Customer</th><th className="right">Total</th><th className="right">Dibayar</th><th>Status</th></tr></thead>
                <tbody>{!Array.isArray(transactions) || transactions.length === 0 ? <tr><td className="empty" colSpan={5}>Tidak ada transaksi</td></tr>
                  : transactions.map((tx, i) => <tr key={tx.id || i}><td>{esc(tx.code || tx.transaction_code || '—')}</td><td>{esc(tx.customer?.name || tx.customer_name || '—')}</td><td className="right">{fmtRp(tx.total || tx.grand_total || 0)}</td><td className="right">{fmtRp(tx.paid || tx.amount_paid || 0)}</td><td><span className={'badge ' + (tx.payment_status || tx.status || 'pending')}>{esc(tx.payment_status || tx.status || 'pending')}</span></td></tr>)}</tbody>
              </table>
            </div>
            {Array.isArray(transactions) && transactions.length > 0 && <p className="small mt-2">Total: {transactions.length} transaksi</p>}
          </div>
        </div>
      </div>

      {/* ════ Export Reports Modules ════ */}
      <div style={{ marginTop: 48 }}>
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--header-font)', fontSize: 22 }}>Ekspor Laporan Lengkap</h2>
            <p>Download data per kategori dalam CSV, Excel, atau PDF</p>
          </div>
        </div>

        {/* Date range filter */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title"><i className="fas fa-calendar-alt"></i> Filter Periode</div>
          <div className="flex" style={{ gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Dari Tanggal</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setProfitLoss(null); setRangeSummary(null); }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setProfitLoss(null); setRangeSummary(null); }} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={loadRangeData} disabled={loading}>
              {loading ? <span className="spinner"></span> : <><i className="fas fa-eye"></i> Tampilkan</>}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { const d = today(); setStartDate(d); setEndDate(d); setRangeSummary(null); }}>
              <i className="fas fa-redo"></i> Hari Ini
            </button>
          </div>

          {/* Range summary stats */}
          {rangeSummary && (
            <div className="grid-4" style={{ marginTop: 20 }}>
              <div className="stat-card"><div className="stat-label">Transaksi</div><div className="stat-value">{rangeSummary.transactions}</div></div>
              <div className="stat-card"><div className="stat-label">Omzet</div><div className="stat-value">{fmtRp(rangeSummary.omzet)}</div></div>
              <div className="stat-card"><div className="stat-label">Pengeluaran</div><div className="stat-value" style={{ color: '#991B1B' }}>{fmtRp(rangeSummary.expenses)}</div></div>
              <div className="stat-card"><div className="stat-label">Laba Bersih</div><div className="stat-value" style={{ color: rangeSummary.profit >= 0 ? '#166534' : '#991B1B' }}>{fmtRp(rangeSummary.profit)}</div></div>
            </div>
          )}
        </div>

        {/* Module selector + download */}
        <div className="card">
          <div className="card-title"><i className="fas fa-download"></i> Pilih Laporan & Download</div>
          <div className="flex" style={{ gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
              <label>Jenis Laporan</label>
              <select value={activeModule} onChange={e => { setActiveModule(e.target.value); if (e.target.value === 'profit-loss') loadProfitLoss(); }}>
                <option value="transactions">Transaksi Penjualan</option>
                <option value="therapist">Performa Therapist</option>
                <option value="services">Layanan Terjual</option>
                <option value="expenses">Pengeluaran</option>
                <option value="profit-loss">Laba Rugi</option>
              </select>
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => downloadExport(activeModule, 'csv')}>
                <i className="fas fa-file-csv"></i> CSV
              </button>
              <button className="btn btn-secondary" onClick={() => downloadExport(activeModule, 'excel')}>
                <i className="fas fa-file-excel"></i> Excel
              </button>
              <button className="btn btn-secondary" onClick={() => downloadExport(activeModule, 'pdf')}>
                <i className="fas fa-file-pdf"></i> PDF
              </button>
            </div>
          </div>

          {/* Profit & Loss preview */}
          {activeModule === 'profit-loss' && profitLoss && (
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div className="stat-card"><div className="stat-label">Pendapatan</div><div className="stat-value" style={{ color: '#166534', fontSize: 20 }}>{profitLoss.revenue_fmt}</div></div>
              <div className="stat-card"><div className="stat-label">Pengeluaran</div><div className="stat-value" style={{ color: '#991B1B', fontSize: 20 }}>{profitLoss.expenses_fmt}</div></div>
              <div className="stat-card"><div className="stat-label">Laba Rugi</div><div className="stat-value" style={{ color: profitLoss.profit >= 0 ? '#166534' : '#991B1B', fontSize: 20 }}>{profitLoss.profit_fmt}</div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
