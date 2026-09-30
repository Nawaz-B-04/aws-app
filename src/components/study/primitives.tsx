import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

export function Screen({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWidth}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}>{children}</View>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {action && onAction && <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}><Text style={[styles.link, { color: theme.primary }]}>{action}  →</Text></Pressable>}
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: secondary ? theme.primarySoft : theme.primary, opacity: disabled ? 0.45 : pressed ? 0.82 : 1 }]}>
      <Text style={[styles.buttonText, { color: secondary ? theme.primary : theme.backgroundElement }]}>{title}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const theme = useTheme();
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: value }} style={[styles.track, { backgroundColor: theme.border }]}>
    <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color ?? theme.primary }]} />
  </View>;
}

export function StatCard({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return <Card style={styles.statCard}><Text style={[styles.statValue, { color: theme.text }]}>{value}</Text><Text style={[styles.small, { color: theme.textSecondary }]}>{label}</Text></Card>;
}

export const studyStyles = StyleSheet.create({
  pageTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  eyebrow: { fontSize: 12, lineHeight: 18, fontWeight: '700', letterSpacing: 1.2 },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  cardTitle: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36, flexGrow: 1 },
  contentWidth: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 18 },
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  link: { fontSize: 14, lineHeight: 22, fontWeight: '700' },
  button: { minHeight: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  track: { height: 8, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  statCard: { flex: 1, minWidth: 80, padding: 14, gap: 3 },
  statValue: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  small: { fontSize: 14, lineHeight: 20 },
  smallStrong: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  topicHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicBadge: { minWidth: 54, minHeight: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  topicBadgeText: { fontSize: 16, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 24 },
  progressLabel: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  cardTitle: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  conceptRow: { gap: 4 },
  eyebrow: { fontSize: 11, lineHeight: 17, fontWeight: '800', letterSpacing: 1.1 },
  remember: { padding: 14, borderRadius: 14, gap: 4, marginTop: 2 },
});
