const LOREM =
  "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua • ";

const REPEATED = LOREM.repeat(6);

const MarqueeStrip = () => (
  <div className="overflow-hidden py-16">
    <div className="flex w-max animate-marquee">
      <span className="whitespace-nowrap font-mono text-[20px] text-muted">
        {REPEATED}
      </span>
      <span
        className="whitespace-nowrap font-mono text-[20px] text-muted"
        aria-hidden="true"
      >
        {REPEATED}
      </span>
    </div>
  </div>
);

export default MarqueeStrip;
