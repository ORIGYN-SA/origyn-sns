import { useT } from "@/i18n/LocaleContext";
import { BOOK_A_CALL_URL } from "../links";
import {
  CheckMark,
  CtaButton,
  RingNumber,
  Section,
  SectionHeader,
} from "./primitives";

const PartnerModel = () => {
  const t = useT();
  const steps = t.raw("dpp.partner.steps") ?? [];
  const perks = t.raw("dpp.partner.get") ?? [];

  return (
    <Section>
      <SectionHeader title={t("dpp.partner.title")} />

      <div className="mt-16 grid items-center gap-12 md:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] xl:gap-14">
        <div>
          <ol className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <li key={s.step} className="relative pt-16">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-[1.375rem] h-px bg-brand-gradient [mask-image:linear-gradient(to_right,transparent,#000_25%,#000_65%,transparent)]"
                />
                <RingNumber className="absolute start-0 top-0">
                  {s.step}
                </RingNumber>
                <h3 className="text-[1.125rem] font-medium tracking-tight text-ink">
                  {s.title}
                </h3>
                <ul className="mt-3 space-y-2 text-[0.875rem] leading-[1.65] text-ink/70">
                  {(s.bullets ?? []).map((bullet) => (
                    <li key={bullet} className="flex gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-[0.5625rem] h-1 w-1 shrink-0 rounded-full bg-ink/40"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <div className="mt-14 border-t border-hairline pt-8">
            <h3 className="flex items-center gap-3 text-[0.9375rem] italic leading-none text-ink/70">
              <span
                aria-hidden="true"
                className="h-px w-8 shrink-0 bg-brand-gradient"
              />
              {t("dpp.partner.getTitle")}
            </h3>
            <ul className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
              {perks.map((perk) => (
                <li
                  key={perk}
                  className="flex items-center gap-2.5 text-[0.9375rem] font-medium tracking-tight text-ink"
                >
                  <CheckMark size="sm" />
                  {perk}
                </li>
              ))}
            </ul>

            <CtaButton href={BOOK_A_CALL_URL} variant="navy" className="mt-8">
              {t("dpp.partner.cta")}
            </CtaButton>
          </div>
        </div>

        <img
          src="/dpp-passport-phone.webp"
          alt={t("dpp.partner.imageAlt")}
          width={1081}
          height={1200}
          loading="lazy"
          decoding="async"
          className="mx-auto w-full max-w-[17rem] lg:max-w-none"
        />
      </div>
    </Section>
  );
};

export default PartnerModel;
