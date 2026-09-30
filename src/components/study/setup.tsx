import { Pressable, Text, View } from 'react-native';
import { studyStyles } from '@/components/study/primitives';
import { useTheme } from '@/hooks/use-theme';

export function Choices<T extends string | number>({ label, values, selected, onChange }: { label: string; values: { value: T; title: string }[]; selected: T; onChange: (value: T) => void }) {
  const theme = useTheme();
  return <View style={{ gap: 8 }}><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{label}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {values.map((item) => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: selected === item.value }} onPress={() => onChange(item.value)}
      style={{ paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: selected === item.value ? theme.primary : theme.border, backgroundColor: selected === item.value ? theme.primarySoft : theme.backgroundElement }}>
      <Text style={[studyStyles.small, { color: theme.text, fontWeight: '700' }]}>{item.title}</Text></Pressable>)}
  </View></View>;
}
