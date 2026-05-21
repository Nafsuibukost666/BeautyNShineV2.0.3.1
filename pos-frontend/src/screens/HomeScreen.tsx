/**
 * Home Screen — Premium Dashboard
 * Glass cards, stat tiles, elegant menu grid with gradient accents
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dashboardAPI } from '../services/api';
import { theme } from '../theme';
import { GlassCard, StatCard, LoadingScreen, PageHeader } from '../components';

const MENU = [
  { key: 'booking', icon: '📅', label: 'Booking', desc: 'Manage appointments', color: theme.colors.info },
  { key: 'checkin', icon: '✅', label: 'Check-In', desc: 'Validate bookings', color: theme.colors.success },
  { key: 'pos', icon: '🧾', label: 'POS Invoice', desc: 'Create transactions', color: theme.colors.accent },
  { key: 'receipt', icon: '📃', label: 'Receipt', desc: 'Search & print receipts', color: theme.colors.warning },
  { key: 'close', icon: '🔒', label: 'Tutup Shift', desc: 'Close cash register', color: theme.colors.error },
];

export default function HomeScreen({ navigation }: any) {
  const [stats, setStats] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
      const sessStr = await AsyncStorage.getItem('session');
      if (sessStr) setSession(JSON.parse(sessStr));
      const res = await dashboardAPI.getStats();
      if (res.data.success) setStats(res.data.data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'user', 'session']);
    navigation.replace('Login');
  };

  const navigateTo = (key: string) => {
    navigation.navigate(
      key === 'booking' ? 'Booking' :
      key === 'checkin' ? 'CheckIn' :
      key === 'pos' ? 'POS' :
      key === 'receipt' ? 'Receipt' :
      'Closing'
    );
  };

  const formatCurrency = (v: number) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
      }
    >
      {/* Background glow */}
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>Halo,</Text>
            <Text style={styles.userName}>{user?.username || 'Kasir'}</Text>
          </View>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Shift Active Card */}
      {session && (
        <GlassCard highlight="accent" style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <View style={styles.shiftBadge}>
              <View style={styles.shiftDot} />
              <Text style={styles.shiftBadgeText}>Shift Active</Text>
            </View>
            <Text style={styles.shiftCode}>{session.id}</Text>
          </View>
          <View style={styles.shiftStats}>
            <View style={styles.shiftStat}>
              <Text style={styles.shiftStatValue}>{formatCurrency(session.opening_cash)}</Text>
              <Text style={styles.shiftStatLabel}>Saldo Awal</Text>
            </View>
            <View style={styles.shiftDivider} />
            <View style={styles.shiftStat}>
              <Text style={[styles.shiftStatValue, { color: theme.colors.success }]}>
                {formatCurrency(session.total_sales || 0)}
              </Text>
              <Text style={styles.shiftStatLabel}>Penjualan</Text>
            </View>
            <View style={styles.shiftDivider} />
            <View style={styles.shiftStat}>
              <Text style={[styles.shiftStatValue, { color: theme.colors.info }]}>
                {session.total_transactions || 0}x
              </Text>
              <Text style={styles.shiftStatLabel}>Transaksi</Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsRow}>
          <StatCard
            value={String(stats.todayTransactions || 0)}
            label="Transaksi Hari Ini"
            variant="info"
            icon="📊"
            style={{ flex: 1 }}
          />
          <View style={{ width: 12 }} />
          <StatCard
            value={formatCurrency(stats.todayRevenue || 0)}
            label="Revenue Hari Ini"
            variant="success"
            icon="💰"
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Menu Section */}
      <View style={styles.menuSection}>
        <View style={styles.menuSectionHeader}>
          <Text style={styles.menuSectionTitle}>Menu Cepat</Text>
        </View>
        <View style={styles.menuGrid}>
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={() => navigateTo(item.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: `${item.color}15` }]}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={[styles.menuLabel, { color: item.color }]}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 16,
  },
  bgGlow1: {
    position: 'absolute', top: -60, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(240,160,112,0.04)',
  },
  bgGlow2: {
    position: 'absolute', bottom: -60, left: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(34,211,238,0.03)',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingTop: 52, marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
  },
  greeting: {
    fontSize: 16, color: theme.colors.textSecondary, fontWeight: '400',
  },
  userName: {
    fontSize: 22, fontWeight: '700', color: theme.colors.text,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 11, color: theme.colors.textMuted, marginTop: 4,
  },
  logoutBtn: {
    width: 40, height: 40, borderRadius: theme.radius.md,
    backgroundColor: 'rgba(239,68,68,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutIcon: { fontSize: 16 },
  shiftCard: { marginBottom: 16 },
  shiftHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  shiftBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.1)',
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: theme.radius.full,
  },
  shiftDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: theme.colors.success, marginRight: 6,
  },
  shiftBadgeText: {
    fontSize: 11, fontWeight: '600', color: theme.colors.success,
  },
  shiftCode: {
    fontSize: 11, fontWeight: '500', color: theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  shiftStats: {
    flexDirection: 'row', alignItems: 'center',
  },
  shiftStat: { flex: 1, alignItems: 'center' },
  shiftStatValue: {
    fontSize: 14, fontWeight: '700', color: theme.colors.text,
  },
  shiftStatLabel: {
    fontSize: 9, color: theme.colors.textMuted, marginTop: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  shiftDivider: {
    width: 1, height: 32,
    backgroundColor: theme.colors.border, marginHorizontal: 8,
  },
  statsRow: {
    flexDirection: 'row', marginBottom: 24,
  },
  menuSection: {
    marginBottom: 16,
  },
  menuSectionHeader: {
    marginBottom: 12,
  },
  menuSectionTitle: {
    fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  menuGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  menuItem: {
    width: '47%',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  menuIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  menuIcon: { fontSize: 22 },
  menuLabel: {
    fontSize: 14, fontWeight: '700', marginBottom: 4,
  },
  menuDesc: {
    fontSize: 10, color: theme.colors.textMuted, lineHeight: 14,
  },
});
