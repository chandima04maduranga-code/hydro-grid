import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import si from "./locales/si.json";

export const SUPPORTED_LANGUAGES = ["en", "si"];
const STORAGE_KEY = "hg_language";

const readSavedLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : "en";
  } catch {
    return "en";
  }
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    si: { translation: si }
  },
  lng: readSavedLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

// Keep <html lang> and the saved preference in sync with the active language
const applyLanguage = (language) => {
  document.documentElement.lang = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit only
  }
};

applyLanguage(i18n.language);
i18n.on("languageChanged", applyLanguage);

export default i18n;
