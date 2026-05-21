import { useState, useEffect } from 'react';
import api from '../api';
import { fmtRp, esc, today, nowTime } from '../utils/format';

export default function POS() {
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // Customer & transaction
  const [customer, setCustomer] = useState({ name: '', phone: '', instagram: '' });
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [cart, setCart] = useState([]);

  // Payment
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  // Receipt
  const [receipt, setReceipt] = useState(null);
  const [receiptCode, setReceiptCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const res = await api.get('/api/pos/initial-data');
      setServices(res.data.services || []);
      setStaff(res.data.staff || []);
      const methods = res.data.payment_methods || [];
      setPaymentMethods(methods);
      if (methods.length > 0) setPaymentMethod(methods[0]);
    } catch (e) {
      setStatus({ msg: 'Gagal memuat data awal: ' + (e.response?.data?.message || e.message), type: 'error' });
    }
  }

  function addToCart() {
    if (!selectedService) {
      setStatus({ msg: 'Pilih layanan terlebih dahulu', type: 'error' });
      return;
    }
    const svc = services.find(s => String(s.service_id) === String(selectedService));
    if (!svc) return;
    const existing = cart.find(
      c => String(c.item_id_ref) === String(svc.service_id) && c.item_type === 'service'
    );
    if (existing) {
      setCart(cart.map(c =>
        String(c.item_id_ref) === String(svc.service_id) && c.item_type === 'service'
          ? { ...c, qty: c.qty + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        item_type: 'service',
        item_id_ref: svc.service_id,
        item_name: svc.service_name,
        qty: 1,
        unit_price: svc.price || 0,
        discount: 0,
        staff_id: selectedStaff || null,
      }]);
    }
    setSelectedService('');
  }

  function removeFromCart(index) {
    setCart(cart.filter((_, i) => i !== index));
  }

  function updateCartItem(index, field, value) {
    setCart(cart.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }

  function subtotal() {
    return cart.reduce((sum, item) => sum + item.unit_price * item.qty - item.discount, 0);
  }

  function totalAfterDiscount() {
    const st = subtotal();
    const discVal = Number(discount) || 0;
    return Math.max(0, st - discVal);
  }

  async function posSave() {
    if (cart.length === 0) {
      setStatus({ msg: 'Keranjang masih kosong', type: 'error' });
      return;
    }
    if (!paymentMethod) {
      setStatus({ msg: 'Pilih metode pembayaran', type: 'error' });
      return;
    }
    setLoading(true);
    setStatus({ msg: '', type: '' });
    try {
      const discVal = Number(discount) || 0;
      const payload = {
        customer: customer,
        staff_id: selectedStaff,
        discount: discVal,
        tax: 0,
        items: cart.map(c => ({
          item_type: c.item_type,
          item_id_ref: c.item_id_ref,
          item_name: c.item_name,
          qty: c.qty,
          unit_price: c.unit_price,
          discount: c.discount,
          staff_id: c.staff_id,
        })),
        payment: {
          method: paymentMethod,
          amount: Number(amountPaid) || 0,
        },
      };
      const res = await api.post('/api/pos/transaction', payload);
      setStatus({ msg: 'Transaksi berhasil! Kode: ' + (res.data.transaction_id || res.data.code), type: 'success' });

      // Fetch full receipt data
      const code = res.data.transaction_id || res.data.code;
      setReceiptCode(code || '');
      if (code) {
        try {
          const r = await api.get('/api/pos/receipt/' + encodeURIComponent(code));
          setReceipt(r.data);
        } catch {
          setReceipt(res.data);
        }
      } else {
        setReceipt(res.data);
      }
      // Reset form
      setCustomer({ name: '', phone: '', instagram: '' });
      setSelectedStaff('');
      setCart([]);
      setDiscount('');
      setAmountPaid('');
    } catch (e) {
      setStatus({ msg: 'Gagal menyimpan transaksi: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function posLoadReceipt() {
    if (!receiptCode) {
      setStatus({ msg: 'Masukkan kode receipt', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/api/pos/receipt/' + encodeURIComponent(receiptCode));
      setReceipt(res.data);
      setStatus({ msg: 'Receipt ditemukan', type: 'success' });
    } catch (e) {
      setStatus({ msg: 'Receipt tidak ditemukan: ' + (e.response?.data?.message || e.message), type: 'error' });
      setReceipt(null);
    } finally {
      setLoading(false);
    }
  }

  function printReceipt() {
    window.print();
  }

  function shareWhatsApp() {
    const r = receipt;
    if (!r) return;
    let txt = '✨ *' + (r.business_name || 'Salon Eyelash') + '* ✨\n';
    txt += '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n';
    txt += '🧾 *STRUK TRANSAKSI*\n';
    txt += '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n';
    txt += 'No: ' + (r.transaction_id || '') + '\n';
    txt += '📅 ' + (r.transaction_date ? new Date(r.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '') + '\n';
    if (r.customer_name) txt += '👤 *Customer:* ' + r.customer_name + '\n';
    if (r.staff_name) txt += '💇 *Therapist:* ' + r.staff_name + '\n';
    txt += '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n';
    (Array.isArray(r.items) ? r.items : []).forEach(item => {
      txt += '▸ ' + item.item_name + '\n';
      txt += '   ' + item.qty + ' x ' + fmtRp(item.unit_price) + ' = ' + fmtRp(item.line_total) + '\n';
    });
    txt += '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n';
    txt += 'Subtotal: ' + fmtRp(r.subtotal) + '\n';
    if (Number(r.discount) > 0) txt += 'Diskon: -' + fmtRp(r.discount) + '\n';
    txt += '*💰 Total: ' + fmtRp(r.grand_total) + '*\n';
    (Array.isArray(r.payments) ? r.payments : []).forEach(p => {
      txt += '💳 ' + p.method + ': ' + fmtRp(p.amount) + '\n';
    });
    txt += '✅ Status: ' + (r.payment_status === 'paid' ? 'LUNAS' : 'BELUM LUNAS') + '\n';
    txt += '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n';
    txt += 'Terima kasih telah berbelanja 💕\n';
    txt += 'Salon Eyelash — Beauty & Elegance ✨\n';

    const url = 'https://wa.me/?text=' + encodeURIComponent(txt);
    window.open(url, '_blank');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>POS Kasir</h1>
          <p>Input transaksi penjualan layanan</p>
        </div>
        <div className="page-header-right no-print">
          <div className="flex">
            <input
              type="text"
              placeholder="Cari receipt..."
              value={receiptCode}
              onChange={e => setReceiptCode(e.target.value)}
              style={{ width: 180 }}
            />
            <button className="btn btn-secondary btn-sm" onClick={posLoadReceipt} disabled={loading}>
              {loading ? <><span className="spinner"></span>Loading...</> : 'Cari Receipt'}
            </button>
          </div>
        </div>
      </div>

      <div className={`status-box show ${status.type}`} style={{ display: status.msg ? 'block' : 'none' }}>
        {status.msg && esc(status.msg)}
      </div>

      <div className="grid-2">
        {/* Left column — Input form & cart */}
        <div>
          <div className="card">
            <div className="card-title"><i className="fas fa-user"></i> Data Customer</div>
            <div className="form-group">
              <label>Nama</label>
              <input
                type="text"
                placeholder="Nama customer"
                value={customer.name}
                onChange={e => setCustomer({ ...customer, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>No. HP</label>
              <input
                type="text"
                placeholder="08xxxx"
                value={customer.phone}
                onChange={e => setCustomer({ ...customer, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Instagram</label>
              <input
                type="text"
                placeholder="@username"
                value={customer.instagram}
                onChange={e => setCustomer({ ...customer, instagram: e.target.value })}
              />
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-title"><i className="fas fa-concierge-bell"></i> Layanan & Staff</div>
            <div className="flex" style={{ marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Layanan</label>
                <select value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                  <option value="">-- Pilih Layanan --</option>
                  {Array.isArray(services) && services.map(s => (
                    <option key={s.service_id} value={s.service_id}>
                      {esc(s.service_name)} — {fmtRp(s.price || 0)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Staff/Therapist</label>
                <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
                  <option value="">-- Pilih Staff --</option>
                  {Array.isArray(staff) && staff.map(s => (
                    <option key={s.staff_id} value={s.staff_id}>{esc(s.staff_name)}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={addToCart}>
              <i className="fas fa-cart-plus"></i> Tambah ke Keranjang
            </button>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-title"><i className="fas fa-shopping-cart"></i> Keranjang ({cart.length})</div>
            {Array.isArray(cart) && cart.length === 0 ? (
              <p className="empty" style={{ padding: 20, textAlign: 'center' }}>Keranjang masih kosong. Pilih layanan di atas.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Layanan</th>
                      <th className="right">Qty</th>
                      <th className="right">Harga</th>
                      <th className="right">Diskon</th>
                      <th className="right">Subtotal</th>
                      <th className="no-print"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(cart) && cart.map((item, i) => (
                      <tr key={i}>
                        <td>{esc(item.item_name)}</td>
                        <td className="right">{fmtRp(item.unit_price)}</td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={e => updateCartItem(i, 'qty', Math.max(1, Number(e.target.value) || 1))}
                            style={{ width: 60 }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            value={item.discount}
                            onChange={e => updateCartItem(i, 'discount', Math.max(0, Number(e.target.value) || 0))}
                            style={{ width: 80 }}
                          />
                        </td>
                        <td className="right">{fmtRp(item.unit_price * item.qty - item.discount)}</td>
                        <td className="no-print">
                          <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(i)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <hr className="divider" />
            <div className="receipt-row">
              <strong>Subtotal</strong>
              <strong>{fmtRp(subtotal())}</strong>
            </div>
          </div>
        </div>

        {/* Right column — Payment & Receipt */}
        <div>
          <div className="card">
            <div className="card-title"><i className="fas fa-credit-card"></i> Pembayaran</div>
            <div className="form-group">
              <label>Diskon (Rp)</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={discount}
                onChange={e => setDiscount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)).toString())}
              />
            </div>
            <div className="form-group">
              <label>Metode Pembayaran</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="">-- Pilih Metode --</option>
                {Array.isArray(paymentMethods) && paymentMethods.map((m, i) => (
                  <option key={i} value={m}>{esc(m)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Jumlah Dibayar (Rp)</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)).toString())}
              />
            </div>
            <hr className="divider" />
            <div className="receipt-row">
              <span>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--rose-dark)' }}>
                {fmtRp(totalAfterDiscount())}
              </span>
            </div>
            {amountPaid > 0 && (
              <div className="receipt-row">
                <span>Kembali</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#166534' }}>
                  {fmtRp(Math.max(0, amountPaid - totalAfterDiscount()))}
                </span>
              </div>
            )}
            <button
              className="btn btn-primary btn-full mt-2"
              onClick={posSave}
              disabled={loading || cart.length === 0}
            >
              {loading ? <><span className="spinner"></span>Memproses...</> : <><i className="fas fa-check"></i> Simpan Transaksi</>}
            </button>
          </div>

          {receipt && (
            <div className={`receipt-card show`}>
              {/* HEADER */}
              <div className="receipt-header">
                <div className="receipt-logo">
                  <i className="fa-solid fa-sparkles"></i>
                </div>
                <h3>{esc(receipt.business_name || 'Salon Eyelash')}</h3>
                <p className="receipt-subtitle">✦ Struk Transaksi ✦</p>
              </div>

              {/* INFO */}
              <div className="receipt-info">
                <div className="receipt-row">
                  <span className="receipt-label">No</span>
                  <span><strong>{esc(receipt.transaction_id || receipt.code || '')}</strong></span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Tanggal</span>
                  <span>{receipt.transaction_date ? new Date(receipt.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : today()}</span>
                </div>
                {receipt.customer_name && (
                  <div className="receipt-row">
                    <span className="receipt-label">Customer</span>
                    <span><strong>{esc(receipt.customer_name)}</strong></span>
                  </div>
                )}
                {receipt.staff_name && (
                  <div className="receipt-row">
                    <span className="receipt-label">Therapist</span>
                    <span>{esc(receipt.staff_name)}</span>
                  </div>
                )}
              </div>

              <div className="receipt-divider"></div>

              {/* ITEMS */}
              <div className="receipt-items-header">
                <span>Layanan</span>
                <span>Jumlah</span>
              </div>
              {(Array.isArray(receipt.items) ? receipt.items : []).map((item, i) => (
                <div className="receipt-item" key={i}>
                  <div className="receipt-item-name">{esc(item.item_name)}</div>
                  <div className="receipt-item-detail">
                    <span>{item.qty} x {fmtRp(item.unit_price)}</span>
                    <span className="receipt-item-total">{fmtRp(item.line_total)}</span>
                  </div>
                </div>
              ))}

              <div className="receipt-divider"></div>

              {/* TOTALS */}
              <div className="receipt-section">
                <div className="receipt-row">
                  <span className="receipt-label">Subtotal</span>
                  <span>{fmtRp(receipt.subtotal)}</span>
                </div>
                {Number(receipt.discount) > 0 && (
                  <div className="receipt-row">
                    <span className="receipt-label">Diskon</span>
                    <span style={{ color: '#D44' }}>-{fmtRp(receipt.discount)}</span>
                  </div>
                )}
                <div className="receipt-total">
                  <div className="receipt-row">
                    <span className="receipt-label">Total Bayar</span>
                    <span className="receipt-total-amount">{fmtRp(receipt.grand_total)}</span>
                  </div>
                </div>
              </div>

              <div className="receipt-divider"></div>

              {/* PAYMENTS */}
              <div className="receipt-section">
                {(Array.isArray(receipt.payments) ? receipt.payments : []).map((p, i) => (
                  <div className="receipt-row" key={i}>
                    <span className="receipt-label">Pembayaran</span>
                    <span>{esc(p.method)} — {fmtRp(p.amount)}</span>
                  </div>
                ))}
                <div className="receipt-row receipt-status">
                  <span className="receipt-label">Status</span>
                  <span className={`badge ${receipt.payment_status === 'paid' ? 'paid' : 'unpaid'}`}>
                    {receipt.payment_status === 'paid' ? '✅ LUNAS' : '⏳ BELUM LUNAS'}
                  </span>
                </div>
              </div>

              <div className="receipt-divider"></div>

              {/* FOOTER */}
              <div className="receipt-footer-content">
                <p className="receipt-thanks">Terima kasih telah berbelanja 💕</p>
                <p className="receipt-salon">Salon Eyelash — Beauty & Elegance</p>
              </div>

              {/* ACTIONS (hidden when printing) */}
              <div className="receipt-actions">
                <button className="btn btn-secondary btn-sm" onClick={printReceipt}>
                  <i className="fas fa-print"></i> Print
                </button>
                <button className="btn btn-secondary btn-sm" onClick={shareWhatsApp}>
                  <i className="fab fa-whatsapp"></i> WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
