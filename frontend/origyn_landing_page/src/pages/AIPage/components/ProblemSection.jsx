import Eyebrow from "./Eyebrow";
import { ScrollReveal } from "./AnimatedText";
import { useT } from "@/i18n/LocaleContext";
import RichText from "@/i18n/RichText";

const ProblemSection = () => {
  const t = useT();
  const titleLines = t("problem.title").split("\n");
  const steps = t.raw("problem.steps");

  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        <Eyebrow>{t("problem.eyebrow")}</Eyebrow>

        <h2 className="mt-8 m-0 text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
          {titleLines.map((line, i) => (
            <ScrollReveal as="span" key={i} className="block">
              <RichText text={line} />
            </ScrollReveal>
          ))}
        </h2>

        <ScrollReveal
          as="p"
          className="mt-12 max-w-[860px] text-base leading-[1.75] text-muted md:text-[1.0625rem]"
        >
          <RichText text={t("problem.lead")} />
        </ScrollReveal>

        <ScrollReveal
          as="p"
          className="mt-10 max-w-[860px] text-base leading-[1.75] text-ink md:text-[1.0625rem]"
        >
          {t("problem.leadStrong")}
        </ScrollReveal>

        <div className="mt-12 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step, i) => {
            const padded = String(i + 1).padStart(2, "0");
            return (
              <ScrollReveal
                as="article"
                key={step.title}
                className="flex flex-col rounded-3xl border border-[#ececec] bg-surface px-10 py-10 text-left"
              >
                <div className="text-[clamp(2rem,4vw,2.5rem)] font-light leading-none tracking-[-0.04em]">
                  <span className="text-gradient">{padded}</span>
                </div>
                <h3 className="mt-6 text-xl font-medium tracking-tight text-ink md:text-[1.375rem]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-[1.6] text-muted">
                  {step.body}
                </p>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal
          as="p"
          className="mt-12 max-w-[860px] text-base leading-[1.75] text-muted md:text-[1.0625rem]"
        >
          <RichText text={t("problem.closing")} />
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ProblemSection;
