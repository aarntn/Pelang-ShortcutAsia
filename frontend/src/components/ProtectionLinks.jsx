import { useLang } from "../context/LanguageContext";

// Links only — no transcribed hotlines or addresses we can't verify.
const LINKS = [
  { label: "PERKESO", href: "https://www.perkeso.gov.my" },
  { label: "KWSP i-Saraan", href: "https://www.kwsp.gov.my" },
  { label: "KESUMA", href: "https://www.kesuma.gov.my" },
];

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5 text-neutral-600"
      aria-hidden="true"
    >
      <path d="M6 3H3.5A1.5 1.5 0 002 4.5v8A1.5 1.5 0 003.5 14h8a1.5 1.5 0 001.5-1.5V10" />
      <path d="M9 2h5v5M14 2L7 9" />
    </svg>
  );
}

export default function ProtectionLinks() {
  const { t } = useLang();

  return (
    <section className="mx-4">
      {/* EIS exemption — one quiet line, not a status row */}
      <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">{t.eisNote}</p>

      <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-2">
        {t.linksTitle}
      </p>
      <div className="flex gap-2">
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl bg-card border border-card-edge text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            {l.label}
            <ExternalIcon />
          </a>
        ))}
      </div>
    </section>
  );
}
