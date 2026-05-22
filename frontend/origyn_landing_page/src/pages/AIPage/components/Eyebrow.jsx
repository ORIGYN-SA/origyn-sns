import { ScrollReveal } from "./AnimatedText";

const Eyebrow = ({ children }) => (
  <ScrollReveal
    as="p"
    className="font-mono text-[0.8125rem] uppercase tracking-[0.2em]"
    offset={["start 0.9", "start 0.6"]}
  >
    <span className="text-gradient">{children}</span>
  </ScrollReveal>
);

export default Eyebrow;
