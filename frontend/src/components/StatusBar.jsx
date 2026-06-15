// iOS-style status bar (clock + signal/wifi/battery) for the phone-frame demo.
function SignalIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="0.5" opacity="0.3" />
      <rect x="4.7" y="5.5" width="3" height="6.5" rx="0.5" opacity="0.3" />
      <rect x="9.3" y="3" width="3" height="9" rx="0.5" opacity="0.3" />
      <rect x="14" y="0" width="3" height="12" rx="0.5" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
      <circle cx="8" cy="10.5" r="1.5" />
      <path
        d="M4.4 7.2A5.2 5.2 0 0111.6 7.2"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M1.4 4.3A9.2 9.2 0 0114.6 4.3"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
      <rect
        x="0.75"
        y="0.75"
        width="20.5"
        height="10.5"
        rx="3.25"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill="currentColor" />
      <path
        d="M22.5 4.5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

export default function StatusBar() {
  return (
    <div className="shrink-0 relative text-white" style={{ height: 52 }}>
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[10px] z-10 bg-black"
        style={{ width: 126, height: 34, borderRadius: 17 }}
      />
      <div
        className="flex items-end justify-between pb-1.5"
        style={{ height: "100%", padding: "0 28px" }}
      >
        <span className="text-[13px] font-semibold tracking-tight">9:41</span>
        <div className="flex items-center gap-1.5">
          <SignalIcon />
          <WifiIcon />
          <BatteryIcon />
        </div>
      </div>
    </div>
  );
}
