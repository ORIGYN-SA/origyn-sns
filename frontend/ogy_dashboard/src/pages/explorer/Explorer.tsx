import { useEffect, useRef, useState } from "react";
import { Carousel, Search } from "@components/ui";
import {
  BlockchainIcon,
  CheckmarkCircleIcon,
  FilterIcon,
} from "@components/ui/icons";

const SECTIONS = [
  { title: "Featured Certificates", count: 8 },
  { title: "Art Certificates", count: 8 },
  { title: "Gold Certificates", count: 8 },
];

const LazyImage = ({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <div ref={ref} className={`bg-surface-2 ${className ?? ""}`}>
      {inView && (
        <img
          src={src}
          alt={alt}
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
};

const PlaceholderCard = ({ seed }: { seed: string }) => (
  <div className="w-[253px] h-[343px] rounded-xl border border-border-strong bg-surface pt-2 pr-2 pb-4 pl-2 flex flex-col gap-2.5">
    <div className="relative h-[229px] w-full">
      <LazyImage
        src={`https://cataas.com/cat?_=${encodeURIComponent(seed)}`}
        className="h-full w-full rounded-t-2xl overflow-hidden"
      />
      <div
        aria-label="OGY"
        className="absolute top-2 right-2 h-[30px] w-[30px] rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-[inset_0.75px_0.75px_0_rgba(255,255,255,0.45),inset_-0.75px_-0.75px_0_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.18)] pointer-events-none"
      >
        <img src="/ogy_logo.svg" alt="" className="h-[15px] w-[15px]" />
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-between px-1">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1 text-muted">
          <span className="font-medium text-[11px] leading-4 tracking-[1.6px] uppercase">
            Suzanne sys
          </span>
          <CheckmarkCircleIcon />
        </div>
        <h3 className="font-semibold text-[15px] leading-snug text-content">
          The Midsummer Night Dream
        </h3>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-1 self-start rounded-full border border-border-faint bg-surface-muted px-2 py-1 text-muted hover:bg-surface-2 transition-colors"
      >
        <BlockchainIcon />
        <span className="font-normal text-[10px] leading-none">
          Check on blockchain
        </span>
      </button>
    </div>
  </div>
);

const HeroCard = ({ seed }: { seed: string }) => (
  <div className="relative w-[520px] sm:w-[640px] h-[360px] rounded-2xl overflow-hidden border border-border-strong bg-surface group">
    <LazyImage
      src={`https://cataas.com/cat?_=${encodeURIComponent(seed)}`}
      className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

    <div
      aria-label="OGY"
      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-[inset_0.75px_0.75px_0_rgba(255,255,255,0.45),inset_-0.75px_-0.75px_0_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.18)] pointer-events-none"
    >
      <img src="/ogy_logo.svg" alt="" className="h-[18px] w-[18px]" />
    </div>

    <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
      <div className="flex items-center gap-1 text-white/80">
        <span className="font-medium text-[11px] leading-4 tracking-[1.6px] uppercase">
          Suzanne sys
        </span>
        <CheckmarkCircleIcon />
      </div>
      <h3 className="font-extrabold text-[26px] sm:text-[30px] leading-tight tracking-[-0.02em] text-white">
        The Midsummer Night Dream
      </h3>
      <button
        type="button"
        className="mt-1 inline-flex items-center gap-1.5 self-start rounded-full bg-white/15 backdrop-blur-md px-3 py-1.5 text-white hover:bg-white/25 transition-colors"
      >
        <BlockchainIcon />
        <span className="font-medium text-[11px] leading-none">
          Check on blockchain
        </span>
      </button>
    </div>
  </div>
);

export const Explorer = () => {
  return (
    <div className="max-w-[1440px] mx-auto py-8 px-6 sm:py-16">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 px-6 py-6 max-w-[528px] sm:px-16 sm:py-8">
          <h1 className="font-extrabold text-[40px] leading-[44px] sm:text-[64px] sm:leading-[60px] tracking-[-0.05em] text-center text-content">
            Explorer
          </h1>
        </div>

        <Search
          id="search-explorer"
          placeholder="Search by title, issuer, principal or token ID"
          className="w-full max-w-2xl mt-4"
          actions={
            <button
              type="button"
              aria-label="Open filters"
              className="mr-1 p-1 text-content hover:text-muted transition-colors"
            >
              <FilterIcon />
            </button>
          }
        />
      </div>

      <div className="mt-16 flex flex-col gap-16">
        {SECTIONS.map(({ title, count }, index) => (
          <section key={title}>
            <h2 className="text-[22px] font-semibold leading-none text-content mb-6">
              {title}
            </h2>
            <Carousel>
              {Array.from({ length: count }).map((_, i) => (
                <Carousel.Item key={i}>
                  {index === 0 ? (
                    <HeroCard seed={`${title}-${i}`} />
                  ) : (
                    <PlaceholderCard seed={`${title}-${i}`} />
                  )}
                </Carousel.Item>
              ))}
            </Carousel>
          </section>
        ))}
      </div>
    </div>
  );
};
