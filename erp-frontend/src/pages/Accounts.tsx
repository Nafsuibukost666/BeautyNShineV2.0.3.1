import React, { useState, useEffect } from 'react';
import api from '../lib/api';

const TYPE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  ASSET: { bg: 'rgba(76,175,125,0.1)', color: '#4caf7d', label: 'Aset' },
  LIABILITY: { bg: 'rgba(255,152,0,0.1)', color: '#ff9800', label: 'Kewajiban' },
  EQUITY: { bg: 'rgba(33,150,243,0.1)', color: '#2196f3', label: 'Ekuitas' },
  REVENUE: { bg: 'rgba(76,175,125,0.1)', color: '#4caf7d', label: 'Pendapatan' },
  EXPENSE: { bg: 'rgba(224,108,108,0.1)', color: '#e06c6c', label: 'Beban' },
};

const TYPE_LIST = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

const LEVEL_LABELS: Record<number, string> = {
  1: 'Main Category',
  2: 'Sub Category',
  3: 'Account Group',
  4: 'Detail',
};

function flattenTree(nodes: any[]): any[] {
  const result: any[] = [];
  const walk = (items: any[], depth: number) => {
    for (const item of items) {
      result.push({ ...item, _depth: depth });
      if (item.children?.length) walk(item.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return result;
}

export default function Accounts() {
  const [tree, setTree] = useState<any[]>([]);
  const [flatAccounts, setFlatAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [form, setForm] = useState({ code: '', name: '', type: 'ASSET', parent_id: '' });
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const treeRes = await api.get('/master/accounts/tree');
      const data = treeRes.data?.data || [];
      setTree(data);
      setFlatAccounts(flattenTree(data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data akun');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = typeFilter
    ? flatAccounts.filter((a: any) => a.type === typeFilter)
    : flatAccounts;

  const openAdd = () => {
    setEditData(null);
    setForm({ code: '', name: '', type: 'ASSET', parent_id: '' });
    setShowModal(true);
  };

  const openEdit = (a: any) => {
    if (a.is_system) return;
    setEditData(a);
    setForm({
      code: a.code || '',
      name: a.name || '',
      type: a.type || 'ASSET',
      parent_id: String(a.parent_id || ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        code: form.code,
        name: form.name,
        type: form.type,
        level: editData?.level || 3,
      };
      if (form.parent_id) payload.parent_id = parseInt(form.parent_id);
      if (editData) {
        await api.put(`/master/accounts/${editData.id}`, payload);
      } else {
        await api.post('/master/accounts', payload);
      }
      setShowModal(false);
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.message || 'Gagal menyimpan akun');
    }
  };

  const handleDelete = async (id: number, isSystem: boolean) => {
    if (isSystem) return;
    if (!confirm('Nonaktifkan akun ini?')) return;
    try {
      await api.delete(`/master/accounts/${id}`);
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.message || 'Gagal menghapus akun');
    }
  };

  const getParentName = (parentId: number | null) => {
    if (!parentId) return null;
    const parent = flatAccounts.find((a: any) => a.id === parentId);
    return parent?.name || null;
  };

  const renderTree = (nodes: any[], depth: number = 0) => {
    return nodes.map((node: any) => {
      const tc = TYPE_COLORS[node.type] || { bg: 'rgba(168,164,160,0.1)', color: '#a8a4a0', label: node.type || '-' };
      const isSystem = node.is_system;
      return (
        <React.Fragment key={node.id}>
          <tr style={{
            opacity: node.is_active === false ? 0.5 : 1,
            background: isSystem ? 'rgba(255,255,255,0.02)' : undefined,
          }}>
            <td style={{ paddingLeft: 16 + depth * 24, fontFamily: 'monospace', fontSize: 13, color: '#a8a4a0', fontWeight: 600 }}>
              {isSystem ? '🔒 ' : ''}{node.code || '-'}
            </td>
            <td style={{ fontWeight: 600, color: isSystem ? '#6b6865' : '#f0ece4' }}>
              {isSystem && <span style={{ fontSize: 10, background: 'rgba(168,164,160,0.15)', color: '#a8a4a0', padding: '2px 6px', borderRadius: 4, marginRight: 8 }}>SYSTEM</span>}
              {node.name}
            </td>
            <td>
              <span className="status-badge" style={{ background: tc.bg, color: tc.color }}>
                {tc.label}
              </span>
            </td>
            <td style={{ color: '#6b6865', fontSize: 12 }}>L{node.level}</td>
            <td style={{ color: '#a8a4a0' }}>{getParentName(node.parent_id) || '-'}</td>
            <td>
              <span className={`status-badge ${node.is_active !== false ? 'completed' : 'cancelled'}`}>
                {node.is_active !== false ? 'Aktif' : 'Nonaktif'}
              </span>
            </td>
            <td>
              {!isSystem ? (
                <>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(node)} style={{ marginRight: 6 }}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(node.id, isSystem)}>Hapus</button>
                </>
              ) : (
                <span style={{ color: '#6b6865', fontSize: 11, fontStyle: 'italic' }}>System</span>
              )}
            </td>
          </tr>
          {node.children?.length > 0 && renderTree(node.children, depth + 1)}
        </React.Fragment>
      );
    });
  };

  if (loading && flatAccounts.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Chart of Accounts</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${viewMode === 'tree' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('tree')}
          >Tree</button>
          <button
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('table')}
          >Table</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Tambah Akun</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Semua Tipe</option>
          {TYPE_LIST.map((t) => (
            <option key={t} value={t}>{TYPE_COLORS[t].label}</option>
          ))}
        </select>
        <span style={{ color: '#6b6865', fontSize: 12 }}>
          {flatAccounts.length} akun | 🔒 System = Level 1-2 | 📝 User = Level 3-4
        </span>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Akun</th>
                <th>Tipe</th>
                <th>Level</th>
                <th>Induk</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada akun</td></tr>
              ) : (
                viewMode === 'tree' ? renderTree(tree) :
                filteredAccounts.map((a: any) => {
                  const tc = TYPE_COLORS[a.type] || { bg: 'rgba(168,164,160,0.1)', color: '#a8a4a0', label: a.type || '-' };
                  const isSystem = a.is_system;
                  return (
                    <tr key={a.id} style={{ opacity: a.is_active === false ? 0.5 : 1 }}>
                      <td style={{ paddingLeft: 16 + (a._depth || 0) * 24, fontFamily: 'monospace', fontSize: 13, color: '#a8a4a0', fontWeight: 600 }}>
                        {isSystem ? '🔒 ' : ''}{a.code || '-'}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {isSystem && <span style={{ fontSize: 10, background: 'rgba(168,164,160,0.15)', color: '#a8a4a0', padding: '2px 6px', borderRadius: 4, marginRight: 8 }}>SYSTEM</span>}
                        {a.name}
                      </td>
                      <td>
                        <span className="status-badge" style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                      </td>
                      <td style={{ color: '#6b6865', fontSize: 12 }}>L{a.level}</td>
                      <td style={{ color: '#a8a4a0' }}>{getParentName(a.parent_id) || '-'}</td>
                      <td>
                        <span className={`status-badge ${a.is_active !== false ? 'completed' : 'cancelled'}`}>
                          {a.is_active !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        {!isSystem ? (
                          <>
                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(a)} style={{ marginRight: 6 }}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id, isSystem)}>Hapus</button>
                          </>
                        ) : (
                          <span style={{ color: '#6b6865', fontSize: 11, fontStyle: 'italic' }}>System</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid #2e2e3e', display: 'flex', gap: 24, fontSize: 12, color: '#a8a4a0' }}>
        <span>🔒 <b>System</b> — Level 1 & 2 (fixed, tidak bisa diubah)</span>
        <span>📝 <b>User</b> — Level 3 & 4 (bisa ditambah/diedit)</span>
        <span>📋 <b>Tree view</b> — Hierarki 4 level</span>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editData ? 'Edit Akun' : 'Tambah Akun (Level 3-4)'}</h2>
            <div className="form-group">
              <label>Kode Akun *</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="cth: 5-160" />
            </div>
            <div className="form-group">
              <label>Nama Akun *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kas Besar, Beban Transport, dll" />
            </div>
            <div className="form-group">
              <label>Tipe Akun *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPE_LIST.map((t) => (
                  <option key={t} value={t}>{TYPE_COLORS[t].label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Akun Induk (Level 2)</label>
              <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                <option value="">Pilih induk (Level 2)</option>
                {flatAccounts.filter((a: any) => a.level === 2 && a.is_active !== false).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
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
