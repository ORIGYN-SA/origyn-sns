import Eyebrow from "./Eyebrow";
import Card from "./Card";
import Hyperspeed from "./Hyperspeed";
import { ScrollReveal } from "./AnimatedText";
import { useT } from "@/i18n/LocaleContext";
import RichText from "@/i18n/RichText";

const HYPERSPEED_OPTIONS = {
  colors: {
    background: 0xffffff,
    roadColor: 0xf5f4f4,
    islandColor: 0xe8e8e8,
    shoulderLines: 0x222526,
    brokenLines: 0xc4c8cc,
    leftCars: [0x1f9cd4, 0x1470b1, 0x1a5ea2],
    rightCars: [0x254088, 0x263c85, 0x1e2448],
    sticks: 0x061937,
  },
};

const ResultsSection = () => {
  const t = useT();
  const titleLines = t("results.title").split("\n");
  const body2 = t.raw("results.body2");
  const headers = t.raw("results.table.headers");
  const rows = t.raw("results.table.rows");
  const cards = t.raw("results.cards");

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6">
        <Eyebrow>{t("results.eyebrow")}</Eyebrow>

        <h2 className="mt-8 m-0 text-center text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
          {titleLines.map((line, i) => (
            <ScrollReveal as="span" key={i} className="block">
              <RichText text={line} />
            </ScrollReveal>
          ))}
        </h2>

        <ScrollReveal
          as="p"
          className="mt-10 max-w-[860px] text-center text-base leading-[1.75] text-muted md:text-[1.0625rem]"
        >
          {t("results.lead")}
        </ScrollReveal>
      </div>

      <div className="relative mt-12 h-[clamp(420px,60vh,640px)] w-full overflow-hidden select-none [-webkit-touch-callout:none] [-webkit-user-select:none]">
        <Hyperspeed effectOptions={HYPERSPEED_OPTIONS} />
        <div className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_90%_65%_at_center,rgba(245,244,244,0.92),rgba(245,244,244,0)_70%)] md:bg-[radial-gradient(ellipse_55%_40%_at_center,rgba(245,244,244,0.95),rgba(245,244,244,0)_75%)]" />
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-6 text-center md:gap-8">
          <Eyebrow>{t("results.overlay.eyebrow")}</Eyebrow>
          {/* before → after benchmark. In RTL the row mirrors (the "before"
              value leads on the right) and the arrow flips to point left, so it
              still reads "before improves to after". Each value stays LTR via
              bidi (numbers + Latin unit), so "10 tok/call" never reverses. */}
          <div className="flex flex-col items-center gap-3 text-[clamp(2rem,5.5vw,4rem)] font-extralight leading-none tracking-tight md:flex-row md:gap-8">
            <span className="text-muted">{t("results.overlay.before")}</span>
            <span className="inline-block rotate-90 font-normal italic text-ink rtl:-scale-x-100 md:rotate-0">→</span>
            <span className="text-ink">{t("results.overlay.after")}</span>
          </div>
          <p className="max-w-[640px] text-[0.9375rem] font-extralight italic leading-[1.5] text-ink md:text-[1.0625rem]">
            {t("results.overlay.caption")}
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6">
        <ScrollReveal
          as="p"
          className="mt-12 max-w-[860px] text-center text-base leading-[1.75] text-muted md:text-[1.0625rem]"
        >
          {t("results.body1")}
        </ScrollReveal>

        <ScrollReveal
          as="p"
          className="mt-10 max-w-[860px] text-center text-base leading-[1.75] text-muted md:text-[1.0625rem]"
        >
          {body2.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </ScrollReveal>

        <ScrollReveal
          as="table"
          className="mt-12 w-full max-w-[1080px] border-collapse text-base"
        >
          <thead>
            <tr className="border-b border-[#ececec]">
              <th className="py-4 text-start text-[0.8125rem] font-normal uppercase tracking-[0.14em]">
                <span className="text-gradient">{headers.model}</span>
              </th>
              <th className="py-4 text-start text-[0.8125rem] font-normal uppercase tracking-[0.14em]">
                <span className="text-gradient">{headers.existing}</span>
              </th>
              <th className="py-4 text-start text-[0.8125rem] font-normal uppercase tracking-[0.14em]">
                <span className="text-gradient">{headers.origyn}</span>
              </th>
              <th className="py-4 text-end text-[0.8125rem] font-normal uppercase tracking-[0.14em]">
                <span className="text-gradient">{headers.gain}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.model} className="border-b border-[#ececec]">
                <td className="py-6 text-ink">{row.model}</td>
                <td className="py-6 text-muted">{row.existing}</td>
                <td className="py-6 text-ink">{row.origyn}</td>
                <td className="py-6 text-end font-medium text-ink">
                  {row.gain}
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollReveal>

        <div className="mt-12 grid w-full max-w-[1080px] grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <ScrollReveal key={card.title}>
              <Card align="left" title={card.title}>
                {card.body}
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
