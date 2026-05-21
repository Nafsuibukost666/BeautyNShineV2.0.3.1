/**
 * Check-In Screen — Booking Validation
 * Today's bookings with 3 actions: Selesai, Cancel, Reschedule
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookingAPI } from '../services/api';
import { Booking } from '../services/types';
import { theme } from '../theme';
import { GlassCard, PageHeader, LoadingScreen, StatusBadge } from '../components';

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  BOOKED: { label: 'Booked', variant: 'info' },
  CHECKED_IN: { label: 'Check In', variant: 'success' },
  DONE: { label: 'Selesai', variant: 'success' },
  CANCELLED: { label: 'Batal', variant: 'error' },
  NO_SHOW: { label: 'No Show', variant: 'error' },
  RESCHEDULED: { label: 'Reschedule', variant: 'warning' },
};

export default function CheckInScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      const res = await bookingAPI.listBookings({ status: 'BOOKED' });
      const res2 = await bookingAPI.listBookings({ status: 'CHECKED_IN' });
      let all = [...(res.data.data || []), ...(res2.data.data || [])];
      // Sort by date (newest first)
      all.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
      setBookings(all);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleAction = async (booking: any, action: 'done' | 'cancelled' | 'rescheduled') => {
    setActionLoading(booking.id);
    try {
      if (action === 'rescheduled') {
        await bookingAPI.updateStatus(booking.id, 'rescheduled');
        setActionLoading(null);
        navigation.navigate('Booking', {
          prefill: {
            name: booking.customerName || '',
            phone: booking.customerPhone || '',
            therapistName: booking.therapistName || '',
          }
        });
        return;
      }
      const res = await bookingAPI.updateStatus(booking.id, action);
      if (res.data.success) {
        setBookings(prev => prev.map(b =>
          b.id === booking.id ? { ...b, status: action === 'done' ? 'DONE' : 'CANCELLED' } : b
        ));
      }
    } catch (err: any) {
      window.alert(err.response?.data?.detail || 'Gagal update status');
    } finally { setActionLoading(null); }
  };

  if (loading) return <LoadingScreen />;

  const activeBookings = bookings.filter(b => b.status !== 'DONE' && b.status !== 'CANCELLED' && b.status !== 'NO_SHOW' && b.status !== 'RESCHEDULED');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}>
      <View style={styles.bgGlow} />
      <PageHeader title="Check-In" subtitle="Validasi booking hari ini" onBack={() => navigation.goBack()} />

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: theme.colors.info }]}>{bookings.length}</Text>
          <Text style={styles.statLabel}>Total Booking</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: theme.colors.success }]}>{activeBookings.length}</Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: theme.colors.success }]}>
            {bookings.filter(b => b.status === 'DONE').length}
          </Text>
          <Text style={styles.statLabel}>Selesai</Text>
        </View>
      </View>

      {/* Booking List */}
      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary }}>Tidak ada booking hari ini</Text>
        </View>
      ) : (
        bookings.map((b: any) => {
          const st = STATUS_MAP[b.status] || { label: b.status, variant: 'neutral' };
          const isPending = b.status === 'DONE' || b.status === 'CANCELLED' || b.status === 'NO_SHOW' || b.status === 'RESCHEDULED';
          return (
            <GlassCard key={b.id} padded style={{ marginBottom: 10 }}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingCode}>{b.code || `#${b.id}`}</Text>
                <StatusBadge label={st.label} variant={st.variant} />
              </View>

              <View style={styles.bookingInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>👤</Text>
                  <Text style={styles.infoText}>{b.customerName || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>💆</Text>
                  <Text style={styles.infoText}>{b.therapistName || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🕐</Text>
                  <Text style={styles.infoText}>{b.time || b.date ? `${b.date?.split('T')[0]} ${b.time}` : '-'}</Text>
                </View>
                {b.assignedBed && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>🏠</Text>
                    <Text style={styles.infoText}>Kabin {b.assignedBed}</Text>
                  </View>
                )}
              </View>

              {!isPending && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionDone]}
                    onPress={() => handleAction(b, 'done')}
                    disabled={actionLoading === b.id}>
                    {actionLoading === b.id ? <ActivityIndicator color="#fff" size="small" /> :
                      <Text style={styles.actionText}>✅ Selesai</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionCancel]}
                    onPress={() => handleAction(b, 'cancelled')}
                    disabled={actionLoading === b.id}>
                    <Text style={styles.actionText}>✕ Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionResched]}
                    onPress={() => handleAction(b, 'rescheduled')}
                    disabled={actionLoading === b.id}>
                    <Text style={styles.actionText}>🔄 Reschedule</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>
          );
        })
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 16 },
  bgGlow: {
    position: 'absolute', top: -80, right: -60,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(34,211,238,0.03)',
  },
  statsRow: {
    flexDirection: 'row', backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 10, color: theme.colors.textMuted, marginTop: 2 },
  statSep: { width: 1, backgroundColor: theme.colors.border, marginHorizontal: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  bookingHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  bookingCode: { fontSize: 13, fontWeight: '700', color: theme.colors.text, fontFamily: 'monospace' },
  bookingInfo: { gap: 6, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon: { fontSize: 13 },
  infoText: { fontSize: 13, color: theme.colors.text, flex: 1 },
  actionsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  actionBtn: {
    flex: 1, borderRadius: theme.radius.sm, padding: 10,
    alignItems: 'center',
  },
  actionDone: { backgroundColor: theme.colors.success },
  actionCancel: { backgroundColor: theme.colors.error },
  actionResched: { backgroundColor: theme.colors.warning },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
