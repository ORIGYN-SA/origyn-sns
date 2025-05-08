import React from "react";
import Button from "../Button/Button";
import Stats from "../Stats/Stats";
import styles from "./Hero.module.css";

const Hero = ({ data }) => {
  const statsData = [
    {
      value: data?.marketCap,
      title: "$OGY Market Cap",
    },
    {
      value: data?.users,
      title: "Users",
    },
    {
      value: data?.tvl,
      title: "Total Value Locked (TVL) of certified assets in usd",
    },
    {
      value: data?.assets,
      title: "Total Certified Assets",
    },
  ];

  return (
    <div className={styles.heroWithStats}>
      <div className={styles.heroContainer}>
        <img
          src="/ogy-background.png"
          alt="Background"
          className={styles.backgroundImage}
        />
        <div className={styles.contentWrapper}>
          <div className={styles.subtitle}>
            Secure your assets, intellectual property, and identity fully
            on-chain.
          </div>
          <div className={styles.titleWithButtons}>
            <img
              src="/origyn-logo-white-big.png"
              alt="ORIGYN Logo"
              className={styles.logo}
            />
            <div className={styles.buttonGroup}>
              <Button
                text="Certify your assets"
                onClick={() => {
                  const element = document.getElementById(
                    "certify-your-assets"
                  );
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              />
              <Button
                text="Buy $OGY"
                url="https://www.mexc.com/exchange/OGY_USDT"
              />
            </div>
          </div>
        </div>
        <img
          src="/ipad-mock.png"
          alt="iPad Interface"
          className={styles.ipadMock}
        />
        <div className={styles.bottomText}>
          <span>
            ORIGYN allows you to securely store your data and assets fully
            on-chain • ORIGYN allows you to securely store your data and assets
            fully on-chain • ORIGYN allows you to securely store your data and
            assets fully on-chain • ORIGYN allows you to securely store your
            data and assets fully on-chain • ORIGYN allows you to securely store
            your data and assets fully on-chain • ORIGYN allows you to securely
            store your data and assets fully on-chain •
          </span>
        </div>
      </div>
      <Stats items={statsData} />
    </div>
  );
};

export default Hero;
