import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import '../global.css';
import { useUserStore } from '../stores/useUserStore';
import { requestAdConsent } from '../services/admobService';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const initProfile = useUserStore((s) => s.initProfile);

  useEffect(() => {
    initProfile();
    // ATT (iOS) + GDPR (EEA) consent — must run before any ad is loaded
    requestAdConsent();
  }, [initProfile]);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="chat/[scenarioId]"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
