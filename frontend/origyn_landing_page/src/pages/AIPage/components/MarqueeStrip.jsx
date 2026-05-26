import { useT } from "@/i18n/LocaleContext";
import { useDraggableMarquee } from "./useDraggableMarquee";

const Run = ({ phrases, ariaHidden = false }) => (
  <span
    aria-hidden={ariaHidden || undefined}
    className="whitespace-nowrap text-[clamp(2.5rem,6vw,4.5rem)] font-extralight tracking-tight text-ink/70"
  >
    {phrases.map((text, i) => (
      <span key={i}>
        <span className={i % 2 === 1 ? "font-normal text-ink" : undefined}>
          {text}
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
  const { trackRef, isDragging, handlers } = useDraggableMarquee();

  return (
    <div
      {...handlers}
      className={`select-none touch-pan-y overflow-hidden py-10 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        <Run phrases={phrases} />
        <Run phrases={phrases} ariaHidden />
      </div>
    </div>
  );
};

export default MarqueeStrip;
