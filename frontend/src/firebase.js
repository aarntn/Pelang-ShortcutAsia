// Firebase web SDK config. Real values come from .env (see .env.example).
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "placeholder-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "placeholder.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "placeholder-project",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "placeholder-app-id",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
