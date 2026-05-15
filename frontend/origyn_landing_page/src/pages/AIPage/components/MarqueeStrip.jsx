const PHRASES = [
  { text: "You are what you know and remember." },
  { text: "Lose that, and you lose yourself.", emphasis: true },
  { text: "AI works the same way." },
  {
    text: "Expertise means nothing if the agent has to relearn you every time.",
  },
  {
    text: "Without memory, without context, without a relationship to your reality, it’s just noise.",
  },
  {
    text: "The question isn’t whether AI is powerful. It’s whether your agent actually knows you.",
    emphasis: true,
  },
];

const Run = ({ ariaHidden = false }) => (
  <span
    aria-hidden={ariaHidden || undefined}
    className="whitespace-nowrap text-[clamp(2.5rem,6vw,4.5rem)] font-extralight tracking-tight text-ink/70"
  >
    {PHRASES.map((p, i) => (
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

const MarqueeStrip = () => (
  <div className="overflow-hidden py-10">
    <div className="flex w-max animate-marquee">
      <Run />
      <Run ariaHidden />
    </div>
  </div>
);

export default MarqueeStrip;
