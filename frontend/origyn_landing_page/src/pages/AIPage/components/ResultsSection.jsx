import Eyebrow from "./Eyebrow";
import Card from "./Card";
import Hyperspeed from "./Hyperspeed";
import { ScrollReveal } from "./AnimatedText";

const ROWS = [
  { model: "Qwen 2.5 0.5B", existing: "10 tok/call", origyn: "29 tok/call", gain: "2.9×" },
  { model: "SmolLM2-135M", existing: "36 tok/call", origyn: "103 tok/call", gain: "2.9×" },
];

const HYPERSPEED_OPTIONS = {
  colors: {
    background: 0xffffff,
    roadColor: 0xf5f4f4,
    islandColor: 0xe8e8e8,
    shoulderLines: 0x222526,
    brokenLines: 0xc4c8cc,
    leftCars: [0x1f9cd4, 0x1470b1, 0x1a5ea2],
    rightCars: [0x254088, 0x263c85, 0x1e2448],
    sticks: 0x061937,
  },
};

const ResultsSection = () => (
  <section className="py-20 md:py-28">
    <div className="mx-auto flex max-w-6xl flex-col items-center px-6">
      <Eyebrow>Our results</Eyebrow>

      <h2 className="mt-8 m-0 text-center text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
        <ScrollReveal as="span" className="block font-normal italic">
          Faster
        </ScrollReveal>
        <ScrollReveal as="span" className="block">
          than the existing.
        </ScrollReveal>
      </h2>

      <p className="mt-10 max-w-[860px] text-center text-base leading-[1.75] text-muted md:text-[1.0625rem]">
        Same models, same conditions, production network. Our custom WASM SIMD
        kernels make the difference.
      </p>
    </div>

    <div className="relative mt-12 h-[clamp(420px,60vh,640px)] w-full overflow-hidden">
      <Hyperspeed effectOptions={HYPERSPEED_OPTIONS} />
      <div className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_55%_40%_at_center,rgba(255,255,255,0.92),rgba(255,255,255,0)_75%)]" />
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-6 text-center md:gap-8">
        <Eyebrow>Qwen 2.5 0.5B · production network</Eyebrow>
        <div className="flex flex-col items-center gap-3 text-[clamp(2rem,5.5vw,4rem)] font-extralight leading-none tracking-tight md:flex-row md:gap-8">
          <span className="text-muted">10 tok/call</span>
          <span className="inline-block rotate-90 font-normal italic text-ink md:rotate-0">→</span>
          <span className="text-ink">29 tok/call</span>
        </div>
        <p className="max-w-[640px] text-[0.9375rem] font-extralight italic leading-[1.5] text-ink md:text-[1.0625rem]">
          2.9× faster than existing on-chain inference
        </p>
      </div>
    </div>

    <div className="mx-auto flex max-w-6xl flex-col items-center px-6">
      <p className="mt-12 max-w-[860px] text-center text-base leading-[1.75] text-muted md:text-[1.0625rem]">
        For the same compute budget, a Second Brain powered by our fork does
        three times more work, or consumes three times fewer resources.
      </p>

      <p className="mt-10 max-w-[860px] text-center text-base leading-[1.75] text-muted md:text-[1.0625rem]">
        <span className="block">
          We are not tied to any single model or architecture. Every new release
          is an opportunity.
        </span>
        <span className="block">
          We continuously benchmark and integrate the latest models to push
          speed, accuracy, and efficiency further.
        </span>
      </p>

      <table className="mt-12 w-full max-w-[1080px] border-collapse text-base">
        <thead>
          <tr className="border-b border-[#ececec]">
            <th className="py-4 text-left text-[0.8125rem] font-normal uppercase tracking-[0.14em]">
              <span className="text-gradient">Model</span>
            </th>
            <th className="py-4 text-left text-[0.8125rem] font-normal uppercase tracking-[0.14em]">
              <span className="text-gradient">Existing</span>
            </th>
            <th className="py-4 text-left text-[0.8125rem] font-normal uppercase tracking-[0.14em]">
              <span className="text-gradient">ORIGYN AI</span>
            </th>
            <th className="py-4 text-right text-[0.8125rem] font-normal uppercase tracking-[0.14em]">
              <span className="text-gradient">Gain</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.model} className="border-b border-[#ececec]">
              <td className="py-6 text-ink">{row.model}</td>
              <td className="py-6 text-muted">{row.existing}</td>
              <td className="py-6 text-ink">{row.origyn}</td>
              <td className="py-6 text-right font-medium text-ink">
                {row.gain}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 grid w-full max-w-[1080px] grid-cols-1 gap-4 md:grid-cols-2">
        <Card align="left" title="Fleet of micro-experts">
          Instead of one slow large model, we deploy task-specific finetuned
          sub-1B parameter models: sorting emails, classifying documents,
          evaluating risk. Faster and more precise than a generalist.
        </Card>
        <Card align="left" title="On-chain distillation">
          A large model teaches off-chain, a small model deploys on-chain.
          Combined with 4-bit quantization and our custom WASM SIMD kernels,
          this enables real AI within a canister’s instruction budget.
        </Card>
      </div>
    </div>
  </section>
);

export default ResultsSection;
