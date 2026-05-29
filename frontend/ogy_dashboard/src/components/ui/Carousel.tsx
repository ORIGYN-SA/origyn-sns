import {
  HTMLAttributes,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaOptionsType } from "embla-carousel";
import { ChevronLeftIcon, ChevronRightIcon } from "@components/ui/icons";
import { useT } from "@i18n/LocaleContext";

interface CarouselProps extends PropsWithChildren {
  className?: string;
  options?: EmblaOptionsType;
  showControls?: boolean;
}

const Carousel = ({
  className,
  children,
  options,
  showControls = true,
}: CarouselProps) => {
  const t = useT();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    ...options,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">{children}</div>
      </div>

      {showControls && (
        <div className="hidden sm:flex absolute -top-12 end-0 items-center gap-2">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label={t("common.previous")}
            className="h-9 w-9 rounded-full border border-border bg-surface flex items-center justify-center text-content transition-opacity hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="rtl:-scale-x-100" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label={t("common.next")}
            className="h-9 w-9 rounded-full border border-border bg-surface flex items-center justify-center text-content transition-opacity hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="rtl:-scale-x-100" />
          </button>
        </div>
      )}
    </div>
  );
};

interface CarouselItemProps
  extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  className?: string;
}

const CarouselItem = ({
  className,
  children,
  ...restProps
}: CarouselItemProps) => (
  <div
    className={`shrink-0 grow-0 basis-auto ${className ?? ""}`}
    {...restProps}
  >
    {children}
  </div>
);

Carousel.Item = CarouselItem;

export default Carousel;
