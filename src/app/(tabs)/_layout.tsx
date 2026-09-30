import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const icons: Record<string, string> = { index: '⌂', learn: '□', practice: '◎', exam: '◇', progress: '▥' };
export default function TabLayout() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.primary, tabBarInactiveTintColor: theme.textSecondary,
    tabBarStyle: { backgroundColor: theme.backgroundElement, borderTopColor: theme.border, height: 68, paddingTop: 7, paddingBottom: 8 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' } }}>
    {([['index', 'Home'], ['learn', 'Learn'], ['practice', 'Practice'], ['exam', 'Exam'], ['progress', 'Progress']] as const).map(([name, title]) =>
      <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24, fontWeight: '700' }}>{icons[name]}</Text> }} />)}
  </Tabs>;
}
