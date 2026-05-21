/**
 * Payment Screen — Premium
 * Method selection with gradient cards, amount summary, QRIS/Transfer info
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import { GlassCard, PageHeader } from '../components';
import { formatRupiah } from '../utils/formatters';

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Tunai', icon: '💵', color: theme.colors.cash },
  { key: 'QRIS', label: 'QRIS', icon: '📱', color: theme.colors.qris },
  { key: 'DEBIT', label: 'Kartu Debit', icon: '💳', color: theme.colors.debit },
  { key: 'TRANSFER', label: 'Transfer', icon: '🏦', color: theme.colors.transfer },
];

export default function PaymentScreen({ route, navigation }: any) {
  const { transaction, grandTotal } = route.params || { grandTotal: 0 };
  const [selectedMethod, setSelectedMethod] = useState('CASH');
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    setProcessing(false);
    setShowSuccess(true);
  };

  const methodLabel = selectedMethod === 'CASH' ? 'Tunai'
    : selectedMethod === 'QRIS' ? 'QRIS'
    : selectedMethod === 'DEBIT' ? 'Debit' : 'Transfer';

  return (
    <View style={styles.container}>
      <View style={styles.bgGlow} />
      <PageHeader title="Payment" subtitle="Pilih metode pembayaran" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <GlassCard padded style={{ marginBottom: 20, alignItems: 'center' }}>
          <Text style={styles.amountLabel}>Total Pembayaran</Text>
          <Text style={styles.amountValue}>Rp {formatRupiah(grandTotal)}</Text>
          <View style={styles.amountDivider} />
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionLabel}>Invoice</Text>
            <Text style={styles.transactionValue}>{transaction?.code || '-'}</Text>
          </View>
        </GlassCard>

        <Text style={styles.methodTitle}>Metode Pembayaran</Text>
        <View style={styles.methodGrid}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity key={method.key}
              style={[
                styles.methodCard,
                selectedMethod === method.key && styles.methodCardActive,
                selectedMethod === method.key && { borderColor: method.color },
              ]}
              onPress={() => setSelectedMethod(method.key)}
            >
              <View style={[styles.methodIconWrap, { backgroundColor: `${method.color}15` }]}>
                <Text style={styles.methodIcon}>{method.icon}</Text>
              </View>
              <Text style={[styles.methodLabel, selectedMethod === method.key && { color: method.color }]}>
                {method.label}
              </Text>
              {selectedMethod === method.key && (
                <View style={[styles.methodCheck, { backgroundColor: method.color }]}>
                  <Text style={styles.methodCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <GlassCard padded style={{ marginBottom: 20 }}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              {selectedMethod === 'CASH' ? 'Siapkan uang tunai untuk pembayaran' :
               selectedMethod === 'QRIS' ? 'Scan QRIS yang tersedia di kasir' :
               selectedMethod === 'DEBIT' ? 'Tap/Swipe kartu di EDC' :
               'Transfer ke rekening yang terdaftar'}
            </Text>
          </View>
        </GlassCard>

        <TouchableOpacity
          style={[styles.payBtn, processing && { opacity: 0.5 }]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18 }}>{PAYMENT_METHODS.find(m => m.key === selectedMethod)?.icon}</Text>
              <Text style={styles.payBtnText}>Bayar Rp {formatRupiah(grandTotal)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      {showSuccess && (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.modalBg}>
            <View style={styles.modalBox}>
              <View style={styles.successCircle}>
                <Text style={styles.successCheck}>✓</Text>
              </View>
              <Text style={styles.modalTitle}>✅ Pembayaran Berhasil</Text>
              <Text style={styles.modalSub}>{methodLabel} — Rp {formatRupiah(grandTotal)}</Text>
              <View style={styles.modalDivider} />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtn} onPress={() => {
                  setShowSuccess(false);
                  navigation.replace('Receipt', { code: transaction?.code });
                }}>
                  <Text style={styles.modalBtnText}>Lihat Struk</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.bgCard, borderWidth: 1, borderColor: theme.colors.border }]}
                  onPress={() => {
                    setShowSuccess(false);
                    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                  }}>
                  <Text style={[styles.modalBtnText, { color: theme.colors.text }]}>Selesai</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  bgGlow: {
    position: 'absolute', bottom: -100, right: -60,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(240,160,112,0.04)',
  },
  content: { flex: 1, paddingHorizontal: 16 },
  amountLabel: { fontSize: 11, color: theme.colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  amountValue: {
    fontSize: 36, fontWeight: '700', color: theme.colors.text,
    marginTop: 8, letterSpacing: -1,
  },
  amountDivider: { height: 1, backgroundColor: theme.colors.border, width: '100%', marginVertical: 16 },
  transactionInfo: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  transactionLabel: { fontSize: 12, color: theme.colors.textSecondary },
  transactionValue: { fontSize: 12, fontWeight: '600', color: theme.colors.text, fontFamily: 'monospace' },
  methodTitle: {
    fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  methodCard: {
    width: '47%', backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg, padding: 20,
    borderWidth: 1.5, borderColor: theme.colors.border,
    position: 'relative',
  },
  methodCardActive: {
    borderWidth: 1.5, ...theme.shadows.glow,
  },
  methodIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  methodIcon: { fontSize: 22 },
  methodLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  methodCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  methodCheckText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoIcon: { fontSize: 14, marginTop: 1 },
  infoText: { fontSize: 12, color: theme.colors.textSecondary, flex: 1, lineHeight: 20 },
  payBtn: {
    backgroundColor: theme.colors.accent, borderRadius: theme.radius.md,
    padding: 20, alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Modal
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.xxl,
    padding: 32, alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.success,
    marginHorizontal: 24,
    width: '85%',
  },
  successCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: theme.colors.successLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 3, borderColor: theme.colors.success,
  },
  successCheck: { fontSize: 36, color: theme.colors.success, fontWeight: '700' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  modalSub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4, textAlign: 'center' },
  modalDivider: { height: 1, backgroundColor: theme.colors.border, width: '100%', marginVertical: 16 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: {
    flex: 1, backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md, padding: 14, alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
