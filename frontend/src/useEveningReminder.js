import { useEffect } from "react";

const REMINDER_HOUR = 19; // 7pm local — after the dinner-delivery peak starts winding down
const LAST_KEY = "pelang-reminder-last";

// Opt-in evening check-in: if it's past 7pm, nothing was logged today, and we
// haven't reminded today, fire one local notification. This runs only while
// the app is open (no push backend) — the PWA-installed case is the target,
// where the app commonly stays alive in the background on Android.
export function useEveningReminder({ enabled, shifts, title, body }) {
  useEffect(() => {
    if (!enabled || typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    function check() {
      const now = new Date();
      if (now.getHours() < REMINDER_HOUR) return;

      const today = now.toDateString();
      if (localStorage.getItem(LAST_KEY) === today) return;

      const loggedToday = (shifts ?? []).some(
        (s) => new Date(s.logged_at).toDateString() === today
      );
      if (loggedToday) return;

      localStorage.setItem(LAST_KEY, today);
      // Prefer the service worker so the notification survives tab close on Android
      if (navigator.serviceWorker?.ready) {
        navigator.serviceWorker.ready
          .then((reg) => reg.showNotification(title, { body, icon: "/icon-192.svg" }))
          .catch(() => new Notification(title, { body }));
      } else {
        new Notification(title, { body });
      }
    }

    check();
    const id = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, shifts, title, body]);
}
