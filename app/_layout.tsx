import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import '../global.css';
import { useUserStore } from '../stores/useUserStore';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const initProfile = useUserStore((s) => s.initProfile);

  useEffect(() => {
    initProfile();
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
      </Stack>
    </>
  );
}
