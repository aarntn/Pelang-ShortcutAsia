import { createContext, useContext, useState } from "react";
import { translations } from "../i18n";

const LanguageContext = createContext({
  t: translations.en,
  lang: "en",
  toggleLang: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("gigshield-lang");
      return saved === "bm" || saved === "en" ? saved : "en";
    } catch {
      return "en";
    }
  });

  function toggleLang() {
    const next = lang === "en" ? "bm" : "en";
    try {
      localStorage.setItem("gigshield-lang", next);
    } catch {
      // storage unavailable — language just won't persist
    }
    setLang(next);
  }

  return (
    <LanguageContext.Provider value={{ t: translations[lang], lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
