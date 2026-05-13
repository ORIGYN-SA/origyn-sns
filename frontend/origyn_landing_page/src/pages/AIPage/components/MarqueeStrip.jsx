const LOREM =
  "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua • ";

const REPEATED = LOREM.repeat(6);

const MarqueeStrip = () => (
  <div className="overflow-hidden py-10">
    <div className="flex w-max animate-marquee">
      <span className="whitespace-nowrap text-[clamp(2.5rem,6vw,4.5rem)] font-extralight tracking-tight text-ink/70">
        {REPEATED}
      </span>
      <span
        className="whitespace-nowrap text-[clamp(2.5rem,6vw,4.5rem)] font-extralight tracking-tight text-ink/70"
        aria-hidden="true"
      >
        {REPEATED}
      </span>
    </div>
  </div>
);

export default MarqueeStrip;
