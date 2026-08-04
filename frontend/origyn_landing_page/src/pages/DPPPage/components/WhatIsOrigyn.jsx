import { useT } from "@/i18n/LocaleContext";
import RichText from "@/i18n/RichText";
import { DPP_TEXT_LINKS } from "../links";
import { CheckMark, GradientRule, Section, SectionHeader } from "./primitives";

const ICONS = [
  <svg
    key="qr"
    viewBox="0 0 24 24"
    className="h-5 w-5 text-ink"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5" />
    <path d="M14 14h.01M17.5 14h.01M21 14h.01M14 17.5h.01M17.5 17.5h.01M21 17.5h.01M14 21h.01M17.5 21h.01M21 21h.01" />
  </svg>,
  <svg
    key="globe"
    viewBox="0 0 24 24"
    className="h-5 w-5 text-ink"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5s1.2-6.2 3.6-8.5Z" />
  </svg>,
  <svg
    key="scale"
    viewBox="0 0 24 24"
    className="h-5 w-5 text-ink"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2.75 20.5 7 12 11.25 3.5 7 12 2.75Z" />
    <path d="M3.5 12 12 16.25 20.5 12" />
    <path d="M3.5 17 12 21.25 20.5 17" />
  </svg>,
];

// Logical borders instead of divide-x, which lands on the wrong edge in RTL.
const columnClasses = (i, count) => {
  if (i === 0) return "lg:pe-10";
  const padding = i === count - 1 ? "lg:ps-10" : "lg:px-10";
  return `${padding} lg:border-s lg:border-hairline`;
};

const WhatIsOrigyn = () => {
  const t = useT();
  const cards = t.raw("dpp.what.cards") ?? [];

  return (
    <Section>
      <SectionHeader title={t("dpp.what.title")} lead={t("dpp.what.lead")} />

      <div className="mt-14 grid gap-12 md:mt-16 lg:grid-cols-3 lg:gap-0">
        {cards.map((card, i) => (
          <article
            key={card.title}
            className={`flex flex-col ${columnClasses(i, cards.length)}`}
          >
            <span className="inline-flex h-12 w-12 shrink-0 rounded-full bg-brand-gradient p-px">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-white">
                {ICONS[i % ICONS.length]}
              </span>
            </span>
            <h3 className="mt-6 text-[1.375rem] font-medium tracking-tight text-ink">
              {card.title}
            </h3>
            <p className="mt-3 flex-1 text-[0.9375rem] leading-[1.7] text-ink/70">
              {card.body}
            </p>
            <p className="mt-8 flex items-center gap-3 self-start rounded-xl border border-hairline px-4 py-3 text-[0.8125rem] leading-[1.5] text-ink/80">
              <CheckMark size="md" />
              {/* One span, or the inline link picks up the row gap. */}
              <span>
                <RichText text={card.proof} links={DPP_TEXT_LINKS} />
              </span>
            </p>
          </article>
        ))}
      </div>

      <GradientRule className="mt-16 md:mt-24" />
    </Section>
  );
};

export default WhatIsOrigyn;
