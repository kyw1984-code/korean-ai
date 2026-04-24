import { useColorScheme } from 'nativewind';
import { Colors } from '../constants/Colors';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  card: string;
  primaryTint: string;
  feedbackBg: string;
  feedbackText: string;
  warningBg: string;
  lockBg: string;
  lockText: string;
}

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? Colors.dark : Colors.light;
}
