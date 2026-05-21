/**
 * Booking Screen — Premium 3-Step Wizard
 * Glass cards, step indicator, therapist picker with kabin table
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { posAPI } from '../services/api';
import { Staff } from '../services/types';
import { theme } from '../theme';
import { GlassCard, InputField, PageHeader, LoadingScreen } from '../components';

interface Cabin { id: string; code: string; name: string; is_active: boolean }

const STEPS = ['Customer', 'Jadwal', 'Konfirmasi'];

export default function BookingScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [therapists, setTherapists] = useState<Staff[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Staff | null>(null);
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTherapistPicker, setShowTherapistPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Customer picker from ERP
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await posAPI.getInitialData();
      setTherapists(res.data.data.staff || []);
      setCustomers(res.data.data.customers || []);
      try {
        const token = await AsyncStorage.getItem('token');
        const cabinRes = await fetch('/api/master/beds', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const cabinData = await cabinRes.json();
        if (cabinData.success) setCabins(cabinData.data || []);
      } catch {}
    } catch { Alert.alert('Error', 'Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const searchCustomers = (q: string) => {
    setCustomerSearch(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const qLower = q.toLowerCase();
    const results = customers.filter((c: any) =>
      (c.name || '').toLowerCase().includes(qLower) ||
      (c.phone || '').toLowerCase().includes(qLower)
    );
    setSearchResults(results);
  };

  const selectCustomer = (c: any) => {
    setName(c.name || '');
    setPhone(c.phone || '');
    setShowCustomerPicker(false);
    setCustomerSearch('');
    setSearchResults([]);
  };

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const formatTime = (d: Date) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleNext = () => {
    if (step === 0) {
      if (!name) { Alert.alert('Error', 'Nama customer wajib diisi'); return; }
      setStep(1);
    } else if (step === 1) {
      if (!selectedTherapist) { Alert.alert('Error', 'Pilih therapist'); return; }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const therapist = selectedTherapist!;
      const bookingDateTime = `${formatDate(date)}T${formatTime(time)}:00`;
      const payload = {
        customerName: name,
        customerPhone: phone || '',
        therapistName: therapist.name,
        assignedBed: (therapist as any).kabin || '',
        services: [],
        bookingDate: bookingDateTime,
        estimatedDuration: 60,
      };
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success || data.id || data.code) {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }, 2000);
      } else {
        window.alert(data.detail || data.message || 'Gagal booking');
      }
    } catch (err: any) {
      window.alert(err.message || 'Koneksi gagal');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingScreen />;

  const getCabinForTherapist = (therapistId: string) => {
    const c = cabins.find(c => c.code?.includes(therapistId.slice(-3)) || c.name?.includes(therapistId));
    return c?.code || c?.name || '—';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Background glow */}
      <View style={styles.bgGlow} />

      <PageHeader title="New Booking" subtitle="Buat janji customer" onBack={() => navigation.goBack()} />

      {/* Steps Indicator */}
      <View style={styles.stepsContainer}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <TouchableOpacity style={styles.stepItem} onPress={() => i <= step && setStep(i)} disabled={i > step}>
              <View style={[
                styles.stepCircle,
                i < step && styles.stepCompleted,
                i === step && styles.stepActive,
                i > step && styles.stepInactive,
              ]}>
                <Text style={[
                  styles.stepNum,
                  i < step && { color: theme.colors.textInverse },
                  i === step && { color: theme.colors.accent },
                  i > step && { color: theme.colors.textMuted },
                ]}>
                  {i < step ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[
                styles.stepLabel,
                i === step && { color: theme.colors.accent, fontWeight: '700' },
                i < step && { color: theme.colors.success },
                i > step && { color: theme.colors.textMuted },
              ]}>{label}</Text>
            </TouchableOpacity>
            {i < STEPS.length - 1 && (
              <View style={[
                styles.stepLine,
                i < step && { backgroundColor: theme.colors.success },
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Step Content */}
      {step === 0 && (
        <GlassCard padded style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>👤 Data Customer</Text>
            <TouchableOpacity style={styles.refBtn} onPress={() => setShowCustomerPicker(true)}>
              <Text style={styles.refBtnText}>📋 Data Customer</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardSub}>Lengkapi informasi customer</Text>

          <InputField label="Nama Lengkap" value={name} onChangeText={setName}
            placeholder="Masukkan nama customer" icon="👤" required />
          <InputField label="No. Telepon" value={phone} onChangeText={setPhone}
            placeholder="08xxxx (opsional)" icon="📞" keyboardType="phone-pad" />
        </GlassCard>
      )}

      {step === 1 && (
        <>
          <GlassCard padded style={{ marginBottom: 16 }}>
            <Text style={styles.cardTitle}>📅 Jadwal Booking</Text>
            <Text style={styles.cardSub}>Pilih tanggal & jam</Text>

            <View style={styles.dateTimeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Tanggal *</Text>
                <View style={styles.pickerBtn}>
                  <input
                    type="date"
                    value={formatDate(date)}
                    onChange={(e: any) => setDate(new Date(e.target.value + 'T12:00:00'))}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: theme.colors.text,
                      fontSize: 14,
                      fontWeight: '600',
                      padding: '12px 0',
                      fontFamily: 'inherit',
                    }}
                  />
                  <View style={styles.pickerIcon}>
                    <Text style={styles.pickerIconText}>📅</Text>
                  </View>
                </View>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Jam *</Text>
                <View style={styles.pickerBtn}>
                  <input
                    type="time"
                    value={formatTime(time)}
                    onChange={(e: any) => {
                      const [h, m] = e.target.value.split(':');
                      const d = new Date();
                      d.setHours(parseInt(h), parseInt(m), 0, 0);
                      setTime(d);
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: theme.colors.text,
                      fontSize: 14,
                      fontWeight: '600',
                      padding: '12px 0',
                      fontFamily: 'inherit',
                    }}
                  />
                  <View style={styles.pickerIcon}>
                    <Text style={styles.pickerIconText}>🕐</Text>
                  </View>
                </View>
              </View>
            </View>
          </GlassCard>

          <GlassCard padded style={{ marginBottom: 16 }}>
            <Text style={styles.cardTitle}>💆 Pilih Therapist</Text>
            <Text style={styles.cardSub}>Pilih therapist & kabin</Text>

            <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowTherapistPicker(true)}>
              {selectedTherapist ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.selectorAvatar}>
                    <Text style={styles.selectorAvatarText}>{selectedTherapist.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectorText}>{selectedTherapist.name}</Text>
                    <Text style={styles.selectorSub}>{selectedTherapist.role || 'Therapist'}</Text>
                  </View>
                  <Text style={styles.selectorCheck}>✓</Text>
                </View>
              ) : (
                <Text style={styles.selectorPlaceholder}>Pilih therapist...</Text>
              )}
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>

            {/* Therapist Table */}
            <View style={styles.tableCard}>
              <Text style={styles.tableTitle}>Daftar Therapist</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { width: 36, color: theme.colors.textMuted }]}>No</Text>
                <Text style={[styles.tableCell, { flex: 1, color: theme.colors.textMuted }]}>Nama</Text>
                <Text style={[styles.tableCell, { width: 56, textAlign: 'right', color: theme.colors.textMuted }]}>Kabin</Text>
              </View>
              {therapists.map((t, idx) => (
                <TouchableOpacity key={t.id}
                  style={[
                    styles.tableRow,
                    selectedTherapist?.id === t.id && styles.tableRowActive,
                  ]}
                  onPress={() => { setSelectedTherapist(t); }}
                >
                  <Text style={[styles.tableCell, { width: 36, color: theme.colors.textSecondary }]}>{idx + 1}</Text>
                  <Text style={[styles.tableCell, { flex: 1, color: theme.colors.text, fontWeight: '500' }]}>{t.name}</Text>
                  <Text style={[styles.tableCell, { width: 56, textAlign: 'right', color: theme.colors.accent, fontWeight: '700' }]}>
                    {(t as any).kabin || '—'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </>
      )}

      {step === 2 && (
        <GlassCard padded style={{ marginBottom: 16 }}>
          <Text style={styles.cardTitle}>✅ Konfirmasi Booking</Text>
          <Text style={styles.cardSub}>Periksa kembali data booking</Text>

          <View style={styles.confirmSection}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Customer</Text>
              <Text style={styles.confirmValue}>{name}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Telepon</Text>
              <Text style={styles.confirmValue}>{phone || '-'}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Tanggal</Text>
              <Text style={styles.confirmValue}>{formatDate(date)}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Jam</Text>
              <Text style={styles.confirmValue}>{formatTime(time)}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Therapist</Text>
              <Text style={styles.confirmValue}>{selectedTherapist?.name}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Kabin</Text>
              <Text style={[styles.confirmValue, { color: theme.colors.accent }]}>
                {(selectedTherapist as any)?.kabin || '—'}
              </Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Navigation Buttons */}
      <View style={styles.navRow}>
        {step > 0 && (
          <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.backStepText}>← Kembali</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: step > 0 ? 1 : 0 }} />
        {step < 2 ? (
          <TouchableOpacity style={[styles.footerBtn, { backgroundColor: theme.colors.accent }]} onPress={handleNext}>
            <Text style={styles.footerBtnText}>Lanjut →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.footerBtn, submitting && { opacity: 0.5 }, { backgroundColor: theme.colors.success }]}
            onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <Text style={styles.footerBtnText}>Buat Booking ✓</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Customer Picker Modal */}
      <Modal visible={showCustomerPicker} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Cari Customer</Text>
            <TextInput style={styles.modalSearch}
              placeholder="Cari nama atau telepon..."
              placeholderTextColor={theme.colors.textMuted}
              value={customerSearch} onChangeText={searchCustomers}
              autoFocus
            />
            <ScrollView style={{ maxHeight: 350 }}>
              {searchResults.length === 0 && customerSearch.length > 0 ? (
                <Text style={{ textAlign: 'center', color: theme.colors.textMuted, padding: 20, fontSize: 13 }}>
                  Tidak ditemukan
                </Text>
              ) : searchResults.map((c, i) => (
                <TouchableOpacity key={i} style={styles.customerItem} onPress={() => selectCustomer(c)}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>{(c.name || '?')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>{c.name || '-'}</Text>
                    <Text style={styles.customerPhone}>{c.phone || '-'}</Text>
                  </View>
                  <Text style={styles.selectIcon}>+</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => { setShowCustomerPicker(false); setCustomerSearch(''); setSearchResults([]); }}>
              <Text style={styles.modalCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Therapist Picker Modal */}
      <Modal visible={showTherapistPicker} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pilih Therapist</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {therapists.map((t) => (
                <TouchableOpacity key={t.id}
                  style={[styles.pickerItem, selectedTherapist?.id === t.id && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedTherapist(t);
                    setShowTherapistPicker(false);
                  }}
                >
                  <View style={styles.pickerAvatar}>
                    <Text style={styles.pickerAvatarText}>{t.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerName}>{t.name}</Text>
                    <Text style={styles.pickerSub}>{(t as any).kabin ? `Kabin ${(t as any).kabin}` : (t.role || 'Therapist')}</Text>
                  </View>
                  {selectedTherapist?.id === t.id && (
                    <Text style={styles.pickerCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowTherapistPicker(false)}>
              <Text style={styles.modalCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successBg}>
          <View style={styles.successBox}>
            <View style={styles.successCircle}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Booking Created!</Text>
            <Text style={styles.successSub}>Booking berhasil dibuat</Text>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 16 },
  bgGlow: {
    position: 'absolute', top: -80, right: -60,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(240,160,112,0.04)',
  },
  // Steps
  stepsContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 24,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2,
  },
  stepActive: { borderColor: theme.colors.accent },
  stepCompleted: { borderColor: theme.colors.success, backgroundColor: theme.colors.success },
  stepInactive: { borderColor: theme.colors.borderLight },
  stepNum: { fontSize: 14, fontWeight: '700' },
  stepLabel: { fontSize: 10, marginTop: 6, textAlign: 'center' },
  stepLine: {
    height: 2, flex: 0.8,
    backgroundColor: theme.colors.border,
    marginBottom: 24,
  },
  // Card
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 16 },
  // Date/Time
  dateTimeRow: { flexDirection: 'row' },
  inputLabel: {
    fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary,
    marginBottom: 6, letterSpacing: 0.3,
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.bgInput, borderRadius: theme.radius.md,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  pickerBtnText: {
    fontSize: 14, fontWeight: '600', color: theme.colors.text,
  },
  pickerIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: theme.colors.accentLight,
    justifyContent: 'center', alignItems: 'center',
  },
  pickerIconText: {
    fontSize: 16, color: theme.colors.accent,
  },
  // Therapist Selector
  selectorBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.radius.md, padding: 14,
    borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 16,
  },
  selectorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  selectorAvatarText: { fontSize: 16, fontWeight: '700', color: theme.colors.textInverse },
  selectorText: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  selectorSub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  selectorCheck: { fontSize: 18, color: theme.colors.success, fontWeight: '700', marginRight: 8 },
  selectorPlaceholder: { fontSize: 15, color: theme.colors.textMuted, flex: 1 },
  selectorArrow: { fontSize: 10, color: theme.colors.textMuted },
  // Table
  tableCard: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.radius.md, padding: 12,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  tableTitle: {
    fontSize: 10, fontWeight: '700', color: theme.colors.textMuted,
    letterSpacing: 1, marginBottom: 8,
  },
  tableHeader: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.border, marginBottom: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 6 },
  tableRowActive: { backgroundColor: 'rgba(240,160,112,0.08)' },
  tableCell: { fontSize: 12 },
  // Confirm
  confirmSection: { gap: 4 },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  confirmLabel: { fontSize: 13, color: theme.colors.textSecondary },
  confirmValue: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  // Nav
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backStepBtn: { padding: 12 },
  backStepText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600' },
  footerBtn: {
    flex: 1, borderRadius: theme.radius.md, padding: 16,
    alignItems: 'center',
  },
  footerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: theme.colors.bgCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40, maxHeight: '70%',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: theme.colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 16 },
  modalSearch: {
    backgroundColor: theme.colors.bgInput, borderRadius: theme.radius.md, padding: 14,
    fontSize: 14, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 12,
  },
  // Reference button
  refBtn: {
    backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: theme.radius.sm,
    paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)',
  },
  refBtnText: { color: theme.colors.success, fontSize: 11, fontWeight: '700' },
  // Customer Items
  customerItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, marginBottom: 4,
  },
  customerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.success, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  customerAvatarText: { fontSize: 16, fontWeight: '700', color: theme.colors.textInverse },
  customerName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  customerPhone: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  selectIcon: { fontSize: 22, color: theme.colors.success, fontWeight: '700' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 4 },
  pickerItemActive: { backgroundColor: 'rgba(240,160,112,0.1)' },
  pickerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.accent, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  pickerAvatarText: { fontSize: 16, fontWeight: '700', color: theme.colors.textInverse },
  pickerName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  pickerSub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  pickerCheck: { fontSize: 20, color: theme.colors.accent, fontWeight: '700' },
  modalClose: { marginTop: 12, alignItems: 'center', padding: 12 },
  modalCloseText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  // Success Modal
  successBox: {
    backgroundColor: theme.colors.bgCard, borderRadius: theme.radius.xxl,
    padding: 48, alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.success,
    marginHorizontal: 32, width: '80%',
  },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: theme.colors.successLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 3, borderColor: theme.colors.success,
  },
  successCheck: { fontSize: 40, color: theme.colors.success, fontWeight: '700' },
  successTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  successSub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4, textAlign: 'center' },
  successBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
});
