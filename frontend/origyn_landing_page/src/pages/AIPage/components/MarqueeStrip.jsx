import { useT } from "@/i18n/LocaleContext";

const Run = ({ phrases, ariaHidden = false }) => (
  <span
    aria-hidden={ariaHidden || undefined}
    className="whitespace-nowrap text-[clamp(2.5rem,6vw,4.5rem)] font-extralight tracking-tight text-ink/70"
  >
    {phrases.map((p, i) => (
      <span key={i}>
        <span className={p.emphasis ? "font-normal text-ink" : undefined}>
          {p.text}
        </span>
        <span aria-hidden="true" className="mx-8 text-ink/30">
          ◆
        </span>
      </span>
    ))}
  </span>
);

const MarqueeStrip = () => {
  const t = useT();
  const phrases = t.raw("marquee.phrases");
  return (
    <div className="overflow-hidden py-10">
      <div className="flex w-max animate-marquee">
        <Run phrases={phrases} />
        <Run phrases={phrases} ariaHidden />
      </div>
    </div>
  );
};

export default MarqueeStrip;
