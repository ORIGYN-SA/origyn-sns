import Eyebrow from "./Eyebrow";
import Card from "./Card";
import MetricCard from "./MetricCard";

const ROWS = [
  { model: "Qwen 2.5 0.5B", existing: "10 tok/call", origyn: "29 tok/call", gain: "2.9×" },
  { model: "SmolLM2-135M", existing: "36 tok/call", origyn: "103 tok/call", gain: "2.9×" },
];

const ResultsSection = () => (
  <section className="px-6 py-32 md:py-40">
    <div className="mx-auto flex max-w-6xl flex-col items-center">
      <Eyebrow>Our results</Eyebrow>

      <h2 className="mt-8 m-0 text-center text-[clamp(40px,7vw,80px)] font-extralight leading-[1.125] tracking-normal text-ink">
        <span className="font-normal italic">Faster</span>
        <br />
        than the existing.
      </h2>

      <p className="mt-10 max-w-[860px] text-center text-[15px] leading-[1.85] text-muted">
        Same models, same conditions, production network. Our custom WASM SIMD
        kernels make the difference.
      </p>

      <div className="mt-12">
        <MetricCard value="2.9" suffix="x" />
      </div>

      <p className="mt-10 max-w-[760px] text-center text-[15px] leading-[1.85] text-muted">
        For the same compute budget, a Second Brain powered by our fork does
        three times more work, or consumes three times fewer resources.
      </p>

      <p className="mt-10 max-w-[860px] text-center text-[13px] leading-[1.85] text-muted">
        We are not tied to any single model or architecture. Every new release
        is an opportunity.
        <br />
        We continuously benchmark and integrate the latest models to push
        speed, accuracy, and efficiency further.
      </p>

      <table className="mt-16 w-full max-w-[1080px] border-collapse font-mono text-[13px]">
        <thead>
          <tr className="border-b border-hairline">
            <th className="py-4 text-left font-normal text-muted">Model</th>
            <th className="py-4 text-left font-normal text-muted">Existing</th>
            <th className="py-4 text-left font-normal text-muted">
              ORIGYN AI
            </th>
            <th className="py-4 text-right font-normal text-muted">Gain</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.model} className="border-b border-hairline">
              <td className="py-6 text-muted">{row.model}</td>
              <td className="py-6 text-muted">{row.existing}</td>
              <td className="py-6 text-muted">{row.origyn}</td>
              <td className="py-6 text-right font-bold text-navy">
                {row.gain}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-16 grid w-full max-w-[1080px] grid-cols-1 gap-4 md:grid-cols-2">
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
