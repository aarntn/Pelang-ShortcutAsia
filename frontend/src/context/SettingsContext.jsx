import { createContext, useContext, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const STORAGE_KEY = "gigshield-settings";
const DEFAULTS = { defaultPlatform: "grab", showZakat: false };

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

const SettingsContext = createContext({
  ...DEFAULTS,
  setDefaultPlatform: () => {},
  setShowZakat: () => {},
  clearData: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // storage unavailable (private mode) — settings just won't persist
    }
  }, [settings]);

  const setDefaultPlatform = (defaultPlatform) =>
    setSettings((s) => ({ ...s, defaultPlatform }));
  const setShowZakat = (showZakat) =>
    setSettings((s) => ({ ...s, showZakat }));

  async function clearData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("gigshield-lang");
      await signOut(auth); // anonymous auth issues a fresh UID on reload
    } finally {
      window.location.reload();
    }
  }

  return (
    <SettingsContext.Provider
      value={{ ...settings, setDefaultPlatform, setShowZakat, clearData }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
