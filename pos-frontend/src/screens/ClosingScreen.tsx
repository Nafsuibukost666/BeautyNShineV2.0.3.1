/**
 * Closing Screen — Premium
 * Shift summary with expense list, animated success modal
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionAPI } from '../services/api';
import { theme } from '../theme';
import { LoadingScreen, PageHeader } from '../components';
import { formatRupiah } from '../utils/formatters';

function fmt(v: any): string {
  const n = Number(v || 0);
  if (isNaN(n)) return '0';
  return n.toLocaleString('id-ID');
}

function parseNum(t: string): number {
  return parseInt(t.replace(/[^0-9]/g, ''), 10) || 0;
}

export default function ClosingScreen({ navigation }: any) {
  const [session, setSession] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmountText, setExpAmountText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { loadSession(); }, []);

  const loadSession = async () => {
    try {
      const sessStr = await AsyncStorage.getItem('session');
      if (!sessStr) {
        setLoading(false);
        return;
      }
      const cached = JSON.parse(sessStr);

      // Refresh session data from API to get real total_sales / total_transactions
      try {
        const activeRes = await sessionAPI.getActive();
        if (activeRes.data?.success && activeRes.data?.data) {
          const fresh = activeRes.data.data;
          setSession(fresh);
          setClosingCash(fmt(fresh.total_sales || 0));
          await AsyncStorage.setItem('session', JSON.stringify(fresh));
        } else {
          setSession(cached);
          setClosingCash(fmt(cached.total_sales));
        }
      } catch {
        // API unavailable — use cached data
        setSession(cached);
        setClosingCash(fmt(cached.total_sales));
      }

      try {
        const res = await sessionAPI.getExpenses(cached.id);
        if (res.data?.success) setExpenses(res.data.data?.items || []);
      } catch {}
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (!expDesc || !expAmountText) return;
    try {
      const res = await sessionAPI.addExpense(session.id, {
        description: expDesc,
        amount: parseNum(expAmountText),
      });
      if (res.data?.success) {
        setExpenses([...expenses, res.data.data]);
        setExpDesc(''); setExpAmountText('');
      }
    } catch {}
  };

  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const expectedCash = (session?.opening_cash || 0) + (session?.total_sales || 0) - totalExpenses;

  const handleCloseShift = async () => {
    const finalCash = parseNum(closingCash);
    if (!closingCash || isNaN(finalCash)) return;
    setSubmitting(true);
    try {
      const res = await sessionAPI.closeSession(session.id, { closingCash: finalCash, notes });
      if (res.data?.success) {
        await AsyncStorage.removeItem('session');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }, 3000);
      }
    } catch (err: any) {
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Tutup Shift" subtitle="Akhiri shift kasir" onBack={() => navigation.goBack()} />

        {session ? (
          <>
            {/* Shift Summary */}
            <View style={s.card}>
              <Text style={s.cardTitle}>📊 Ringkasan Shift</Text>
              <View style={s.row}>
                <Text style={s.label}>Saldo Awal</Text>
                <Text style={s.val}>Rp {fmt(session.opening_cash)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Penjualan</Text>
                <Text style={[s.val, { color: theme.colors.success }]}>+ Rp {fmt(session.total_sales)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Pengeluaran</Text>
                <Text style={[s.val, { color: theme.colors.error }]}>- Rp {fmt(totalExpenses)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Transaksi</Text>
                <Text style={[s.val, { color: theme.colors.info }]}>{session.total_transactions || 0}x</Text>
              </View>
              <View style={s.divider} />
              <View style={s.row}>
                <Text style={[s.label, { fontWeight: '700', color: theme.colors.text }]}>Expected Cash</Text>
                <Text style={[s.val, { fontWeight: '700', color: theme.colors.accent }]}>Rp {fmt(expectedCash)}</Text>
              </View>
            </View>

            {/* Expenses */}
            <View style={s.card}>
              <Text style={s.cardTitle}>💰 Pengeluaran</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <TextInput style={s.inp} placeholder="Deskripsi"
                  placeholderTextColor={theme.colors.textMuted} value={expDesc} onChangeText={setExpDesc} />
                <TextInput style={[s.inp, { width: 100, marginHorizontal: 6 }]}
                  placeholder="Jumlah" placeholderTextColor={theme.colors.textMuted}
                  value={expAmountText} onChangeText={setExpAmountText}
                  keyboardType="number-pad" />
                <TouchableOpacity style={{
                  width: 40, height: 40, borderRadius: 8,
                  backgroundColor: theme.colors.accentLight, justifyContent: 'center', alignItems: 'center',
                  borderWidth: 1, borderColor: 'rgba(240,160,112,0.3)',
                }} onPress={addExpense}>
                  <Text style={{ fontSize: 20, color: theme.colors.accent, fontWeight: '700' }}>+</Text>
                </TouchableOpacity>
              </View>
              {expenses.length === 0 ? (
                <Text style={{ fontSize: 12, color: theme.colors.textMuted, textAlign: 'center', padding: 12 }}>
                  Belum ada pengeluaran
                </Text>
              ) : expenses.map((e: any, i: number) => (
                <View key={i} style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: theme.colors.bgInput, borderRadius: 8,
                  padding: 10, marginBottom: 4,
                }}>
                  <Text style={{ flex: 1, fontSize: 13, color: theme.colors.text }}>{e.description || '-'}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.error }}>
                    -Rp {fmt(e.amount)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Close Shift Form */}
            <View style={s.card}>
              <Text style={s.cardTitle}>🔒 Tutup Shift</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, marginBottom: 6 }}>
                KAS AKHIR (Rp)
              </Text>
              <TextInput style={s.bigInp}
                value={closingCash} onChangeText={(v) => setClosingCash(v ? fmt(parseNum(v) || 0) : '')}
                keyboardType="number-pad" placeholderTextColor={theme.colors.textMuted}
                placeholder="Jumlah kas akhir" />
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, marginTop: 12, marginBottom: 6 }}>
                CATATAN
              </Text>
              <TextInput style={[s.bigInp, { minHeight: 60, textAlignVertical: 'top', fontSize: 13, fontWeight: '400' }]}
                value={notes} onChangeText={setNotes} multiline
                placeholderTextColor={theme.colors.textMuted} placeholder="Catatan shift..." />
            </View>

            <TouchableOpacity
              style={[s.closeBtn, submitting && { opacity: 0.5 }]}
              onPress={handleCloseShift}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>🔒 Tutup Shift</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 24, marginBottom: 12 }}>🔒</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary }}>Tidak ada shift aktif</Text>
            <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>Buka shift terlebih dahulu</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success Modal */}
      {showSuccess && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: theme.colors.bgCard, borderRadius: 24,
            padding: 40, alignItems: 'center',
            borderWidth: 1, borderColor: theme.colors.success,
            marginHorizontal: 32, width: '80%',
          }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: theme.colors.successLight, justifyContent: 'center', alignItems: 'center',
              marginBottom: 16, borderWidth: 3, borderColor: theme.colors.success,
            }}>
              <Text style={{ fontSize: 40, color: theme.colors.success, fontWeight: '700' }}>✓</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.colors.text, textAlign: 'center' }}>Shift Closed</Text>
            <Text style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4, textAlign: 'center' }}>
              Proses tutup shift berhasil
            </Text>
            <View style={{ height: 1, backgroundColor: theme.colors.border, width: '100%', marginVertical: 16 }} />
            <View style={{ width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>Expected Cash</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.accent }}>Rp {fmt(expectedCash)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 13, color: theme.colors.textSecondary },
  val: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 8 },
  inp: {
    flex: 1, backgroundColor: theme.colors.bgInput, borderRadius: 8, padding: 10,
    fontSize: 13, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border,
  },
  bigInp: {
    backgroundColor: theme.colors.bgInput, borderRadius: 12, padding: 14,
    fontSize: 18, fontWeight: '700', color: theme.colors.text,
    borderWidth: 1, borderColor: theme.colors.border, textAlign: 'center',
  },
  closeBtn: {
    backgroundColor: '#ef4444', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 16,
  },
});
