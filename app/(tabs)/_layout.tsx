import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.light.border,
          paddingBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Practice', tabBarIcon: ({ color }) => <TabIcon emoji="💬" color={color} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === Colors.primary ? 1 : 0.5 }}>{emoji}</Text>;
}
