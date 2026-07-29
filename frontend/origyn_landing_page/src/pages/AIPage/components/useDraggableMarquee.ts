import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";

// Keep the offset within (-setWidth, 0] regardless of drag direction, so the
// two duplicated content sets always cover the viewport seamlessly.
const wrap = (x: number, w: number): number => {
  if (w <= 0) return x;
  const m = x % w;
  return m > 0 ? m - w : m;
};

type MarqueeControls = {
  trackRef: RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  handlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
  };
};

// Drives a marquee with requestAnimationFrame instead of a CSS animation, so the
// user can grab and drag the strip horizontally and the auto-scroll resumes from
// wherever they let go. All effect/rAF/pointer state lives here, isolated in a
// hook, rather than in the component body.
//
// Every transform write happens once per frame inside the rAF loop - pointermove
// only records the latest cursor X - so dragging stays in sync with the display
// refresh instead of stuttering on the (irregular) pointer-event cadence.
//
// `durationSec` is the time the original CSS animation took to travel one content
// set (-50% of the duplicated track); reproducing it as px/s keeps the idle feel.
export function useDraggableMarquee(durationSec = 80): MarqueeControls {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const offsetRef = useRef(0); // current translateX, kept in (-setWidth, 0]
  const setWidthRef = useRef(0); // width of one content set (half the track)
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const pointerXRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      setWidthRef.current = track.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const set = setWidthRef.current;
      if (set > 0) {
        if (draggingRef.current) {
          offsetRef.current = wrap(
            dragStartOffsetRef.current +
              (pointerXRef.current - dragStartXRef.current),
            set,
          );
        } else if (!reduceMotion) {
          offsetRef.current = wrap(
            offsetRef.current - (set / durationSec) * dt,
            set,
          );
        }
        track.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [durationSec]);

  const handlers = {
    onPointerDown: (e: PointerEvent) => {
      draggingRef.current = true;
      setIsDragging(true);
      dragStartXRef.current = e.clientX;
      pointerXRef.current = e.clientX;
      dragStartOffsetRef.current = offsetRef.current;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent) => {
      if (draggingRef.current) pointerXRef.current = e.clientX;
    },
    onPointerUp: (e: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
    },
  };

  return { trackRef, isDragging, handlers };
}
