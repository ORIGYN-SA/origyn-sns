import { useEffect, useRef, useState } from "react";
import Button from "@components/Button/Button";
import Stats from "@components/Stats/Stats";
import { useT } from "@/i18n/LocaleContext";
import styles from "./Hero.module.scss";

const Hero = ({ data }) => {
  const t = useT();
  const bgRef = useRef(null);
  const ipadRef = useRef(null);
  const initialIpadY = useRef(0);
  // eslint-disable-next-line no-unused-vars
  const [scrollY, setScrollY] = useState(0);
  const [ipadLoaded, setIpadLoaded] = useState(false); // NEW

  const statsData = [
    {
      value: data?.marketCap,
      title: t("home.stats.marketCap.title"),
      tooltip: t("home.stats.marketCap.tooltip"),
    },
    {
      value: data?.tvl,
      title: t("home.stats.tvl.title"),
      tooltipTitle: t("home.stats.tvl.tooltipTitle"),
      tooltip: t("home.stats.tvl.tooltip"),
    },
    {
      value: data?.users,
      title: t("home.stats.users.title"),
      tooltip: t("home.stats.users.tooltip"),
    },
    {
      value: data?.assets,
      title: t("home.stats.assets.title"),
      tooltip: t("home.stats.assets.tooltip"),
    },
  ];

  useEffect(() => {
    if (!ipadLoaded) return; // Wait for image to load

    const isDesktop = () => window.innerWidth >= 992;

    const setInitialIpadY = () => {
      if (ipadRef.current) {
        ipadRef.current.style.transform = "";
        ipadRef.current.getBoundingClientRect();
        const style = window.getComputedStyle(ipadRef.current);
        const matrix = new DOMMatrixReadOnly(style.transform);
        initialIpadY.current = matrix.m42;
      }
    };

    const handleScroll = () => {
      if (!isDesktop()) return;
      const scrollY = window.scrollY;
      setScrollY(scrollY);
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${scrollY * 0.4}px)`;
      }
      if (ipadRef.current) {
        const y = initialIpadY.current + scrollY * 0.3;
        ipadRef.current.style.transform = `translateX(-50%) translateY(${y}px)`;
      }
    };

    const handleResize = () => {
      if (!isDesktop()) {
        if (bgRef.current) bgRef.current.style.transform = "";
        if (ipadRef.current) ipadRef.current.style.transform = "";
      } else {
        setInitialIpadY();
        handleScroll();
      }
    };

    if (isDesktop()) {
      setInitialIpadY();
      handleScroll();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [ipadLoaded]); // Only run after image is loaded

  // Render newline-separated translations as line-broken JSX. Translators can
  // tweak where breaks fall without touching markup.
  const renderLines = (text) =>
    text.split("\n").map((line, i, all) => (
      <span key={i}>
        {line}
        {i < all.length - 1 && <br />}
      </span>
    ));

  const marqueeText = t("home.hero.marquee");
  const marqueeLoop = Array.from({ length: 6 }, (_, i) => (
    <span key={i}>{marqueeText} • </span>
  ));

  return (
    <div className={styles.heroWithStats}>
      <div className={styles.heroContainer}>
        <video
          id="hero-bg-img"
          ref={bgRef}
          className={styles.backgroundImage}
          style={{ willChange: "transform" }}
          autoPlay
          loop
          muted
          playsInline
        >
          <source
            src="https://pub-1832d2c733894370a7282135b65cc177.r2.dev/claimlink_login_bg_video.mp4"
            type="video/mp4"
          />
        </video>
        <div className={styles.contentWrapper}>
          <div className={styles.subtitleDesktop}>
            {renderLines(t("home.hero.subtitleDesktop"))}
          </div>
          <div className={styles.subtitleMobile}>
            {renderLines(t("home.hero.subtitleMobile"))}
          </div>
          <div className={styles.titleWithButtons}>
            <img
              src="/origyn-logo-white-big.png"
              alt={t("home.hero.logoAlt")}
              className={styles.logo}
            />
            <div className={styles.buttonGroup}>
              <Button
                text={t("home.hero.certifyCta")}
                onClick={() => {
                  const element = document.getElementById(
                    "certify-your-assets",
                  );
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              />
              <div className={styles.buyButtonWrapper}>
                <Button
                  text={t("home.hero.buyCta")}
                  url="https://www.mexc.com/exchange/OGY_USDT"
                />
              </div>
            </div>
          </div>
        </div>
        <img
          id="ipad-img"
          ref={ipadRef}
          src="/ipad-mock.png"
          alt="iPad Interface"
          className={styles.ipadMock}
          style={{ willChange: "transform" }}
          onLoad={() => setIpadLoaded(true)}
        />
        <div className={styles.bottomText}>
          <span>{marqueeLoop}</span>
        </div>
      </div>
      <Stats items={statsData} />
    </div>
  );
};

export default Hero;
