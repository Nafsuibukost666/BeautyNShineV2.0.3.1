/**
 * POS Invoice Screen — Premium
 * Service grid with category filters, cart with swipe-to-remove, discount
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { posAPI, bookingAPI } from '../services/api';
import { parseRupiah, rupiahDisplay, formatRupiah } from '../utils/formatters';
import { Service, Product, Staff } from '../services/types';
import { theme } from '../theme';
import { GlassCard, PageHeader, LoadingScreen } from '../components';

interface CartItem {
  item_type: 'service' | 'product';
  item_name: string;
  qty: number;
  unit_price: number;
  discount: number;
  staff_id?: string;
  staff_name?: string;
  line_total: number;
}

type TabType = 'services' | 'products';

export default function POSScreen({ navigation }: any) {
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountText, setDiscountText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  // Booking reference
  const [showBookingPicker, setShowBookingPicker] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingResults, setBookingResults] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await posAPI.getInitialData();
      setServices(res.data.data.services);
      setProducts(res.data.data.products);
      setStaffList(res.data.data.staff);
      setCustomers(res.data.data.customers || []);
    } catch { Alert.alert('Error', 'Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const searchCustomers = async (q: string) => {
    setCustomerSearch(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const qLower = q.toLowerCase();
    const results = customers.filter((c: any) =>
      (c.name || '').toLowerCase().includes(qLower) ||
      (c.phone || '').toLowerCase().includes(qLower)
    );
    setSearchResults(results);
  };

  const searchBookings = async (q: string) => {
    setBookingSearch(q);
    if (q.length < 2) { setBookingResults([]); return; }
    try {
      const res = await bookingAPI.searchBookings(q);
      setBookingResults(res.data.data || []);
    } catch { setBookingResults([]); }
  };

  const selectBooking = (b: any) => {
    setCustomerName(b.customerName || '');
    setCustomerPhone(b.customerPhone || '');
    setShowBookingPicker(false);
    setBookingSearch('');
    setBookingResults([]);
  };

  const selectCustomer = (c: any) => {
    setCustomerName(c.name || '');
    setCustomerPhone(c.phone || '');
    setShowCustomerPicker(false);
    setCustomerSearch('');
    setSearchResults([]);
  };

  const addToCart = (item: Service | Product, type: 'service' | 'product') => {
    const price = type === 'service' ? (item as Service).price : (item as Product).selling_price;
    const existing = cart.findIndex(i => i.item_name === item.name && i.item_type === type);
    if (existing >= 0) {
      const newCart = [...cart];
      newCart[existing].qty += 1;
      newCart[existing].line_total = newCart[existing].qty * newCart[existing].unit_price - newCart[existing].discount;
      setCart(newCart);
    } else {
      setCart([...cart, {
        item_type: type, item_name: item.name, qty: 1,
        unit_price: price, discount: 0,
        line_total: price,
      }]);
    }
  };

  const removeItem = (idx: number) => setCart(cart.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((sum, i) => sum + i.unit_price * i.qty, 0);
  const discount = parseRupiah(discountText);
  const grandTotal = Math.max(0, subtotal - discount);

  const handleSubmit = async () => {
    if (cart.length === 0) { Alert.alert('Error', 'Pilih minimal 1 item'); return; }
    setSubmitting(true);
    try {
      const sessStr = await AsyncStorage.getItem('session');
      const session = sessStr ? JSON.parse(sessStr) : null;
      const res = await posAPI.createTransaction({
        customer: customerName ? { name: customerName, phone: customerPhone } : undefined,
        items: cart.map(i => ({
          item_type: i.item_type, item_name: i.item_name,
          qty: i.qty, unit_price: i.unit_price,
          discount: i.discount, staff_id: i.staff_id, staff_name: i.staff_name,
        })),
        payments: [{ method: 'CASH', amount: grandTotal }],
        discount,
        session_id: session?.id ? String(session.id) : undefined,
      });
      if (res.data.success) {
        navigation.replace('Payment', { transaction: res.data.data, grandTotal });
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Gagal simpan transaksi');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={styles.bgGlow} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <PageHeader title="POS Invoice" subtitle="Buat transaksi baru" onBack={() => navigation.goBack()} />

      {/* Customer Section */}
      <GlassCard padded style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>👤 Customer</Text>
        </View>
        <View style={styles.customerRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <TextInput style={styles.input} placeholder="Nama customer"
              placeholderTextColor={theme.colors.textMuted} value={customerName} onChangeText={setCustomerName} />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput style={styles.input} placeholder="Telepon"
              placeholderTextColor={theme.colors.textMuted} value={customerPhone} onChangeText={setCustomerPhone}
              keyboardType="phone-pad" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity style={[styles.refBtn, { flex: 1 }]} onPress={() => setShowCustomerPicker(true)}>
            <Text style={styles.refBtnText}>📋 Data Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.refBtn, { flex: 1, borderColor: 'rgba(240,160,112,0.3)', backgroundColor: 'rgba(240,160,112,0.1)' }]}
            onPress={() => setShowBookingPicker(true)}>
            <Text style={[styles.refBtnText, { color: theme.colors.accent }]}>📅 Referensi Booking</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Items Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'services' && styles.tabActive]}
          onPress={() => setActiveTab('services')}>
          <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>💇 Layanan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}>
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>🧴 Produk</Text>
        </TouchableOpacity>
      </View>

      {/* Item Grid */}
      <View style={styles.itemGrid}>
        {activeTab === 'services' ? (
          services.length === 0 ? (
            <Text style={styles.empty}>Belum ada layanan</Text>
          ) : services.map((svc) => (
            <TouchableOpacity key={svc.id} style={styles.itemCard} onPress={() => addToCart(svc, 'service')}>
              <Text style={styles.itemName}>{svc.name}</Text>
              <Text style={styles.itemPrice}>Rp {formatRupiah(svc.price)}</Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemDuration}>⏱ {svc.duration_min}m</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          products.length === 0 ? (
            <Text style={styles.empty}>Belum ada produk</Text>
          ) : products.map((prod) => (
            <TouchableOpacity key={prod.id} style={styles.itemCard} onPress={() => addToCart(prod, 'product')}>
              <Text style={styles.itemName}>{prod.name}</Text>
              <Text style={[styles.itemPrice, { color: theme.colors.info }]}>Rp {formatRupiah(prod.selling_price)}</Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemDuration}>📦 {prod.stock_qty} tersisa</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Cart */}
      {cart.length > 0 && (
        <GlassCard padded style={{ marginTop: 16, marginBottom: 16 }}>
          <View style={styles.cartHeader}>
            <Text style={styles.sectionTitle}>🛒 Keranjang</Text>
            <Text style={styles.cartCount}>{cart.length} item</Text>
          </View>

          {cart.map((item, idx) => (
            <View key={idx} style={styles.cartItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartItemName}>{item.item_name}</Text>
                <View style={styles.cartItemMeta}>
                  <Text style={styles.cartItemQty}>x{item.qty}</Text>
                  <Text style={styles.cartItemPrice}>Rp {formatRupiah(item.unit_price * item.qty)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Discount */}
          <View style={styles.discountRow}>
            <Text style={styles.discountLabel}>Diskon</Text>
            <TextInput style={styles.discountInput}
              value={discountText} onChangeText={(v) => setDiscountText(v ? rupiahDisplay(v) : '')}
              placeholder="0" placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad" />
          </View>

          {/* Total */}
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>Rp {formatRupiah(subtotal)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.error }]}>Diskon</Text>
                <Text style={[styles.totalValue, { color: theme.colors.error }]}>- Rp {formatRupiah(discount)}</Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.accent, fontWeight: '700', fontSize: 15 }]}>Grand Total</Text>
              <Text style={[styles.totalValue, { color: theme.colors.accent, fontWeight: '700', fontSize: 18 }]}>
                Rp {formatRupiah(grandTotal)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.payBtn, submitting && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18 }}>💳</Text>
                <Text style={styles.payBtnText}>Bayar Rp {formatRupiah(grandTotal)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </GlassCard>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>

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

      {/* Booking Picker Modal */}
      <Modal visible={showBookingPicker} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Cari Booking</Text>
            <TextInput style={styles.modalSearch}
              placeholder="Cari nama customer..."
              placeholderTextColor={theme.colors.textMuted}
              value={bookingSearch} onChangeText={searchBookings}
              autoFocus
            />
            <ScrollView style={{ maxHeight: 350 }}>
              {bookingResults.length === 0 && bookingSearch.length > 1 ? (
                <Text style={{ textAlign: 'center', color: theme.colors.textMuted, padding: 20, fontSize: 13 }}>
                  Tidak ditemukan
                </Text>
              ) : bookingSearch.length < 2 ? (
                <Text style={{ textAlign: 'center', color: theme.colors.textMuted, padding: 20, fontSize: 13 }}>
                  Ketik minimal 2 karakter untuk mencari
                </Text>
              ) : bookingResults.map((b: any, i) => (
                <TouchableOpacity key={i} style={styles.customerItem} onPress={() => selectBooking(b)}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>{(b.customerName || '?')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.customerName}>{b.customerName || '-'}</Text>
                      <View style={{ backgroundColor: 'rgba(240,160,112,0.2)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: theme.colors.accent }}>{b.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.customerPhone}>
                      {b.therapistName || ''}{b.therapistName ? ' · ' : ''}{b.date ? new Date(b.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                  <Text style={[styles.selectIcon, { color: theme.colors.accent }]}>→</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => { setShowBookingPicker(false); setBookingSearch(''); setBookingResults([]); }}>
              <Text style={styles.modalCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 16 },
  bgGlow: {
    position: 'absolute', top: -60, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(52,211,153,0.03)',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 0.3 },
  customerRow: { flexDirection: 'row', marginTop: 12 },
  input: {
    backgroundColor: theme.colors.bgInput, borderRadius: theme.radius.sm, padding: 12,
    fontSize: 13, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border,
  },
  // Tabs
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgCard, alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  tabActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
  tabText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  tabTextActive: { color: theme.colors.accent },
  // Item Grid
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  itemCard: {
    width: '48.5%', backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md, padding: 14,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  itemName: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: theme.colors.success },
  itemMeta: { marginTop: 4 },
  itemDuration: { fontSize: 10, color: theme.colors.textMuted },
  empty: { width: '100%', textAlign: 'center', color: theme.colors.textMuted, paddingVertical: 32, fontSize: 13 },
  // Cart
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cartCount: { fontSize: 12, color: theme.colors.textMuted },
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.bgInput, borderRadius: theme.radius.sm,
    padding: 12, marginBottom: 6,
  },
  cartItemName: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  cartItemMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cartItemQty: { fontSize: 11, color: theme.colors.textMuted },
  cartItemPrice: { fontSize: 12, fontWeight: '600', color: theme.colors.success },
  removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  removeBtnText: { fontSize: 14, color: theme.colors.error, fontWeight: '700' },
  // Discount
  discountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 12 },
  discountLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  discountInput: {
    backgroundColor: theme.colors.bgInput, borderRadius: theme.radius.sm,
    padding: 8, paddingHorizontal: 12, fontSize: 14, color: theme.colors.text,
    borderWidth: 1, borderColor: theme.colors.border, width: 140, textAlign: 'right',
  },
  // Total
  totalCard: {
    backgroundColor: theme.colors.bgInput, borderRadius: theme.radius.md,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 13, color: theme.colors.textSecondary },
  totalValue: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  totalDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 8 },
  payBtn: {
    backgroundColor: theme.colors.success, borderRadius: theme.radius.md,
    padding: 16, alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Customer Reference
  refBtn: {
    backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: theme.radius.sm,
    paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)',
  },
  refBtnText: { color: theme.colors.success, fontSize: 11, fontWeight: '700' },
  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: theme.colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
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
  modalClose: { marginTop: 12, alignItems: 'center', padding: 12 },
  modalCloseText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
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
});
