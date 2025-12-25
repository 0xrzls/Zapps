import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import id from './locales/id.json';
import cn from './locales/cn.json';
import fr from './locales/fr.json';

const resources = {
  en: {
    translation: en
  },
  id: {
    translation: id
  },
  cn: {
    translation: cn
  },
  fr: {
    translation: fr
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: localStorage.getItem('language') || 'en',
    
    interpolation: {
      escapeValue: false
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
