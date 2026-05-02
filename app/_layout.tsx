import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { PlayerProvider } from '@/context/PlayerContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Use a small timeout to ensure the router is fully mounted and ready for redirection
    const timer = setTimeout(() => {
      try {
        const inAuthGroup = segments[0] === 'login';

        if (!user && !inAuthGroup) {
          router.replace('/login');
        } else if (user && inAuthGroup) {
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.warn('Navigation redirect failed', e);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isLoading, segments]);

  return <>{children}</>;
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Basic initialization without risky native UI calls
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <AuthProvider>
          <PlayerProvider>
            <AuthGate>
              <Stack>
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="player" options={{ 
                  presentation: 'fullScreenModal', 
                  animation: 'slide_from_bottom',
                  contentStyle: { backgroundColor: '#0a0a0a' },
                  headerShown: false 
                }} />
                <Stack.Screen name="profile" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="admin" options={{ presentation: 'modal', headerShown: false }} />
              </Stack>
            </AuthGate>
            <StatusBar style="auto" />
          </PlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

