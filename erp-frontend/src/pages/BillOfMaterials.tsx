import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function BillOfMaterials() {
  const [boms, setBoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    service_id: '',
    notes: '',
  });
  const [components, setComponents] = useState<any[]>([
    { line_no: 1, product_id: '', quantity: '', unit_cost: '' },
  ]);

  useEffect(() => { fetchBoms(); }, [search]);
  useEffect(() => { if (showModal) fetchLookups(); }, [showModal]);

  const fetchBoms = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (search) params.search = search;
      const res = await api.get('/inventory/bom', { params });
      setBoms(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat BOM');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        api.get('/master/services', { params: { per_page: 200 } }),
        api.get('/master/products', { params: { per_page: 200 } }),
      ]);
      setServices(sRes.data?.data?.items || []);
      setProducts(pRes.data?.data?.items || []);
    } catch (_) {}
  };

  const openAdd = () => {
    setEditData(null);
    setForm({ code: '', name: '', service_id: '', notes: '' });
    setComponents([{ line_no: 1, product_id: '', quantity: '', unit_cost: '' }]);
    setShowModal(true);
  };

  const openEdit = (bom: any) => {
    setEditData(bom);
    setForm({
      code: bom.code || '',
      name: bom.name || '',
      service_id: bom.service_id || '',
      notes: bom.notes || '',
    });
    setComponents(
      (bom.components || []).map((c: any, i: number) => ({
        line_no: i + 1,
        product_id: String(c.product_id || c.product?.id || ''),
        quantity: String(c.quantity || ''),
        unit_cost: String(c.unit_cost || ''),
      }))
    );
    setShowModal(true);
  };

  const addComponent = () => {
    setComponents([...components, { line_no: components.length + 1, product_id: '', quantity: '', unit_cost: '' }]);
  };

  const removeComponent = (idx: number) => {
    if (components.length <= 1) return;
    setComponents(components.filter((_, i) => i !== idx).map((c, i) => ({ ...c, line_no: i + 1 })));
  };

  const updateComponent = (idx: number, field: string, value: string) => {
    const updated = [...components];
    updated[idx] = { ...updated[idx], [field]: value };
    setComponents(updated);
  };

  const calcTotalCost = () => {
    return components.reduce((sum, c) => sum + (parseInt(c.quantity) || 0) * (parseInt(c.unit_cost) || 0), 0);
  };

  const handleSave = async () => {
    if (!form.code || !form.name || !form.service_id) {
      alert('Lengkapi kode, nama, dan layanan');
      return;
    }
    const validComponents = components.filter(c => c.product_id && c.quantity);
    if (validComponents.length === 0) {
      alert('Tambahkan minimal satu komponen produk');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        code: form.code,
        name: form.name,
        service_id: parseInt(form.service_id),
        notes: form.notes,
        components: validComponents.map(c => ({
          line_no: c.line_no,
          product_id: parseInt(c.product_id),
          quantity: parseInt(c.quantity),
          unit_cost: parseInt(c.unit_cost) || 0,
        })),
      };
      if (editData) {
        await api.put(`/inventory/bom/${editData.id}`, payload);
      } else {
        await api.post('/inventory/bom', payload);
      }
      setShowModal(false);
      fetchBoms();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan BOM');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus BOM ini?')) return;
    try {
      await api.delete(`/inventory/bom/${id}`);
      fetchBoms();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus BOM');
    }
  };

  const fmt = (v: any) => `Rp ${(parseInt(v) || 0).toLocaleString('id-ID')}`;

  if (loading && boms.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Bill of Materials (BOM)</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah BOM</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Cari BOM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Kode</th>
                <th>Nama BOM</th>
                <th>Layanan</th>
                <th>Total Biaya</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {boms.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada BOM</td></tr>
              ) : (
                boms.map((b: any) => {
                  const isExpanded = expandedId === b.id;
                  return (
                    <React.Fragment key={b.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : b.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ color: '#a8a4a0', fontSize: 12 }}>
                          {isExpanded ? '▼' : '▶'}
                        </td>
                        <td style={{ color: '#e8a87c', fontWeight: 600, fontFamily: 'monospace' }}>{b.code}</td>
                        <td style={{ fontWeight: 600 }}>{b.name}</td>
                        <td>{b.service?.name || '-'}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(b.total_standard_cost)}</td>
                        <td>
                          <span className={`status-badge ${b.is_active ? 'completed' : 'cancelled'}`}>
                            {b.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => { e.stopPropagation(); openEdit(b); }}
                            style={{ marginRight: 6 }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                      {isExpanded && b.components && b.components.length > 0 && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <div style={{
                              background: '#24243a',
                              padding: '12px 24px',
                              borderBottom: '1px solid #2e2e3e',
                            }}>
                              <h4 style={{ color: '#f0ece4', margin: '0 0 8px 0', fontSize: 13 }}>
                                Komponen ({b.components.length})
                              </h4>
                              <table style={{ margin: 0, background: 'transparent' }}>
                                <thead>
                                  <tr>
                                    <th style={{ color: '#a8a4a0', fontSize: 11, padding: '4px 8px', border: 'none' }}>#</th>
                                    <th style={{ color: '#a8a4a0', fontSize: 11, padding: '4px 8px', border: 'none' }}>Produk</th>
                                    <th style={{ color: '#a8a4a0', fontSize: 11, padding: '4px 8px', border: 'none' }}>Qty</th>
                                    <th style={{ color: '#a8a4a0', fontSize: 11, padding: '4px 8px', border: 'none' }}>Harga Satuan</th>
                                    <th style={{ color: '#a8a4a0', fontSize: 11, padding: '4px 8px', border: 'none' }}>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {b.components.map((cmp: any, idx: number) => (
                                    <tr key={cmp.id || idx}>
                                      <td style={{ color: '#a8a4a0', fontSize: 13, padding: '6px 8px', border: 'none' }}>{cmp.line_no || idx + 1}</td>
                                      <td style={{ color: '#f0ece4', fontSize: 13, padding: '6px 8px', border: 'none' }}>
                                        {cmp.product?.name || `Produk #${cmp.product_id}`}
                                      </td>
                                      <td style={{ padding: '6px 8px', border: 'none' }}>{cmp.quantity}</td>
                                      <td style={{ padding: '6px 8px', border: 'none' }}>{fmt(cmp.unit_cost)}</td>
                                      <td style={{ fontWeight: 600, padding: '6px 8px', border: 'none', color: '#e8a87c' }}>
                                        {fmt(cmp.subtotal || (parseInt(cmp.quantity) || 0) * (parseInt(cmp.unit_cost) || 0))}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <h2>{editData ? 'Edit BOM' : 'Tambah BOM'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Kode BOM *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="BOM-001" />
              </div>
              <div className="form-group">
                <label>Nama BOM *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama BOM" />
              </div>
            </div>

            <div className="form-group">
              <label>Layanan *</label>
              <select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
                <option value="">-- Pilih Layanan --</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Catatan</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opsional" rows={2} />
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8, color: '#f0ece4' }}>
              Komponen Produk
              <button className="btn btn-sm btn-secondary" onClick={addComponent} style={{ marginLeft: 12 }}>
                + Tambah Baris
              </button>
            </h3>

            {components.map((cmp: any, idx: number) => (
              <div key={idx} style={{
                display: 'flex', gap: 8, alignItems: 'flex-end',
                padding: 8, marginBottom: 8,
                background: '#24243a', borderRadius: 6,
              }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label style={{ fontSize: 11 }}>Produk</label>
                  <select
                    value={cmp.product_id}
                    onChange={(e) => updateComponent(idx, 'product_id', e.target.value)}
                    style={{ fontSize: 13 }}
                  >
                    <option value="">-- Pilih --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ fontSize: 11 }}>Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={cmp.quantity}
                    onChange={(e) => updateComponent(idx, 'quantity', e.target.value)}
                    style={{ fontSize: 13 }}
                    placeholder="1"
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ fontSize: 11 }}>Harga (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={cmp.unit_cost}
                    onChange={(e) => updateComponent(idx, 'unit_cost', e.target.value)}
                    style={{ fontSize: 13 }}
                    placeholder="0"
                  />
                </div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => removeComponent(idx)}
                  style={{ marginBottom: 1 }}
                  disabled={components.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}

            <div style={{ textAlign: 'right', color: '#e8a87c', fontWeight: 600, marginTop: 8 }}>
              Total Biaya: {fmt(calcTotalCost())}
            </div>

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
