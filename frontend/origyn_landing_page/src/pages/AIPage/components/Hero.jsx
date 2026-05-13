import { motion as Motion } from "motion/react";

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

const Hero = () => (
  <>
    <Motion.h1
      className="m-0 text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink"
      initial="hidden"
      animate="visible"
      variants={titleContainer}
    >
      <Motion.span variants={lineVariants} className="block">
        Advancing
      </Motion.span>
      <Motion.span variants={lineVariants} className="block">
        on-chain <span className="font-normal italic">AI</span> inference.
      </Motion.span>
    </Motion.h1>

    <Motion.p
      className="mt-12 text-[0.75rem] uppercase tracking-[0.14em] leading-[1.7] text-muted md:text-[0.8125rem]"
      initial="hidden"
      animate="visible"
      variants={subtitleVariants}
    >
      <span className="block">
        Open R&amp;D on running fully autonomous AI agents on a public
        blockchain.
      </span>
      <span className="block">
        No off-chain shortcuts. Verifiable by design.
      </span>
    </Motion.p>
  </>
);

export default Hero;
