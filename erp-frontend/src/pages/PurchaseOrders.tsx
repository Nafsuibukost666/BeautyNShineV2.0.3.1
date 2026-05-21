import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ supplier_id: '', order_date: new Date().toISOString().slice(0, 10), expected_date: '', notes: '' });
  const [items, setItems] = useState<any[]>([{ product_id: '', quantity: '1', unit_cost: '0', notes: '' }]);

  useEffect(() => { init(); }, []);

  const init = async () => {
    await Promise.all([fetchOrders(), fetchMasters()]);
  };

  const fetchMasters = async () => {
    const [s, p] = await Promise.all([api.get('/suppliers'), api.get('/master/products')]);
    setSuppliers(s.data?.data || []);
    setProducts(p.data?.data?.items || []);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase-orders');
      setOrders(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat purchase order');
    } finally { setLoading(false); }
  };

  const openAdd = () => {
    setSelected(null);
    setForm({ supplier_id: '', order_date: new Date().toISOString().slice(0, 10), expected_date: '', notes: '' });
    setItems([{ product_id: '', quantity: '1', unit_cost: '0', notes: '' }]);
    setShowModal(true);
  };

  const addLine = () => setItems([...items, { product_id: '', quantity: '1', unit_cost: '0', notes: '' }]);
  const removeLine = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: any) => setItems(items.map((it, i) => i === idx ? { ...it, ...patch } : it));

  const handleSave = async () => {
    const payload = {
      supplier_id: parseInt(form.supplier_id),
      order_date: form.order_date,
      expected_date: form.expected_date || null,
      notes: form.notes,
      items: items.map((it) => ({ product_id: parseInt(it.product_id), quantity: parseInt(it.quantity) || 1, unit_cost: parseInt(it.unit_cost) || 0, notes: it.notes || null })),
    };
    try {
      await api.post('/purchase-orders', payload);
      setShowModal(false);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.message || 'Gagal menyimpan PO');
    }
  };

  const action = async (po: any, type: 'order' | 'cancel') => {
    try {
      await api.post(`/purchase-orders/${po.id}/${type}`);
      fetchOrders();
    } catch (err: any) { alert(err.response?.data?.detail || 'Gagal update status'); }
  };

  const receiveAll = async (po: any) => {
    try {
      const full = await api.get(`/purchase-orders/${po.id}`);
      const data = full.data.data;
      const receiveItems = data.items
        .filter((it: any) => it.quantity > it.received_quantity)
        .map((it: any) => ({ item_id: it.id, quantity: it.quantity - it.received_quantity }));
      if (receiveItems.length === 0) return alert('Semua item sudah diterima');
      await api.post(`/purchase-orders/${po.id}/receive`, { receive_date: new Date().toISOString().slice(0, 10), notes: 'Receive all from ERP UI', items: receiveItems });
      fetchOrders();
    } catch (err: any) { alert(err.response?.data?.detail || 'Gagal receive goods'); }
  };

  if (loading && orders.length === 0) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Purchase Order</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Buat PO</button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="card"><div className="table-container"><table>
        <thead><tr><th>No. PO</th><th>Supplier</th><th>Tanggal</th><th>Status</th><th>Total</th><th>Aksi</th></tr></thead>
        <tbody>{orders.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Belum ada PO</td></tr> : orders.map((po) => (
          <tr key={po.id}>
            <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{po.po_number}</td>
            <td>{po.supplier?.name || suppliers.find((s) => s.id === po.supplier_id)?.name || '-'}</td>
            <td>{po.order_date}</td>
            <td><span className="status-badge completed">{po.status}</span></td>
            <td style={{ fontWeight: 600, color: '#e8a87c' }}>Rp {(po.total_amount || 0).toLocaleString('id-ID')}</td>
            <td>
              {po.status === 'DRAFT' && <button className="btn btn-sm btn-secondary" onClick={() => action(po, 'order')} style={{ marginRight: 6 }}>Order</button>}
              {(po.status === 'ORDERED' || po.status === 'PARTIAL_RECEIVED') && <button className="btn btn-sm btn-primary" onClick={() => receiveAll(po)} style={{ marginRight: 6 }}>Receive All</button>}
              {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && <button className="btn btn-sm btn-danger" onClick={() => action(po, 'cancel')}>Cancel</button>}
            </td>
          </tr>
        ))}</tbody>
      </table></div></div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
          <h2>Buat Purchase Order</h2>
          <div className="form-group"><label>Supplier *</label><select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}><option value="">Pilih Supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="form-group"><label>Tanggal PO</label><input type="date" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} /></div>
          <div className="form-group"><label>Expected Date</label><input type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} /></div>
          <div className="form-group"><label>Catatan</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <h3>Items</h3>
          {items.map((it, idx) => <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 60px', gap: 8, marginBottom: 8 }}>
            <select value={it.product_id} onChange={(e) => updateLine(idx, { product_id: e.target.value })}><option value="">Produk</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <input type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} />
            <input type="number" placeholder="Harga" value={it.unit_cost} onChange={(e) => updateLine(idx, { unit_cost: e.target.value })} />
            <button className="btn btn-sm btn-danger" onClick={() => removeLine(idx)}>X</button>
          </div>)}
          <button className="btn btn-secondary" onClick={addLine}>+ Tambah Item</button>
          <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary" onClick={handleSave}>Simpan PO</button></div>
        </div>
      </div>}
    </div>
  );
}
