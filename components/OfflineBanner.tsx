import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
  const isConnected = useNetworkStatus();
  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚠️ No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 8,
    alignItems: 'center',
  },
  text: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '600',
  },
});
