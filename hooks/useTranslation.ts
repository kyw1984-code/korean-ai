import { getLocales } from 'expo-localization';
import { en, de, fr, es, it } from '../constants/i18n';
import type { Translations } from '../constants/i18n';

const translations: Record<string, Translations> = { en, de, fr, es, it };

export function useTranslation(): Translations {
  const locale = getLocales()[0]?.languageCode ?? 'en';
  return translations[locale] ?? en;
}
