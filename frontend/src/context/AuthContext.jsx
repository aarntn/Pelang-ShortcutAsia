import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext({ userId: null, authError: null });

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        // Dev helper: UID visible in console and copyable via window.__uid
        if (import.meta.env.DEV) {
          window.__uid = user.uid;
          console.info(`[GigShield] UID: ${user.uid}  (window.__uid to copy)`);
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
