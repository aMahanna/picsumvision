import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import EN from './locale/en.json';
import FR from './locale/fr.json';
// import AR from './locale/ar.json';
// import ZH from './locale/zh.json';
// import HI from './locale/hi.json';
// import BN from './locale/bn.json';
// import DE from './locale/de.json';
// import ES from './locale/es.json';
// import PL from './locale/pl.json';

/**
 * Languages need to be updated in three places:
 *  1. Import
 *  2. Locales variable
 *  3. Resources object in config
 */

export type LanguageDef = {
  name: string;
  key: string;
};

export const locales = [
  { name: 'English', key: 'en' },
  { name: 'Français', key: 'fr' },
  // { name: '中文', key: 'zh' },
  // { name: 'Español', key: 'es' },
  // { name: 'Deutsch', key: 'de' },
  // { name: 'Język polski', key: 'pl' },
  // { name: 'العربية', key: 'ar' },
  // { name: 'বাংলা', key: 'bn' },
  // { name: 'हिन्दी', key: 'hi' },
];
// Returns true in development.
const dev: boolean =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: EN,
      fr: FR,
      // zh: ZH,
      // ar: AR,
      // hi: HI,
      // bn: BN,
      // de: DE,
      // es: ES,
      // pl: PL,
    },
    /*default language*/
    /*fallback language*/
    fallbackLng: 'en',
    debug: dev,
    ns: ['translations'],
    defaultNS: 'translation',
    keySeparator: '.',
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
    },
    react: {
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      nsMode: 'default',
    },
    detection: {
      // order and from where user language should be detected
      order: ['querystring', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      // keys or params to lookup language from
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,

      // cache user language on
      caches: ['localStorage', 'sessionStorage'],
      excludeCacheFor: ['cimode'], // languages to not persist (cookie, localStorage)

      // optional expire and domain for set cookie
      cookieMinutes: 10,

      // optional htmlTag with lang attribute, the default is:
      htmlTag: document.documentElement,

      // optional set cookie options, reference:[MDN Set-Cookie docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
      cookieOptions: { path: '/', sameSite: 'strict' },
    },
  });

export default i18n;

/**
 * Fixed language detection with tips from:
 * https://stackoverflow.com/questions/54514834/i18next-browser-languagedetector-path-not-working
 */
