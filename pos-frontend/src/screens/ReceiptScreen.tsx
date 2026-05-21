/**
 * Receipt Screen — Premium
 * Recent transactions list + search by code
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { posAPI } from '../services/api';
import { theme } from '../theme';
import { GlassCard, PageHeader, LoadingScreen, StatusBadge } from '../components';
import { formatRupiah } from '../utils/formatters';

export default function ReceiptScreen({ route, navigation }: any) {
  const initialCode = route.params?.code || '';
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    loadTransactions();
  }, []));

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await posAPI.listTransactions(50);
      if (res.data.success) setTransactions(res.data.data?.items || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleViewReceipt = (code: string) => {
    navigation.navigate('Receipt', { code });
  };

  const statusVariant = (s: string) => {
    if (s === 'PAID' || s === 'COMPLETED') return 'success' as const;
    if (s === 'PENDING') return 'warning' as const;
    return 'error' as const;
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.bgGlow} />
      <PageHeader title="Receipt" subtitle="Transaksi berhasil" onBack={() => navigation.goBack()} />

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🧾</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary }}>
            Belum ada transaksi
          </Text>
        </View>
      ) : (
        <>
          {/* Stats Summary */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: theme.colors.info }]}>{transactions.length}</Text>
              <Text style={styles.statLabel}>Transaksi</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: theme.colors.success }]}>
                Rp {formatRupiah(transactions.reduce((s: number, t: any) => s + (t.grand_total || 0), 0))}
              </Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
          </View>

          {transactions.map((trx, idx) => (
            <TouchableOpacity key={idx} onPress={() => handleViewReceipt(trx.code)}>
              <GlassCard padded style={{ marginBottom: 8 }}>
                <View style={styles.trxHeader}>
                  <Text style={styles.trxCode}>{trx.code || '-'}</Text>
                  <StatusBadge label={trx.payment_status === 'PAID' ? 'Success' : trx.payment_status}
                    variant={statusVariant(trx.payment_status)} />
                </View>
                <View style={styles.trxBody}>
                  <View style={styles.trxInfo}>
                    <Text style={styles.trxInfoIcon}>👤</Text>
                    <Text style={styles.trxInfoText}>{trx.customer_name || 'Walk-in'}</Text>
                  </View>
                  <View style={styles.trxInfo}>
                    <Text style={styles.trxInfoIcon}>📅</Text>
                    <Text style={styles.trxInfoText}>
                      {trx.date ? new Date(trx.date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      }) : '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.trxFooter}>
                  <Text style={styles.trxItems}>{trx.items_count || 0} item</Text>
                  <Text style={styles.trxTotal}>Rp {formatRupiah(trx.grand_total || 0)}</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 16 },
  bgGlow: {
    position: 'absolute', top: -60, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(245,158,11,0.03)',
  },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  statsRow: {
    flexDirection: 'row', backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 10, color: theme.colors.textMuted, marginTop: 2 },
  statSep: { width: 1, backgroundColor: theme.colors.border, marginHorizontal: 8 },
  trxHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  trxCode: { fontSize: 12, fontWeight: '700', color: theme.colors.text, fontFamily: 'monospace' },
  trxBody: { gap: 4, marginBottom: 8 },
  trxInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trxInfoIcon: { fontSize: 11 },
  trxInfoText: { fontSize: 12, color: theme.colors.textSecondary, flex: 1 },
  trxFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  trxItems: { fontSize: 11, color: theme.colors.textMuted },
  trxTotal: { fontSize: 14, fontWeight: '700', color: theme.colors.accent },
});
