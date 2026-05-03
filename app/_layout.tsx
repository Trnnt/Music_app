import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { PlayerProvider } from '@/context/PlayerContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Small delay to ensure router is ready
    const timer = setTimeout(() => {
      try {
        if (!user) {
          router.replace('/login');
        } else {
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.warn('Navigation redirect failed', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user, isLoading]);

  if (isLoading) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <AuthProvider>
          <PlayerProvider>
            <AuthGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="player" options={{ presentation: 'modal' }} />
              </Stack>
            </AuthGate>
            <StatusBar style="light" />
          </PlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

