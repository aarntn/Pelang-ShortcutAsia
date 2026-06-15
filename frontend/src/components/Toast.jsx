import { useLang } from "../context/LanguageContext";
import { platformLabel } from "../platforms";

// Transient status overlay at the top of the screen. Handles four shapes:
// shift confirmation, undo-after-delete, a plain message, and an error.
export default function Toast({ data, onUndo }) {
  const { t } = useLang();

  if (data.type === "undo") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="animate-toast-in absolute top-[60px] left-4 right-4 z-50 bg-card border border-card-edge rounded-2xl px-4 py-3 shadow-2xl flex items-center justify-between gap-3"
      >
        <p className="text-sm font-bold text-white">{t.shiftDeleted}</p>
        <button
          onClick={onUndo}
          className="text-sm font-bold text-accent shrink-0 focus-visible:outline-2 focus-visible:outline-accent rounded"
        >
          {t.undoLabel}
        </button>
      </div>
    );
  }

  if (data.type === "message") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="animate-toast-in absolute top-[60px] left-4 right-4 z-50 bg-card border border-card-edge rounded-2xl px-4 py-3 shadow-2xl"
      >
        <p className="text-sm font-bold text-white">{data.text}</p>
      </div>
    );
  }

  if (data.type === "error") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="animate-toast-in absolute top-[60px] left-4 right-4 z-50 bg-red-950 border border-red-800 rounded-2xl px-4 py-3 shadow-2xl"
      >
        <p className="text-sm text-red-300">{data.message}</p>
      </div>
    );
  }

  // type === "shift" — newly logged shift confirmation
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast-in absolute top-[60px] left-4 right-4 z-50 bg-card border border-card-edge rounded-2xl px-4 py-3 shadow-2xl"
    >
      <p className="text-sm font-bold text-white">
        RM{data.shift.amount.toFixed(2)} — {platformLabel(data.shift.platform)}
      </p>
      <p className="text-xs text-neutral-400 mt-0.5">
        SOCSO: RM{data.shift.socso_deducted.toFixed(2)} · {t.protectedStatus}
      </p>
    </div>
  );
}
