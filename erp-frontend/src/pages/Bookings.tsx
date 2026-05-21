import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customer_name: '', service_name: '', staff_name: '', date: '', time: '', notes: '' });

  useEffect(() => { fetchBookings(); }, [dateFilter, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/bookings', { params });
      setBookings(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data booking');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengupdate status');
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/bookings', form);
      setShowModal(false);
      setForm({ customer_name: '', service_name: '', staff_name: '', date: '', time: '', notes: '' });
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat booking');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Booking</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Buat Booking</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ maxWidth: 200 }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Layanan</th>
                <th>Staff</th>
                <th>Tanggal</th>
                <th>Jam</th>
                <th>Catatan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#6b6865', padding: 24 }}>Tidak ada booking</td></tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.customer_name || b.customer?.name || '-'}</td>
                    <td>{b.service_name || b.service?.name || '-'}</td>
                    <td>{b.staff_name || b.staff?.name || '-'}</td>
                    <td>{b.date ? new Date(b.date).toLocaleDateString('id-ID') : '-'}</td>
                    <td>{b.time || b.start_time || '-'}</td>
                    <td style={{ color: '#a8a4a0', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.notes || '-'}</td>
                    <td>
                      <span className={`status-badge ${(b.status || 'pending').toLowerCase()}`}>
                        {b.status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {b.status === 'pending' && (
                          <button className="btn btn-sm btn-success" onClick={() => updateStatus(b.id, 'confirmed')}>Konfirmasi</button>
                        )}
                        {b.status === 'confirmed' && (
                          <button className="btn btn-sm btn-primary" onClick={() => updateStatus(b.id, 'completed')}>Selesai</button>
                        )}
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button className="btn btn-sm btn-danger" onClick={() => updateStatus(b.id, 'cancelled')}>Batal</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Buat Booking Baru</h2>
            <div className="form-group">
              <label>Nama Customer *</label>
              <input type="text" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Nama customer" />
            </div>
            <div className="form-group">
              <label>Layanan</label>
              <input type="text" value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} placeholder="Nama layanan" />
            </div>
            <div className="form-group">
              <label>Staff</label>
              <input type="text" value={form.staff_name} onChange={(e) => setForm({ ...form, staff_name: e.target.value })} placeholder="Nama staff" />
            </div>
            <div className="form-group">
              <label>Tanggal *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Jam</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Catatan</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan booking..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleCreate}>Buat Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
