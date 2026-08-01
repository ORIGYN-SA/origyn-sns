import { useT } from "@/i18n/LocaleContext";
import { Section, SectionHeader } from "./primitives";

const Regulation = () => {
  const t = useT();
  const milestones = t.raw("dpp.regulation.milestones") ?? [];

  return (
    <Section>
      <SectionHeader
        title={t("dpp.regulation.title")}
      />
      <p className="mt-5 max-w-[620px] text-base font-medium leading-[1.7] text-ink md:text-[1.0625rem]">
        {t("dpp.regulation.lead")}
      </p>

      <ol className="mt-12 border-t border-hairline md:mt-14">
        {milestones.map((m) => {
          // Years are locale-independent, so this comparison is catalog-safe.
          const isDeadline = m.year === "2027";
          return (
            <li
              key={m.year}
              className={`relative grid gap-x-10 gap-y-2 border-b border-hairline py-6 md:grid-cols-[9rem_14rem_1fr] md:items-baseline md:py-8 ${
                isDeadline ? "ps-5" : ""
              }`}
            >
              {isDeadline && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 start-0 w-[3px] bg-[linear-gradient(180deg,#1F9CD4,#1E2345)]"
                />
              )}
              <p className="text-[1.75rem] font-light leading-none tracking-tight md:text-[2.25rem]">
                {isDeadline ? (
                  <span className="text-gradient">{m.year}</span>
                ) : (
                  m.year
                )}
              </p>
              <h3 className="text-[1.0625rem] font-medium tracking-tight text-ink">
                {m.title}
              </h3>
              <p className="max-w-[560px] text-[0.9375rem] leading-[1.65] text-ink/70">
                {m.body}
              </p>
            </li>
          );
        })}
      </ol>
    </Section>
  );
};

export default Regulation;
