import { useState, useEffect } from 'react';
import api from '../api';
import { fmtRp, esc } from '../utils/format';

export default function Users() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // Add user form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'staff' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user.role === 'owner') {
      loadUsers();
    }
  }, []);

  async function loadUsers() {
    setLoading(true);
    setStatus({ msg: '', type: '' });
    try {
      const res = await api.get('/api/auth/users');
      setUsers(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data?.users) ? res.data.users : []));
    } catch (e) {
      setStatus({ msg: 'Gagal memuat pengguna: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function usrShowAdd() {
    setForm({ username: '', password: '', full_name: '', role: 'staff' });
    setShowForm(true);
  }

  function usrCloseAdd() {
    setShowForm(false);
    setForm({ username: '', password: '', full_name: '', role: 'staff' });
  }

  async function usrSave() {
    if (!form.username.trim()) {
      setStatus({ msg: 'Username wajib diisi', type: 'error' });
      return;
    }
    if (!form.password) {
      setStatus({ msg: 'Password wajib diisi', type: 'error' });
      return;
    }
    if (!form.full_name.trim()) {
      setStatus({ msg: 'Nama lengkap wajib diisi', type: 'error' });
      return;
    }
    setSaving(true);
    setStatus({ msg: '', type: '' });
    try {
      await api.post('/api/auth/users', form);
      setStatus({ msg: 'Pengguna berhasil ditambahkan', type: 'success' });
      usrCloseAdd();
      loadUsers();
    } catch (e) {
      setStatus({ msg: 'Gagal menambah pengguna: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function usrDelete(id, username) {
    if (!confirm('Yakin ingin menghapus pengguna "' + (username || '') + '"? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    setLoading(true);
    setStatus({ msg: '', type: '' });
    try {
      await api.delete('/api/auth/users/' + id);
      setStatus({ msg: 'Pengguna berhasil dihapus', type: 'success' });
      loadUsers();
    } catch (e) {
      setStatus({ msg: 'Gagal menghapus pengguna: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function roleBadge(role) {
    if (role === 'owner') return 'badge owner';
    return 'badge ' + (role || 'staff');
  }

  function statusBadge(active) {
    if (active) return 'badge success';
    return 'badge danger';
  }

  // Non-owner guard
  if (user.role !== 'owner') {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Manajemen Pengguna</h1>
            <p>Kelola akun pengguna sistem</p>
          </div>
        </div>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#991b1b' }}>
            <i className="fas fa-lock" style={{ fontSize: 48, marginBottom: 16 }}></i>
            <h3>Hanya owner yang bisa mengakses halaman ini.</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Manajemen Pengguna</h1>
          <p>Kelola akun pengguna sistem</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={usrShowAdd}>
            <i className="fas fa-user-plus"></i> Tambah Pengguna
          </button>
        </div>
      </div>

      <div className={`status-box show ${status.type}`} style={{ display: status.msg ? 'block' : 'none' }}>
        {status.msg && esc(status.msg)}
      </div>

      <div className="card">
        <div className="card-title"><i className="fas fa-users-cog"></i> Daftar Pengguna ({users.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Nama</th>
                <th>Role</th>
                <th>Status</th>
                <th>Dibuat</th>
                <th className="no-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={6}>
                    {loading ? 'Memuat data...' : 'Belum ada data pengguna'}
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u.id || i}>
                    <td><strong>{esc(u.username || '—')}</strong></td>
                    <td>{esc(u.full_name || u.name || '—')}</td>
                    <td><span className={roleBadge(u.role)}>{esc(u.role || 'staff')}</span></td>
                    <td>
                      <span className={statusBadge(u.is_active !== false)}>
                        {u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>{esc(u.created_at ? u.created_at.split('T')[0] : '—')}</td>
                    <td className="no-print">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => usrDelete(u.id, u.username)}
                        disabled={loading || u.role === 'owner'}
                        title={u.role === 'owner' ? 'Tidak bisa menghapus owner' : 'Hapus pengguna'}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal Overlay */}
      {showForm && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) usrCloseAdd(); }}
        >
          <div
            className="card"
            style={{
              width: '100%', maxWidth: 440, margin: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <div className="card-title">
              <i className="fas fa-user-plus"></i> Tambah Pengguna Baru
              <button
                onClick={usrCloseAdd}
                style={{
                  float: 'right', background: 'none', border: 'none',
                  fontSize: 20, cursor: 'pointer', color: '#666',
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Username untuk login"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                placeholder="Nama lengkap"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="flex" style={{ gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={usrCloseAdd}>
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={usrSave}
                disabled={saving}
              >
                {saving ? <span className="spinner"></span> : <><i className="fas fa-save"></i> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
