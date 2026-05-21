import { useState, useEffect } from 'react';
import api from '../api';
import { fmtRp, esc, today, nowTime } from '../utils/format';

export default function Booking() {
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [status, setStatus] = useState({ msg: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Form
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerInstagram, setCustomerInstagram] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [statusFilter, setStatusFilter] = useState('booked');
  const [notes, setNotes] = useState('');

  // Bookings list
  const [bookings, setBookings] = useState([]);
  const [loadDate, setLoadDate] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const res = await api.get('/api/booking/initial-data');
      setServices(res.data.services || []);
      setStaff(res.data.staff || []);
      const d = today();
      setBookingDate(d);
      setLoadDate(d);
      setBookingTime(nowTime());
      // Auto-load today's bookings
      const loadRes = await api.get('/api/booking/by-date/' + d);
      const data = Array.isArray(loadRes.data?.data) ? loadRes.data.data : (Array.isArray(loadRes.data?.bookings) ? loadRes.data.bookings : []);
      setBookings(data);
    } catch (e) {
      setStatus({ msg: 'Gagal memuat data awal: ' + (e.response?.data?.message || e.message), type: 'error' });
    }
  }

  async function bkgSave() {
    if (!customerName) {
      setStatus({ msg: 'Nama customer wajib diisi', type: 'error' });
      return;
    }
    if (!bookingDate || !bookingTime) {
      setStatus({ msg: 'Tanggal dan waktu booking wajib diisi', type: 'error' });
      return;
    }
    if (!selectedService) {
      setStatus({ msg: 'Pilih layanan', type: 'error' });
      return;
    }
    setLoading(true);
    setStatus({ msg: '', type: '' });
    try {
      const payload = {
        date: bookingDate,
        time: bookingTime,
        customer: {
          name: customerName,
          phone: customerPhone,
          instagram: customerInstagram,
        },
        service_id: selectedService,
        staff_id: selectedStaff || null,
        status: statusFilter || 'booked',
        notes: notes,
      };
      const res = await api.post('/api/booking', payload);
      setStatus({ msg: 'Booking berhasil dibuat! #' + (res.data.id || ''), type: 'success' });
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerInstagram('');
      setSelectedService('');
      setSelectedStaff('');
      setNotes('');
      setBookingTime(nowTime());
      // Refresh
      bkgLoad(bookingDate);
    } catch (e) {
      setStatus({ msg: 'Gagal menyimpan booking: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function bkgLoad(date) {
    const d = date || loadDate;
    if (!d) {
      setStatus({ msg: 'Pilih tanggal untuk memuat booking', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/api/booking/by-date/' + d);
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data?.bookings) ? res.data.bookings : []);
      setBookings(data);
      setLoadDate(d);
      setStatus({ msg: '', type: '' });
    } catch (e) {
      setStatus({ msg: 'Gagal memuat booking: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function bkgStatus(id, newStatus) {
    setLoading(true);
    try {
      await api.patch('/api/booking/' + id + '/status', { status: newStatus });
      setStatus({ msg: 'Status booking berhasil diubah ke ' + newStatus, type: 'success' });
      // Refresh list
      bkgLoad(loadDate);
    } catch (e) {
      setStatus({ msg: 'Gagal mengubah status: ' + (e.response?.data?.message || e.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const statusOptions = ['booked', 'done', 'cancelled', 'no_show'];

  function badgeClass(st) {
    return 'badge ' + (st || 'booked');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Booking</h1>
          <p>Kelola janji temu customer</p>
        </div>
      </div>

      <div className={`status-box show ${status.type}`} style={{ display: status.msg ? 'block' : 'none' }}>
        {status.msg && esc(status.msg)}
      </div>

      <div className="grid-2">
        {/* Left — Booking form */}
        <div>
          <div className="card">
            <div className="card-title"><i className="fas fa-calendar-plus"></i> Booking Baru</div>
            <div className="flex">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Tanggal</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Waktu</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                />
              </div>
            </div>
            <hr className="divider" />
            <div className="form-group">
              <label>Nama Customer</label>
              <input
                type="text"
                placeholder="Nama lengkap"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>No. HP</label>
              <input
                type="text"
                placeholder="08xxxx"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Instagram</label>
              <input
                type="text"
                placeholder="@username"
                value={customerInstagram}
                onChange={e => setCustomerInstagram(e.target.value)}
              />
            </div>
            <hr className="divider" />
            <div className="flex">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Layanan</label>
                <select value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                  <option value="">-- Pilih Layanan --</option>
                  {Array.isArray(services) && services.map(s => (
                    <option key={s.service_id || s.id} value={s.service_id || s.id}>
                      {esc(s.service_name || s.name)} — {fmtRp(s.price || 0)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Staff</label>
                <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
                  <option value="">-- Pilih Staff --</option>
                  {Array.isArray(staff) && staff.map(s => (
                    <option key={s.staff_id || s.id} value={s.staff_id || s.id}>{esc(s.staff_name || s.name)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Status Awal</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {statusOptions.map(st => (
                  <option key={st} value={st}>{st.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Catatan</label>
              <textarea
                placeholder="Catatan tambahan..."
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-full mt-2"
              onClick={bkgSave}
              disabled={loading}
            >
              {loading ? <><span className="spinner"></span>Menyimpan...</> : <><i className="fas fa-save"></i> Simpan Booking</>}
            </button>
          </div>
        </div>

        {/* Right — Bookings list */}
        <div>
          <div className="card">
            <div className="card-title"><i className="fas fa-list"></i> Daftar Booking</div>
            <div className="toolbar mb-2">
              <input
                type="date"
                value={loadDate}
                onChange={e => setLoadDate(e.target.value)}
                style={{ width: 'auto', minWidth: 160 }}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => bkgLoad(loadDate)}
                disabled={loading}
              >
                {loading ? <span className="spinner"></span> : <><i className="fas fa-search"></i> Cari</>}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setBookingDate(today()); setLoadDate(today()); bkgLoad(today()); }}
              >
                <i className="fas fa-calendar-day"></i> Hari Ini
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Customer</th>
                    <th>Layanan</th>
                    <th>Staff</th>
                    <th>Status</th>
                    <th className="no-print">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td className="empty" colSpan={6}>Tidak ada booking pada tanggal ini</td>
                    </tr>
                  ) : Array.isArray(bookings) ? (
                    bookings.map((bk, i) => (
                      <tr key={bk.booking_id || bk.id || i}>
                        <td>{esc(bk.time || bk.booking_time || '')}</td>
                        <td>
                          <strong>{esc(bk.customer?.name || bk.customer_name || '')}</strong>
                          <br />
                          <span className="small">{esc(bk.customer?.phone || bk.customer_phone || '')}</span>
                        </td>
                        <td>{esc(bk.service?.name || bk.service_name || '')}</td>
                        <td>{esc(bk.staff?.name || bk.staff_name || '—')}</td>
                        <td><span className={badgeClass(bk.status)}>{bk.status?.replace('_', ' ') || 'booked'}</span></td>
                        <td className="no-print">
                          <div className="flex" style={{ gap: 4 }}>
                            {bk.status !== 'done' && bk.status !== 'cancelled' && (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => bkgStatus(bk.booking_id || bk.id, 'done')}
                                disabled={loading}
                                title="Tandai selesai"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                            )}
                            {bk.status !== 'cancelled' && bk.status !== 'no_show' && (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => bkgStatus(bk.booking_id || bk.id, 'cancelled')}
                                disabled={loading}
                                title="Batalkan"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                            {bk.status === 'booked' && (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => bkgStatus(bk.booking_id || bk.id, 'no_show')}
                                disabled={loading}
                                title="No show"
                              >
                                <i className="fas fa-user-slash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : null}
                </tbody>
              </table>
            </div>
            {Array.isArray(bookings) && bookings.length > 0 && (
              <p className="small mt-2">Total: {bookings.length} booking</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
