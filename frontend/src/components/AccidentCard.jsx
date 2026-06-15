import { useLang } from "../context/LanguageContext";

// The one moment all of this protection actually matters. Four plain steps,
// no invented form names or hotlines — specifics live behind the PERKESO link.
export default function AccidentCard() {
  const { t } = useLang();

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl p-4">
      <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-3">
        {t.accidentTitle}
      </p>
      <ol className="space-y-3">
        {t.accidentSteps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-[11px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-snug">{step.title}</p>
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{step.sub}</p>
            </div>
          </li>
        ))}
      </ol>
      <a
        href="https://www.perkeso.gov.my"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center min-h-[44px] w-full rounded-xl bg-neutral-900 text-sm font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-accent"
      >
        {t.accidentLink}
      </a>
    </section>
  );
}
