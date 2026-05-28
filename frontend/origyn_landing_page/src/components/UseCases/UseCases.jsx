import { useState, useRef, useEffect } from "react";
import styles from "./UseCases.module.scss";
import UseCaseCard from "./UseCaseCard";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { localePath } from "@/i18n/paths";

// Visual + link metadata is static; titles and descriptions come from i18n.
const USE_CASE_VISUALS = [
  { image: "/use-cases/art.webp", slug: "art" },
  { image: "/use-cases/gold.webp", slug: "gold" },
  { image: "/use-cases/diamonds.webp", slug: "luxury" },
  { image: "/use-cases/made_in.webp", slug: "madein" },
];

const UseCases = ({ id }) => {
  const t = useT();
  const { locale } = useLocale();
  const items = t.raw("home.useCases.items") ?? [];
  const useCases = USE_CASE_VISUALS.map((visual, i) => ({
    image: visual.image,
    link: localePath(locale, `use-case/${visual.slug}`),
    title: items[i]?.title,
    description: items[i]?.description,
  }));
  const indicatorTemplate = t("home.useCases.indicatorAria");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const storedScrollPosition = localStorage.getItem("scrollPosition");
    if (storedScrollPosition === "use-cases") {
      const element = document.getElementById("use-cases");
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
      localStorage.removeItem("scrollPosition");
    }
  }, []);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    if (!isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!isMobile || !touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < useCases.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <section className={styles.container} id={id}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {t("home.useCases.titlePrefix")} <span>{t("home.useCases.titleSuffix")}</span>
        </h2>
        <p className={styles.description}>{t("home.useCases.description")}</p>
      </div>

      <div
        className={styles.grid}
        ref={gridRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={isMobile ? { "--current-index": currentIndex } : undefined}
      >
        {useCases.map((useCase, index) => (
          <UseCaseCard
            key={index}
            {...useCase}
            className={
              isMobile && index === currentIndex ? styles.activeCard : ""
            }
          />
        ))}
      </div>

      {isMobile && (
        <div className={styles.indicators}>
          {useCases.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${
                index === currentIndex ? styles.active : ""
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={indicatorTemplate.replace("{n}", String(index + 1))}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default UseCases;
