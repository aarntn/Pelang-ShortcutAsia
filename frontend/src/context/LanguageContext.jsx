import { createContext, useContext, useState } from "react";
import { translations } from "../i18n";

const LanguageContext = createContext({
  t: translations.en,
  lang: "en",
  toggleLang: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  function toggleLang() {
    setLang((l) => (l === "en" ? "bm" : "en"));
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
