import { useCallback, useSyncExternalStore } from "react";
import { getPrefStore } from "@lib/prefStore";

export const LANGUAGES = [
  "English EU", "English US", "Deutsch", "Français", "Español", "Italiano",
  "Polski", "Português", "Nederlands", "Türkçe", "Русский", "日本語", "中文",
  "한국어", "العربية",
];

export const DEFAULT_LANGUAGE = "English EU";

const STORAGE_KEY = "dgmarq_language";
const store = getPrefStore(STORAGE_KEY);

const readValid = () => {
  const v = store.get();
  return v && LANGUAGES.includes(v) ? v : null;
};

export const useLanguage = () => {
  const stored = useSyncExternalStore(store.subscribe, readValid);

  const setLanguage = useCallback((lang) => {
    if (LANGUAGES.includes(lang)) store.set(lang);
  }, []);

  return {
    language: stored || DEFAULT_LANGUAGE,
    isExplicit: Boolean(stored),
    setLanguage,
  };
};

export default useLanguage;
