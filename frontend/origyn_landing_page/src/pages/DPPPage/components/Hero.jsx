import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import { useT } from "@/i18n/LocaleContext";
import RichText from "@/i18n/RichText";
import { BOOK_A_CALL_URL, DPP_TEXT_LINKS } from "../links";
import { CheckMark, CtaButton } from "./primitives";

const Hero = () => {
  const t = useT();
  // Do not use the shared Stats component here. StatsItem runs parseNumeric()
  // and a count-up, so these non-numeric chip values would render as NaN.
  const chips = t.raw("dpp.hero.chips") ?? [];
  const titleLines = String(t("dpp.hero.title") ?? "").split("\n");

  return (
    <section className="relative overflow-hidden bg-navy px-6 pb-20 pt-32 md:px-10 md:pb-24 md:pt-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-40 -top-40 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(31,156,212,0.22),transparent_65%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 start-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(46,123,196,0.16),transparent_70%)] blur-2xl"
      />

      <div className="relative mx-auto grid w-full max-w-[1120px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:gap-16">
        <div>
          <ScrollReveal>
            {/* Sizes are capped per breakpoint so the longest catalog line
                still fits the copy column; a wider scale orphans its last
                word. */}
            <h1 className="text-[2.25rem] font-light leading-[1.1] tracking-tight text-white sm:text-[2.5rem] lg:text-[2.25rem] xl:text-[2.75rem]">
              {titleLines.map((line, i) => (
                <span
                  key={i}
                  className={`block ${
                    i === titleLines.length - 1
                      ? "bg-brand-gradient-bright bg-clip-text pb-1 text-transparent"
                      : ""
                  }`}
                >
                  <RichText text={line} />
                </span>
              ))}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <p className="mt-6 max-w-[540px] text-[0.9375rem] leading-[1.7] text-white/70 md:text-base">
              {t("dpp.hero.lead")}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <ul className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="flex items-center gap-2.5 text-[0.875rem] font-medium tracking-tight text-white"
                >
                  <CheckMark
                    size="sm"
                    ring="bg-brand-gradient-bright"
                    innerClassName="bg-navy"
                    iconClassName="text-[#6FD6F5]"
                  />
                  {chip}
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={0.35}>
            <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7">
              <CtaButton
                href={BOOK_A_CALL_URL}
                variant="white"
                outlineClassName="focus-visible:outline-white"
              >
                {t("dpp.hero.cta")}
              </CtaButton>
              <p className="flex items-center gap-2.5 text-[0.8125rem] leading-[1.5] text-white/60">
                <CheckMark
                  size="md"
                  ring="bg-brand-gradient-bright"
                  innerClassName="bg-navy"
                  iconClassName="text-[#6FD6F5]"
                />
                {/* One span so the inline link does not become its own flex
                    item and inherit the row gap as word spacing. */}
                <span>
                  <RichText text={t("dpp.hero.badge")} links={DPP_TEXT_LINKS} />
                </span>
              </p>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.45}>
          {/* Own the positioning context here rather than on ScrollReveal:
              its mobile/loading branch renders a bare <div> and drops
              className, which would leave the halo anchored to the section. */}
          <div className="relative lg:-me-4 xl:-me-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(31,156,212,0.20),transparent_65%)] blur-2xl"
            />
            <img
              src="/dpp-passport-devices.webp"
              alt={t("dpp.hero.imageAlt")}
              width={1045}
              height={926}
              fetchPriority="high"
              decoding="async"
              className="relative mx-auto w-full max-w-[28rem] lg:max-w-none"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Hero;
