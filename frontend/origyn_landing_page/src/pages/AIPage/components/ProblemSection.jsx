import Eyebrow from "./Eyebrow";
import Card from "./Card";

const ProblemSection = () => (
  <section className="px-6 py-32 md:py-40">
    <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
      <Eyebrow>The problem</Eyebrow>

      <h2 className="mt-8 m-0 text-[clamp(40px,7vw,80px)] font-extralight leading-[1.125] tracking-normal text-ink">
        No one actually runs
        <br />
        <span className="font-normal italic">AI on-chain.</span>
      </h2>

      <p className="mt-12 max-w-[860px] text-[15px] leading-[1.85] text-muted">
        Every project that claims to have an{" "}
        <strong className="font-normal text-ink">
          “on-chain AI agent”
        </strong>{" "}
        follows the same pattern : inference runs off-chain, on centralized
        servers, and only the result is posted to the blockchain. The model
        never executes inside the network. The chain is used as a bulletin
        board, not as a compute layer.
      </p>

      <p className="mt-10 max-w-[860px] text-[15px] leading-[1.85] text-ink">
        That is not an on-chain agent. That is an API call with a receipt.
      </p>

      <div className="mt-16 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="The claim">
          The claim. “AI-powered on-chain agent.” Inference happens on AWS. The
          chain only stores the output.
        </Card>
        <Card title="The gap">
          No verifiable execution. No deterministic replay. No way to audit
          what the model actually computed.
        </Card>
        <Card title="Our approach">
          Full inference inside the canister. WASM SIMD, on the Swiss Subnet.
          Verifiable, reproducible, truly on-chain.
        </Card>
      </div>

      <p className="mt-16 max-w-[920px] text-[15px] leading-[1.85] text-muted">
        We have already demonstrated this.{" "}
        <strong className="font-normal text-ink">Origyn</strong> runs real
        inference on-chain today. We are now in an active testing phase,
        stress-testing robustness across models and workloads to confirm what
        our benchmarks already show : this is the most reliable{" "}
        <strong className="font-normal text-ink">on-chain AI</strong> inference
        stack that exists.
      </p>
    </div>
  </section>
);

export default ProblemSection;
