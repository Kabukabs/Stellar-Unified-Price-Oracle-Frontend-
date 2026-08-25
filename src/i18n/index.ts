/**
 * i18n configuration for the Stellar Unified Price Oracle Frontend.
 *
 * - Uses i18next + react-i18next for React integration
 * - Uses i18next-browser-languagedetector for auto-detection via:
 *     1. ?lang= URL query param
 *     2. localStorage key 'i18nextLng'
 *     3. navigator.language (browser preference)
 * - Locale files are imported directly (tree-shaken by Vite per chunk)
 * - Unsupported languages fall back to English
 * - RTL support: the `applyRtl` helper sets `dir` on <html> and syncs the
 *   `rtlEnabled` preference so components can react via CSS / preference hooks.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en'
import es from './locales/es'
import fr from './locales/fr'
import ja from './locales/ja'
import ar from './locales/ar'
import he from './locales/he'

// Import type augmentation (no runtime effect, just types)
import './types'

/** Supported language codes */
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'ja', 'ar', 'he'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/** Human-readable label for each language */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ja: '日本語',
  ar: 'العربية',
  he: 'עברית',
}

/** RTL language codes */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur'])

/**
 * Applies `dir="rtl"` or `dir="ltr"` to the `<html>` element based on the
 * active language code, and optionally a forced `override` value from the
 * `rtlEnabled` preference (used for testing RTL layout without changing
 * the UI language).
 *
 * Call this:
 *  - on initial load (done below by the i18n `then` callback), and
 *  - whenever the language or `rtlEnabled` preference changes.
 *
 * @param lang     BCP-47 language code, e.g. "ar", "he", "en-US".
 * @param override When `true` forces RTL; `false` forces LTR; `undefined`
 *                 lets the language code decide (default behaviour).
 */
export function applyRtl(lang: string, override?: boolean): void {
  const code = lang.split('-')[0]
  const isRtl = override !== undefined ? override : RTL_LANGUAGES.has(code)
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      ja: { translation: ja },
      ar: { translation: ar },
      he: { translation: he },
    },
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: 'translation',

    // Detection order: URL query param → localStorage → browser language
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      // React already escapes values — no need for i18next to do so
      escapeValue: false,
    },
  })
  .then(() => {
    // Apply RTL direction on initial load
    applyRtl(i18n.language)
  })

// Keep direction in sync on every language change
i18n.on('languageChanged', (lang) => {
  applyRtl(lang)
})

export default i18n
