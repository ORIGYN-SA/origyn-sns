import { useRef } from "react";
import {
  motion as Motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

const DEFAULT_OFFSET = ["start 0.85", "start 0.5"];

export function ScrollReveal({
  as = "div",
  children,
  className,
  offset = DEFAULT_OFFSET,
  yFrom = 22,
  style,
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [yFrom, 0]);

  const Tag = Motion[as];

  if (reduced) {
    return (
      <Tag ref={ref} className={className} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ ...style, opacity, y, willChange: "opacity, transform" }}
    >
      {children}
    </Tag>
  );
}

