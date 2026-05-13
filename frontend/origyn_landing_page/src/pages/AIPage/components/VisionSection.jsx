import Eyebrow from "./Eyebrow";
import PillarCard from "./PillarCard";

const PILLARS = [
  {
    title: "Trust",
    description: "Origyn certification = Verifiable trust signal.",
  },
  {
    title: "Context",
    description:
      "Decades of structured memory = personal signal AI cannot match.",
  },
  {
    title: "Distribution",
    description: "Swiss Subnet = Verifiable infrastructure for agents",
  },
  {
    title: "Taste",
    description: "Auto-research pipeline = Automation-assisted curation.",
  },
  {
    title: "Liability",
    description: "Audit trail + certificate = Governance layer.",
  },
];

const VisionSection = () => (
  <section className="px-6 py-20 md:py-28">
    <div className="mx-auto flex max-w-6xl flex-col items-center">
      <Eyebrow>Vision</Eyebrow>

      <h2 className="mt-8 m-0 text-center text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
        <span className="block">
          <span className="font-normal italic">Five</span> durable pillars
        </span>
        <span className="block">of the web.</span>
      </h2>

      <p className="mt-10 max-w-[860px] text-center text-base leading-[1.75] text-muted md:text-[1.0625rem]">
        <span className="block">
          AI commoditizes production. Five pillars emerge that AI structurally
          cannot replace.
        </span>
        <span className="block">Origyn is positioned on all five.</span>
      </p>

      <div className="mt-12 flex w-full max-w-[760px] flex-col gap-4">
        {PILLARS.map((pillar, i) => (
          <PillarCard key={pillar.title} index={i + 1} title={pillar.title}>
            {pillar.description}
          </PillarCard>
        ))}
      </div>
    </div>
  </section>
);

export default VisionSection;
