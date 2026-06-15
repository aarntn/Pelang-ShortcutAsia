import { useEffect, useRef, useState } from "react";

export default function Sheet({ onClose, label, children }) {
  const panelRef = useRef(null);
  const [exiting, setExiting] = useState(false);

  function handleClose() {
    setExiting(true);
  }

  function handleAnimationEnd() {
    if (exiting) onClose();
  }

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    panelRef.current?.focus();
    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/60 ${
        exiting ? "animate-backdrop-out" : "animate-backdrop-in"
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`w-full max-w-[420px] bg-card border-t border-card-edge rounded-t-2xl p-6 pb-8 outline-none max-h-[82%] overflow-y-auto overscroll-contain ${
          exiting ? "animate-sheet-out" : "animate-sheet-in"
        }`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-5" />
        {children}
      </div>
    </div>
  );
}
