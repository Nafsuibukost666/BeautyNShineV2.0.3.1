import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export default function SalesOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customer_id: '', sales_date: new Date().toISOString().slice(0, 10), payment_method: 'CASH', discount_amount: '0', tax_amount: '0', notes: '' });
  const [items, setItems] = useState<any[]>([{ product_id: '', quantity: '1', unit_price: '0', discount_amount: '0', notes: '' }]);

  useEffect(() => { init(); }, []);

  const init = async () => {
    await Promise.all([fetchOrders(), fetchMasters()]);
  };

  const fetchMasters = async () => {
    const [c, p] = await Promise.all([api.get('/customers'), api.get('/master/products')]);
    setCustomers(c.data?.data || []);
    setProducts(p.data?.data?.items || []);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales-orders');
      setOrders(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat sales order');
    } finally { setLoading(false); }
  };

  const openAdd = () => {
    setForm({ customer_id: '', sales_date: new Date().toISOString().slice(0, 10), payment_method: 'CASH', discount_amount: '0', tax_amount: '0', notes: '' });
    setItems([{ product_id: '', quantity: '1', unit_price: '0', discount_amount: '0', notes: '' }]);
    setShowModal(true);
  };

  const addLine = () => setItems([...items, { product_id: '', quantity: '1', unit_price: '0', discount_amount: '0', notes: '' }]);
  const removeLine = (idx: number) => setItems(items.length === 1 ? items : items.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: any) => setItems(items.map((it, i) => i === idx ? { ...it, ...patch } : it));

  const pickProduct = (idx: number, productId: string) => {
    const product = products.find((p) => String(p.id) === String(productId));
    updateLine(idx, { product_id: productId, unit_price: String(product?.selling_price || 0) });
  };

  const handleSave = async () => {
    const payload = {
      customer_id: form.customer_id ? parseInt(form.customer_id) : null,
      sales_date: form.sales_date,
      payment_method: form.payment_method,
      discount_amount: parseInt(form.discount_amount) || 0,
      tax_amount: parseInt(form.tax_amount) || 0,
      notes: form.notes,
      items: items.map((it) => ({
        product_id: parseInt(it.product_id),
        quantity: parseInt(it.quantity) || 1,
        unit_price: parseInt(it.unit_price) || 0,
        discount_amount: parseInt(it.discount_amount) || 0,
        notes: it.notes || null,
      })),
    };
    try {
      await api.post('/sales-orders', payload);
      setShowModal(false);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.message || 'Gagal menyimpan sales order');
    }
  };

  const action = async (so: any, type: 'post' | 'cancel') => {
    try {
      await api.post(`/sales-orders/${so.id}/${type}`);
      fetchOrders();
    } catch (err: any) { alert(err.response?.data?.detail || 'Gagal update status'); }
  };

  if (loading && orders.length === 0) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Sales Order</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Buat Sales</button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="card"><div className="table-container"><table>
        <thead><tr><th>No. Sales</th><th>Customer</th><th>Tanggal</th><th>Payment</th><th>Status</th><th>Total</th><th>Aksi</th></tr></thead>
        <tbody>{orders.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Belum ada sales order</td></tr> : orders.map((so) => (
          <tr key={so.id}>
            <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{so.sales_number}</td>
            <td>{so.customer?.name || customers.find((c) => c.id === so.customer_id)?.name || 'Walk-in'}</td>
            <td>{so.sales_date}</td>
            <td>{so.payment_method || '-'}</td>
            <td><span className="status-badge completed">{so.status}</span></td>
            <td style={{ fontWeight: 600, color: '#e8a87c' }}>Rp {(so.total_amount || 0).toLocaleString('id-ID')}</td>
            <td>
              {so.status === 'DRAFT' && <button className="btn btn-sm btn-primary" onClick={() => action(so, 'post')} style={{ marginRight: 6 }}>Post</button>}
              {so.status === 'DRAFT' && <button className="btn btn-sm btn-danger" onClick={() => action(so, 'cancel')}>Cancel</button>}
            </td>
          </tr>
        ))}</tbody>
      </table></div></div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>
          <h2>Buat Sales Order</h2>
          <div className="form-group"><label>Customer</label><select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}><option value="">Walk-in Customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="form-group"><label>Tanggal Sales</label><input type="date" value={form.sales_date} onChange={(e) => setForm({ ...form, sales_date: e.target.value })} /></div>
          <div className="form-group"><label>Payment Method</label><select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}><option value="CASH">Cash</option><option value="TRANSFER">Transfer</option><option value="QRIS">QRIS</option><option value="CARD">Card</option></select></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label>Diskon Header</label><input type="number" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} /></div>
            <div className="form-group"><label>Pajak</label><input type="number" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: e.target.value })} /></div>
          </div>
          <div className="form-group"><label>Catatan</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <h3>Items</h3>
          {items.map((it, idx) => <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 120px 60px', gap: 8, marginBottom: 8 }}>
            <select value={it.product_id} onChange={(e) => pickProduct(idx, e.target.value)}><option value="">Produk</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <input type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} />
            <input type="number" placeholder="Harga" value={it.unit_price} onChange={(e) => updateLine(idx, { unit_price: e.target.value })} />
            <input type="number" placeholder="Diskon" value={it.discount_amount} onChange={(e) => updateLine(idx, { discount_amount: e.target.value })} />
            <button className="btn btn-sm btn-danger" onClick={() => removeLine(idx)}>X</button>
          </div>)}
          <button className="btn btn-secondary" onClick={addLine}>+ Tambah Item</button>
          <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary" onClick={handleSave}>Simpan Sales</button></div>
        </div>
      </div>}
    </div>
  );
}
