import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { Text, useThemeColor } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { BusinessBooksProvider, useBusinessBooks } from '@/src/context/BusinessBooksContext';
import { ThemeProvider as AppThemeProvider, useThemePreference } from '@/src/context/ThemeContext';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const headerBackground = colorScheme === 'dark' ? '#020817' : '#f8fafc';

  return (
    <AppThemeProvider>
      <BusinessBooksProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: headerBackground },
              headerTitle: () => <BusinessHeader />,
              headerRight: () => <ThemeToggleButton />,
              headerShadowVisible: false,
            }}>
            <Stack.Screen name="(tabs)" options={{ title: 'Business Books', headerShown: true }} />
            <Stack.Screen name="entry/new" options={{ title: 'New entry' }} />
            <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
            <Stack.Screen name="chat/[threadId]" options={{ title: 'Chat' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </BusinessBooksProvider>
    </AppThemeProvider>
  );
}

function BusinessHeader() {
  const { activeBusiness } = useBusinessBooks();
  const cardBackground = useThemeColor({ light: '#f8fafc', dark: '#0f172a' }, 'background');
  const borderColor = useThemeColor({ light: '#dbe2ea', dark: '#334155' }, 'background');
  const textColor = useThemeColor({ light: '#0f172a', dark: '#e2e8f0' }, 'text');
  const mutedColor = useThemeColor({ light: '#475569', dark: '#cbd5e1' }, 'text');

  if (!activeBusiness) {
    return <Text style={{ fontWeight: '700', color: textColor }}>Business</Text>;
  }

  return (
    <View style={[styles.businessHeader, { backgroundColor: cardBackground, borderColor: borderColor }]}>
      <View style={[styles.businessBadge, { backgroundColor: activeBusiness.brandColor || '#2563eb' }]} />
      <View style={styles.businessHeaderText}>
        <Text style={[styles.businessHeaderName, { color: textColor }]}>{activeBusiness.name}</Text>
        <Text style={[styles.businessHeaderMeta, { color: mutedColor }]}>
          {activeBusiness.location || 'Location'} · {activeBusiness.email || 'Email'}
        </Text>
      </View>
    </View>
  );
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useThemePreference();
  const buttonColor = useThemeColor({ light: '#111827', dark: '#f8fafc' }, 'text');
  const pillColor = useThemeColor({ light: '#e2e8f0', dark: '#1f2937' }, 'background');

  return (
    <Pressable onPress={() => void toggleTheme()} style={[styles.themeToggle, { backgroundColor: pillColor }]}>
      <Ionicons
        name={theme === 'dark' ? 'sunny' : 'moon'}
        color={buttonColor}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 260,
  },
  businessBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  businessHeaderText: {
    flexShrink: 1,
  },
  businessHeaderName: {
    fontSize: 12,
    fontWeight: '700',
  },
  businessHeaderMeta: {
    fontSize: 10,
    marginTop: 1,
  },
  themeToggle: {
    borderRadius: 999,
    minWidth: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginRight: 8,
  },
  themeToggleText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
