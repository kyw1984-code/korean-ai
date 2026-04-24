import { useColorScheme } from 'nativewind';
import { Colors } from '../constants/Colors';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderStrong: string;
  card: string;
  primaryTint: string;
  feedbackBg: string;
  feedbackText: string;
  warningBg: string;
  lockBg: string;
  lockText: string;
  overlay: string;
  shimmer: string;
  isDark: boolean;
}

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return { ...(isDark ? Colors.dark : Colors.light), isDark };
}
