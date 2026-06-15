import { createContext, useContext, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { PLATFORMS } from "../platforms";

const STORAGE_KEY = "pelang-settings";
const LANG_KEY = "pelang-lang"; // kept in sync with LanguageContext
const DEFAULTS = { defaultPlatform: "grab", showZakat: false, weeklyGoal: 0, eveningReminder: false, customPlatforms: [] };

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
  setWeeklyGoal: () => {},
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
  const setWeeklyGoal = (weeklyGoal) =>
    setSettings((s) => ({ ...s, weeklyGoal }));
  const setEveningReminder = (eveningReminder) =>
    setSettings((s) => ({ ...s, eveningReminder }));

  const addCustomPlatform = (label) => {
    // Slug allows only [a-z0-9_] so a custom name can never carry HTML
    // metacharacters into the generated income statement (see RecordsCard).
    const id = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!id) return;
    setSettings((s) => {
      const existing = [...PLATFORMS.map((p) => p.id), ...(s.customPlatforms ?? []).map((p) => p.id)];
      if (existing.includes(id)) return s;
      return { ...s, customPlatforms: [...(s.customPlatforms ?? []), { id, label: label.trim() }] };
    });
  };

  const removeCustomPlatform = (id) =>
    setSettings((s) => ({
      ...s,
      customPlatforms: (s.customPlatforms ?? []).filter((p) => p.id !== id),
      defaultPlatform: s.defaultPlatform === id ? "grab" : s.defaultPlatform,
    }));

  async function clearData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LANG_KEY);
      await signOut(auth); // anonymous auth issues a fresh UID on reload
    } finally {
      window.location.reload();
    }
  }

  return (
    <SettingsContext.Provider
      value={{ ...settings, setDefaultPlatform, setShowZakat, setWeeklyGoal, setEveningReminder, addCustomPlatform, removeCustomPlatform, clearData }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
