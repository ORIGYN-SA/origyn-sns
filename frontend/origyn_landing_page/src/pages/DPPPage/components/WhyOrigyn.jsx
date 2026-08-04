import { useT } from "@/i18n/LocaleContext";
import { CheckMark, GradientRule, Section, SectionHeader } from "./primitives";

const WhyOrigyn = () => {
  const t = useT();
  const benefits = t.raw("dpp.why.benefits") ?? [];

  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <SectionHeader title={t("dpp.why.title")} />

        <ul className="border-t border-hairline">
          {benefits.map((b) => (
            <li
              key={b.title}
              className="flex gap-4 border-b border-hairline py-6"
            >
              <CheckMark size="md" className="mt-0.5" />
              <div>
                <h3 className="text-[1.0625rem] font-medium tracking-tight text-ink">
                  {b.title}
                </h3>
                <p className="mt-1 text-[0.9375rem] leading-[1.6] text-ink/70">
                  {b.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <GradientRule className="mt-16 md:mt-24" />
    </Section>
  );
};

export default WhyOrigyn;
