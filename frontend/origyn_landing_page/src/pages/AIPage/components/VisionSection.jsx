import Eyebrow from "./Eyebrow";
import PillarCard from "./PillarCard";

const PILLARS = [
  {
    title: "Trust",
    description: "Origyn certification = Verifiable trust signal.",
  },
  {
    title: "Context",
    description: "Origyn certification = Verifiable trust signal.",
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
  <section className="px-6 py-32 md:py-40">
    <div className="mx-auto flex max-w-6xl flex-col items-center">
      <Eyebrow>Vision</Eyebrow>

      <h2 className="mt-8 m-0 text-center text-[clamp(40px,7vw,80px)] font-extralight leading-[1.125] tracking-normal text-ink">
        <span className="font-normal italic">Five</span> durable pillars
        <br />
        of the web.
      </h2>

      <p className="mt-10 max-w-[860px] text-center text-[15px] leading-[1.85] text-muted">
        AI commoditizes production. Five pillars emerge that AI structurally
        cannot replace.
        <br />
        Origyn is positioned on all five.
      </p>

      <div className="mt-16 flex w-full max-w-[760px] flex-col gap-4">
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
