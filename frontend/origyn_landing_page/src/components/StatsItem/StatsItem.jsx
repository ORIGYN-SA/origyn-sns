import React, { useEffect, useRef, useState } from "react";
import TooltipInfo from "@components/Tooltip/TooltipInfo";
import styles from "./StatsItem.module.scss";

const DURATION = 1800;

function formatNumber(n, separator) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function detectSeparator(str) {
  if (/[\u2019']/.test(str)) return "\u2019";
  if (/ /.test(str.replace(/^\$/, ""))) return " ";
  return "\u2019";
}

function parseNumeric(str) {
  return parseInt(str.replace(/[\u2019' $]/g, ""), 10);
}

function useCountUp(target, separator, active) {
  const [display, setDisplay] = useState("0");
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!active || target === null) return;

    startRef.current = null;
    cancelAnimationFrame(rafRef.current);

    function step(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(formatNumber(eased * target, separator));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, separator, active]);

  return display;
}

const StatsItem = ({ title, value, tooltip, tooltipTitle }) => {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  const prefix = typeof value === "string" && value.startsWith("$") ? "$" : "";
  const separator = typeof value === "string" ? detectSeparator(value) : "\u2019";
  const numericTarget =
    typeof value === "string" ? parseNumeric(value) : null;
  const isAnimatable = numericTarget !== null && !isNaN(numericTarget);

  useEffect(() => {
    if (!isAnimatable) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isAnimatable]);

  const animated = useCountUp(isAnimatable ? numericTarget : null, separator, active);

  return (
    <div className={styles.statsItem} ref={ref}>
      <div className={styles.valueRow}>
        <div className={styles.value}>
          {value === undefined ? (
            <div className={styles.skeleton} />
          ) : isAnimatable ? (
            prefix + animated
          ) : (
            value
          )}
        </div>
      </div>
      <div className={styles.titleRow}>
        <div className={styles.title}>
          {title}
          {tooltip && (
            <TooltipInfo
              id={`tooltip-${title.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {tooltipTitle || title}
              <br />
              {tooltip}
            </TooltipInfo>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsItem;
