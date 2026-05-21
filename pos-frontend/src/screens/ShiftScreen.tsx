/**
 * Shift Screen — Premium
 * Elegant cash opening flow with glass card, summary preview, gradient CTA
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionAPI } from '../services/api';
import { parseRupiah, rupiahDisplay } from '../utils/formatters';
import { theme } from '../theme';
import { PageHeader, LoadingScreen } from '../components';

export default function ShiftScreen({ navigation }: any) {
  const [openingCash, setOpeningCash] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { checkActiveSession(); }, []);

  const checkActiveSession = async () => {
    setLoading(true);
    try {
      const res = await sessionAPI.getActive();
      if (res.data.success && res.data.data?.status === 'OPEN') {
        await AsyncStorage.setItem('session', JSON.stringify(res.data.data));
        navigation.replace('Home');
        return;
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleCashChange = (text: string) => {
    const raw = text.replace(/[^0-9]/g, '');
    if (raw === '') { setOpeningCash(''); return; }
    setOpeningCash(rupiahDisplay(raw));
  };

  const openShift = async () => {
    const cash = parseRupiah(openingCash);
    if (isNaN(cash) || cash < 0) {
      Alert.alert('Error', 'Saldo awal harus diisi dengan benar');
      return;
    }
    setSubmitting(true);
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) { Alert.alert('Error', 'Sesi habis, login ulang'); navigation.replace('Login'); return; }

      const res = await sessionAPI.openSession({ openedBy: user.username, openingCash: cash });
      if (res.data.success) {
        await AsyncStorage.setItem('session', JSON.stringify(res.data.data));
        navigation.replace('Home');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || '';
      if (typeof detail === 'string' && detail.toLowerCase().includes('sesi aktif')) {
        try {
          const activeRes = await sessionAPI.getActive();
          if (activeRes.data.success && activeRes.data.data) {
            await AsyncStorage.setItem('session', JSON.stringify(activeRes.data.data));
            navigation.replace('Home');
            return;
          }
        } catch {}
      }
      Alert.alert('Info', typeof detail === 'string' ? detail : 'Gagal buka shift');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🕐</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Open Shift</Text>
        <Text style={styles.subtitle}>Mulai shift kasir dengan saldo awal</Text>

        {/* Amount Input */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>SALDO AWAL KAS</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencySign}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={theme.colors.textMuted}
              value={openingCash}
              onChangeText={handleCashChange}
              keyboardType="number-pad"
              selectionColor={theme.colors.accent}
            />
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountHint}>
            <Text style={styles.hintLabel}>Masukkan jumlah uang tunai yang ada di laci kasir saat membuka shift</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.openBtn, submitting && styles.btnDisabled]}
          onPress={openShift}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <View style={styles.btnContent}>
              <Text style={styles.openBtnText}>Open Shift</Text>
              <Text style={styles.openBtnArrow}>→</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Home')}>
          <Text style={styles.skipText}>Lewati (tanpa shift)</Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Pastikan saldo awal sesuai dengan uang tunai yang ada di laci kasir
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  bgGlow1: {
    position: 'absolute', top: -120, right: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(240,160,112,0.06)',
  },
  bgGlow2: {
    position: 'absolute', bottom: -100, left: -60,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(34,211,238,0.04)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  amountCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  currencySign: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    minWidth: 200,
    paddingVertical: 8,
  },
  amountDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  amountHint: {
    alignItems: 'center',
  },
  hintLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  openBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  btnDisabled: { opacity: 0.6 },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openBtnText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  openBtnArrow: {
    color: theme.colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
  },
  skipBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(240,160,112,0.06)',
    borderRadius: theme.radius.md,
    padding: 14,
    marginTop: 24,
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(240,160,112,0.15)',
  },
  infoIcon: { fontSize: 14, marginTop: 1 },
  infoText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
