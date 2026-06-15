import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext({ userId: null, authError: null });

// Demo mode: visiting with ?demo loads a fixed UID pre-seeded with sample data,
// so the app can be shown off on any device without logging shifts first.
const DEMO_UID = "demo-pelang-2026";
const demoMode =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("demo");

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(demoMode ? DEMO_UID : null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (demoMode) return; // skip anonymous sign-in; use the shared demo UID
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        // Dev helper: UID visible in console and copyable via window.__uid
        if (import.meta.env.DEV) {
          window.__uid = user.uid;
          console.info(`[Pelang] UID: ${user.uid}  (window.__uid to copy)`);
        }
      } else {
        signInAnonymously(auth).catch((err) => {
          console.error("Anonymous sign-in failed:", err);
          setAuthError(err.message);
        });
      }
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ userId, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
