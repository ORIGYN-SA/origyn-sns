import Eyebrow from "./Eyebrow";
import { ScrollReveal } from "./AnimatedText";

const STEPS = [
  {
    title: "The claim",
    body: "“AI-powered on-chain agent.” Inference happens on AWS. The chain only stores the output.",
  },
  {
    title: "The gap",
    body: "No verifiable execution. No deterministic replay. No way to audit what the model actually computed.",
  },
  {
    title: "Our approach",
    body: "Full inference inside the canister. WASM SIMD, on the Swiss Subnet. Verifiable, reproducible, truly on-chain.",
  },
];

const ProblemSection = () => (
  <section className="px-6 py-20 md:py-28">
    <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
      <Eyebrow>The problem</Eyebrow>

      <h2 className="mt-8 m-0 text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
        <ScrollReveal as="span" className="block">
          No one actually runs
        </ScrollReveal>
        <ScrollReveal as="span" className="block font-normal italic">
          AI on-chain.
        </ScrollReveal>
      </h2>

      <ScrollReveal
        as="p"
        className="mt-12 max-w-[860px] text-base leading-[1.75] text-muted md:text-[1.0625rem]"
      >
        Every project that claims to have an{" "}
        <strong className="font-normal text-ink">
          “on-chain AI agent”
        </strong>{" "}
        follows the same pattern : inference runs off-chain, on centralized
        servers, and only the result is posted to the blockchain. The model
        never executes inside the network. The chain is used as a bulletin
        board, not as a compute layer.
      </ScrollReveal>

      <ScrollReveal
        as="p"
        className="mt-10 max-w-[860px] text-base leading-[1.75] text-ink md:text-[1.0625rem]"
      >
        That is not an on-chain agent. That is an API call with a receipt.
      </ScrollReveal>

      <div className="mt-12 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => {
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
        We have already demonstrated this.{" "}
        <strong className="font-normal text-ink">Origyn</strong> runs real
        inference on-chain today. We are now in an active testing phase,
        stress-testing robustness across models and workloads to confirm what
        our benchmarks already show : this is the most reliable{" "}
        <strong className="font-normal text-ink">on-chain AI</strong> inference
        stack that exists.
      </ScrollReveal>
    </div>
  </section>
);

export default ProblemSection;
