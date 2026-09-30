import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { StudyProvider } from '@/state/study-store';

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}><StudyProvider>
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="note/[id]" options={{ title: 'Revision note' }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Study session' }} />
      <Stack.Screen name="review" options={{ title: 'Review' }} />
      <Stack.Screen name="topic/[id]" options={{ title: 'Topic' }} />
    </Stack>
  </StudyProvider></ThemeProvider>;
}
