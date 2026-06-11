import { useState } from "react";
import { PLATFORMS } from "../platforms";
import { updateShift } from "../api";
import { useLang } from "../context/LanguageContext";
import Sheet from "./Sheet";

const SHORT_LABELS = {
  grab: "Grab",
  foodpanda: "Panda",
  lalamove: "Lala",
  shopeefood: "Shopee",
  maxim: "Maxim",
  indrive: "inDrive",
  other: "Other",
};

export default function EditShiftSheet({ shift, userId, onClose, onSaved, onDelete }) {
  const { t } = useLang();
  const [platform, setPlatform] = useState(shift.platform);
  const [amount, setAmount] = useState(String(shift.amount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const parsed = parseFloat(amount);
  const valid = !isNaN(parsed) && parsed > 0 && parsed <= 10000;
  const unchanged = platform === shift.platform && parsed === shift.amount;

  async function handleSave() {
    if (!valid || unchanged) return;
    setSaving(true);
    setError(null);
    try {
      await updateShift({
        shiftId: shift.id,
        userId,
        platform: platform !== shift.platform ? platform : undefined,
        amount: parsed !== shift.amount ? parsed : undefined,
      });
      onSaved();
      onClose();
    } catch {
      setError(t.networkError);
      setSaving(false);
    }
  }

  return (
    <Sheet onClose={onClose} label="Edit shift">
      {/* Platform selector */}
      <div className="grid grid-cols-4 gap-1.5 mb-4" role="radiogroup" aria-label="Platform">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={platform === p.id}
            onClick={() => setPlatform(p.id)}
            className={`py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-accent ${
              platform === p.id
                ? "bg-accent text-neutral-950"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            {SHORT_LABELS[p.id]}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="flex items-baseline gap-2 bg-neutral-900 rounded-2xl px-4 py-3 mb-4 border border-neutral-800">
        <span className="text-lg font-bold text-neutral-500 shrink-0">RM</span>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          aria-label="Amount in ringgit"
          className="flex-1 bg-transparent text-3xl font-extrabold text-white focus:outline-none"
          style={{ fontVariantNumeric: "tabular-nums" }}
          autoFocus
        />
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <button
        onClick={handleSave}
        disabled={!valid || saving || unchanged}
        className="w-full bg-accent text-neutral-950 font-bold rounded-2xl py-3.5 mb-2 min-h-[44px] disabled:opacity-40 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {saving ? t.saving : t.saveChanges}
      </button>
      <button
        onClick={() => { onDelete(shift); onClose(); }}
        className="w-full text-center text-sm text-red-400 py-2 min-h-[44px] hover:text-red-300 focus-visible:outline-2 focus-visible:outline-accent rounded-xl"
      >
        {t.deleteShift}
      </button>
    </Sheet>
  );
}
