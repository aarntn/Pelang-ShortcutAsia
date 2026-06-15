// Presentational iPhone bezel used to frame the app for demos. Children render
// inside the screen; the `transform: translate(0)` on the screen creates a
// containing block so the app's `position: fixed` sheets stay inside the frame.
export default function PhoneFrame({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 px-4"
      style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 30%, #111 0%, #050505 70%)",
      }}
    >
      <div
        className="relative shrink-0"
        style={{
          width: 390,
          height: 844,
          background: "linear-gradient(160deg, #1c1c1e 0%, #0c0c0c 100%)",
          borderRadius: 54,
          boxShadow:
            "0 0 0 1px #2a2a2a, 0 40px 100px rgba(0,0,0,0.85), inset 0 0 0 1px #333",
        }}
      >
        {/* Volume buttons */}
        <div
          className="absolute bg-[#252525] rounded-l-sm"
          style={{ left: -3, top: 120, width: 3, height: 32 }}
        />
        <div
          className="absolute bg-[#252525] rounded-l-sm"
          style={{ left: -3, top: 168, width: 3, height: 56 }}
        />
        <div
          className="absolute bg-[#252525] rounded-l-sm"
          style={{ left: -3, top: 236, width: 3, height: 56 }}
        />
        {/* Power button */}
        <div
          className="absolute bg-[#252525] rounded-r-sm"
          style={{ right: -3, top: 184, width: 3, height: 80 }}
        />

        {/* Screen — transform creates containing block so fixed children stay inside */}
        <div
          className="absolute overflow-hidden flex flex-col"
          style={{ inset: 6, borderRadius: 48, background: "#0a0a0a", transform: "translate(0)" }}
        >
          {/* Screen glare */}
          <div
            className="absolute inset-0 pointer-events-none z-50"
            style={{
              borderRadius: 48,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 45%)",
            }}
          />

          {children}

          {/* Home indicator */}
          <div
            className="shrink-0 flex justify-center pb-2 pt-1"
            style={{ background: "#0a0a0a" }}
          >
            <div className="w-32 h-1 bg-neutral-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
