import { ScrollReveal } from "./AnimatedText";
import { useT } from "@/i18n/LocaleContext";
import RichText from "@/i18n/RichText";

const MemorySection = () => {
  const t = useT();
  const titleLines = t("memory.title").split("\n");
  const subtitle = t.raw("memory.subtitle");

  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        <h2 className="m-0 text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
          {titleLines.map((line, i) => (
            <ScrollReveal as="span" key={i} className="block">
              <RichText text={line} />
            </ScrollReveal>
          ))}
        </h2>

        <div className="mt-12 flex max-w-[860px] flex-col gap-6">
          {subtitle.map((line, i) => (
            <ScrollReveal
              as="p"
              key={i}
              className="text-base leading-[1.75] text-muted md:text-[1.0625rem]"
            >
              {line}
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MemorySection;
