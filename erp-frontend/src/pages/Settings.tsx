import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Settings() {
  const [businessName, setBusinessName] = useState('');
  const [settings, setSettings] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const data = res.data?.data || res.data || {};
      setBusinessName(data.business_name || data.businessName || 'Salon Eyelash');
      const keys = ['business_address', 'business_phone', 'business_email', 'tax_rate', 'currency', 'timezone', 'opening_hours', 'closing_hours', 'booking_advance_hours', 'appointment_duration'];
      const pairs = keys.map((k) => ({ key: k, value: data[k] || '' }));
      setSettings(pairs);
    } catch (err: any) {
      setError('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusinessName = async () => {
    try {
      setSaving(true);
      await api.put('/settings', { key: 'business_name', value: businessName });
      setSuccess('Nama bisnis berhasil disimpan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      await api.put('/settings', { key, value });
      setSuccess(`Pengaturan ${key} berhasil disimpan`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleAddSetting = async () => {
    if (!newKey.trim()) return;
    try {
      await api.put('/settings', { key: newKey.trim(), value: newValue });
      setSettings([...settings, { key: newKey.trim(), value: newValue }]);
      setNewKey('');
      setNewValue('');
      setSuccess('Pengaturan baru berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambah pengaturan');
    }
  };

  const getLabel = (key: string) => {
    const labels: Record<string, string> = {
      business_address: 'Alamat Bisnis',
      business_phone: 'No. Telepon',
      business_email: 'Email',
      tax_rate: 'Persentase Pajak (%)',
      currency: 'Mata Uang',
      timezone: 'Zona Waktu',
      opening_hours: 'Jam Buka',
      closing_hours: 'Jam Tutup',
      booking_advance_hours: 'Min. Jam Sebelum Booking',
      appointment_duration: 'Durasi Appointment (menit)',
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getPlaceholder = (key: string) => {
    const placeholders: Record<string, string> = {
      business_address: 'Jl. Contoh No. 123',
      business_phone: '021-12345678',
      business_email: 'info@salon.com',
      tax_rate: '10',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      opening_hours: '08:00',
      closing_hours: '20:00',
      booking_advance_hours: '2',
      appointment_duration: '60',
    };
    return placeholders[key] || '';
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Memuat pengaturan...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Pengaturan</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div style={{ background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.3)', color: '#4caf7d', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {success}
        </div>
      )}

      {/* Business Name */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f0ece4' }}>Informasi Bisnis</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 250, marginBottom: 0 }}>
            <label>Nama Bisnis</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Nama salon/bisnis" />
          </div>
          <button className="btn btn-primary" onClick={handleSaveBusinessName} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* Key-Value Settings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f0ece4' }}>Pengaturan Lainnya</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {settings.map((s) => (
            <div key={s.key} className="form-group" style={{ marginBottom: 0 }}>
              <label>{getLabel(s.key)}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={settings.find((x) => x.key === s.key)?.value || ''}
                  onChange={(e) => setSettings(settings.map((x) => x.key === s.key ? { ...x, value: e.target.value } : x))}
                  placeholder={getPlaceholder(s.key)}
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleSaveSetting(s.key, settings.find((x) => x.key === s.key)?.value || '')}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Simpan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Setting */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f0ece4' }}>Tambah Pengaturan Baru</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label>Key</label>
            <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="setting_key" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label>Value</label>
            <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Nilai pengaturan" />
          </div>
          <button className="btn btn-primary" onClick={handleAddSetting}>Tambah</button>
        </div>
      </div>
    </div>
  );
}
