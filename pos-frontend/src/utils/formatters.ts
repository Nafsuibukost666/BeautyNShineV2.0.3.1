/**
 * Format number: bersihin non-digit, parse jadi integer
 * "50.000" → 50000
 * "1.500.000" → 1500000
 */
export function parseRupiah(text: string): number {
  return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * Format number ke string ribuan Indonesia
 * 50000 → "50.000"
 * 1500000 → "1.500.000"
 * Safe: handles undefined, null, NaN → returns "0"
 */
export function formatRupiah(amount: any): string {
  const n = Number(amount || 0);
  if (isNaN(n)) return '0';
  return n.toLocaleString('id-ID');
}

/**
 * Format input untuk TextInput: panggil onChangeText dengan raw number
 * Tapi tampilkan dengan titik
 */
export function rupiahDisplay(text: string): string {
  const num = parseRupiah(text);
  if (num === 0 && text === '') return '';
  return formatRupiah(num);
}
