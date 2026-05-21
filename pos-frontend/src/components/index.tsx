/**
 * Premium Reusable Components
 */
import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ViewStyle, TextStyle,
} from 'react-native';
import { theme } from '../theme';

// ─── Glass Card ─────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  highlight?: 'accent' | 'success' | 'warning' | 'error' | 'info' | 'none';
  padded?: boolean;
}

export function GlassCard({ children, style, highlight = 'none', padded = true }: GlassCardProps) {
  const borderColor = highlight === 'none' ? 'transparent'
    : highlight === 'accent' ? 'rgba(240,160,112,0.2)'
    : highlight === 'success' ? 'rgba(52,211,153,0.2)'
    : highlight === 'warning' ? 'rgba(245,158,11,0.2)'
    : highlight === 'error' ? 'rgba(239,68,68,0.2)'
    : 'rgba(34,211,238,0.2)';

  return (
    <View style={[
      styles.card,
      theme.shadows.card,
      padded && { padding: theme.spacing.lg },
      highlight !== 'none' && { borderColor, borderWidth: 1 },
      style,
    ]}>
      {children}
    </View>
  );
}

// ─── Gradient Button ─────────────────────────
interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'accent' | 'success' | 'error' | 'info' | 'warning' | 'outline' | 'ghost';
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function GradientButton({
  title, onPress, loading, disabled, variant = 'accent',
  icon, size = 'md', style, fullWidth = true,
}: GradientButtonProps) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const bgColors: Record<string, string> = {
    accent: theme.colors.accent,
    success: theme.colors.success,
    error: theme.colors.error,
    info: theme.colors.info,
    warning: theme.colors.warning,
  };

  const sizeStyles: Record<string, { padding: number; fontSize: number; iconSize: number }> = {
    sm: { padding: 10, fontSize: 13, iconSize: 16 },
    md: { padding: 16, fontSize: 15, iconSize: 18 },
    lg: { padding: 20, fontSize: 17, iconSize: 22 },
  };

  const s = sizeStyles[size];
  const isActive = variant !== 'outline' && variant !== 'ghost';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        fullWidth && { width: '100%' },
        isActive && {
          backgroundColor: bgColors[variant] || theme.colors.accent,
          ...theme.shadows.glow,
        },
        isOutline && {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.accent,
        },
        isGhost && {
          backgroundColor: 'transparent',
        },
        size === 'sm' && { paddingVertical: s.padding, paddingHorizontal: s.padding + 8, borderRadius: theme.radius.sm },
        size === 'md' && { paddingVertical: s.padding, borderRadius: theme.radius.md },
        size === 'lg' && { paddingVertical: s.padding, borderRadius: theme.radius.lg },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isActive ? theme.colors.textInverse : theme.colors.accent} />
      ) : (
        <View style={styles.btnContent}>
          {icon && <Text style={{ fontSize: s.iconSize, marginRight: 8 }}>{icon}</Text>}
          <Text style={[
            styles.btnText,
            { fontSize: s.fontSize },
            isActive && { color: theme.colors.textInverse },
            isOutline && { color: theme.colors.accent },
            isGhost && { color: theme.colors.textSecondary },
          ]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Input Field ─────────────────────────────
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  icon?: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  secureTextEntry?: boolean;
  multiline?: boolean;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export function InputField({
  label, value, onChangeText, placeholder, required,
  icon, keyboardType, secureTextEntry, multiline, rightElement, style,
}: InputFieldProps) {
  return (
    <View style={[styles.inputGroup, style]}>
      <Text style={styles.inputLabel}>
        {icon && <Text style={{ marginRight: 4 }}>{icon}</Text>}
        {label}
        {required && <Text style={{ color: theme.colors.error }}> *</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            multiline && { minHeight: 80, textAlignVertical: 'top' },
            rightElement && { paddingRight: 44 },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          selectionColor={theme.colors.accent}
        />
        {rightElement && (
          <View style={styles.inputRight}>{rightElement}</View>
        )}
      </View>
    </View>
  );
}

// ─── Status Badge ────────────────────────────
interface StatusBadgeProps {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  style?: ViewStyle;
}

export function StatusBadge({ label, variant, style }: StatusBadgeProps) {
  const colorMap = {
    success: { bg: theme.colors.successLight, text: theme.colors.success },
    warning: { bg: theme.colors.warningLight, text: theme.colors.warning },
    error: { bg: theme.colors.errorLight, text: theme.colors.error },
    info: { bg: theme.colors.infoLight, text: theme.colors.info },
    neutral: { bg: 'rgba(139,146,176,0.1)', text: theme.colors.textSecondary },
  };
  const c = colorMap[variant];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      <View style={[styles.badgeDot, { backgroundColor: c.text }]} />
      <Text style={[styles.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

// ─── Section Header ─────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, right }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

// ─── Stat Card ───────────────────────────────
interface StatCardProps {
  value: string;
  label: string;
  variant?: 'accent' | 'success' | 'info' | 'warning' | 'error';
  icon?: string;
  style?: ViewStyle;
}

export function StatCard({ value, label, variant = 'accent', icon, style }: StatCardProps) {
  const gradientMap = {
    accent: theme.colors.accentGradient,
    success: theme.gradients.success,
    info: theme.gradients.info,
    warning: theme.gradients.warning,
    error: theme.gradients.error,
  };
  const [g1, g2] = gradientMap[variant];

  return (
    <View style={[styles.statCard, { borderColor: g1 }, style]}>
      {icon && <Text style={{ fontSize: 24, marginBottom: 8 }}>{icon}</Text>}
      <Text style={[styles.statValue, { color: g1 }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statBar, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
        <View style={[styles.statBarFill, { backgroundColor: g1, width: '100%' }]} />
      </View>
    </View>
  );
}

// ─── Page Header ─────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function PageHeader({ title, subtitle, onBack, rightAction }: PageHeaderProps) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderLeft}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.pageTitle}>{title}</Text>
          {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightAction}
    </View>
  );
}

// ─── Summary Row ─────────────────────────────
interface SummaryRowProps {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
  borderTop?: boolean;
}

export function SummaryRow({ label, value, valueColor, bold, borderTop }: SummaryRowProps) {
  return (
    <View style={[
      styles.summaryRow,
      borderTop && { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, marginTop: 12 },
    ]}>
      <Text style={[styles.summaryLabel, bold && { fontWeight: '700', color: theme.colors.text }]}>{label}</Text>
      <Text style={[
        styles.summaryValue,
        bold && { fontWeight: '700' },
        valueColor ? { color: valueColor } : null,
      ]}>{value}</Text>
    </View>
  );
}

// ─── Loading Screen ──────────────────────────
export function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={theme.colors.accent} size="large" />
    </View>
  );
}

// ─── Amount Display ──────────────────────────
interface AmountDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  prefix?: string;
}

export function AmountDisplay({ amount, size = 'md', color, prefix = 'Rp' }: AmountDisplayProps) {
  const sizeMap = { sm: 14, md: 20, lg: 28 };
  return (
    <Text style={[
      styles.amountText,
      { fontSize: sizeMap[size], color: color || theme.colors.text },
    ]}>
      {prefix} {amount.toLocaleString('id-ID')}
    </Text>
  );
}

// ─── Styles ──────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.radius.md,
    padding: 14,
    fontSize: 15,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputRight: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  statCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  statBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 12,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backArrow: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountText: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
