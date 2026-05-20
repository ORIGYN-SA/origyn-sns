import { motion as Motion } from "motion/react";
import { useT } from "@/i18n/LocaleContext";
import RichText from "@/i18n/RichText";

const EASE = [0.22, 1, 0.36, 1];

const titleContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } },
};

const lineVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

const subtitleVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE, delay: 0.45 },
  },
};

const Hero = () => {
  const t = useT();
  const titleLines = t("hero.title").split("\n");
  const subtitleLines = t.raw("hero.subtitle");

  return (
    <>
      <Motion.h1
        className="m-0 text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink"
        initial="hidden"
        animate="visible"
        variants={titleContainer}
      >
        {titleLines.map((line, i) => (
          <Motion.span key={i} variants={lineVariants} className="block">
            <RichText text={line} />
          </Motion.span>
        ))}
      </Motion.h1>

      <Motion.p
        className="mt-12 text-[0.75rem] uppercase tracking-[0.14em] leading-[1.7] text-muted md:text-[0.8125rem]"
        initial="hidden"
        animate="visible"
        variants={subtitleVariants}
      >
        {subtitleLines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </Motion.p>
    </>
  );
};

export default Hero;
