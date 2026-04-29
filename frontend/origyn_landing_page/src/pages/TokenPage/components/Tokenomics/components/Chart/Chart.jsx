import { useState } from "react";
import { Tooltip } from "react-tooltip";
import PieChart from "@components/charts/pie/PieChart";
import styles from "./Chart.module.scss";

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={styles.infoIcon}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

const TokenomicsChart = ({
  title,
  colors,
  headerTooltip,
  totalLabel,
  totalValue,
  infos,
  chartData,
  loading,
  error,
}) => {
  const isSuccess = !loading && !error && chartData !== null;
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div>
          <span className={styles.infoIconWrapper} data-tooltip-id={headerTooltip.id}>
            <InfoIcon />
          </span>
          <Tooltip
            id={headerTooltip.id}
            place="bottom"
            clickable={headerTooltip.clickable ?? false}
            className={styles.tooltip}
            delayShow={300}
          >
            {headerTooltip.content}
          </Tooltip>
        </div>
      </div>

      <div className={styles.chartContainer}>
        {isSuccess && (
          <PieChart
            data={chartData}
            colors={colors}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
          />
        )}
        {(loading || error) && (
          <div className={styles.loaderWrapper}>
            <div className={styles.spinner} />
          </div>
        )}
      </div>

      <div className={styles.totalSection}>
        <h2 className={styles.totalLabel}>{totalLabel}</h2>
        <div className={styles.totalValue}>
          {isSuccess && totalValue ? (
            <>
              <img src="/ogy_logo.svg" alt="OGY Logo" />
              <span className={styles.totalNumber}>{totalValue}</span>
              <span className={styles.totalUnit}>OGY</span>
            </>
          ) : (
            <div className={styles.skeleton} />
          )}
        </div>
      </div>

      <div className={styles.subCardList}>
        {isSuccess &&
          chartData.map(({ name, valueToString }, index) => (
            <div
              key={name}
              className={`${styles.subCard} ${activeIndex === index ? styles.subCardActive : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className={styles.subCardHeader}>
                <div className={styles.subCardName}>
                  <div className={styles.colorDot} style={{ backgroundColor: colors[index] }} />
                  <span className={styles.subCardLabel}>{name}</span>
                </div>
                <div>
                  <span className={styles.infoIconWrapper} data-tooltip-id={infos[index].id}>
                    <InfoIcon />
                  </span>
                  <Tooltip
                    id={infos[index].id}
                    place="bottom"
                    className={styles.tooltip}
                    delayShow={300}
                  >
                    {infos[index].content}
                  </Tooltip>
                </div>
              </div>
              <div className={styles.subCardValue}>
                <span className={styles.subCardNumber}>{valueToString}</span>
                <span className={styles.totalUnit}>OGY</span>
              </div>
              <div className={styles.borderBottom} style={{ backgroundColor: colors[index] }} />
            </div>
          ))}
        {(loading || error) && (
          <>
            <div className={styles.subCardSkeleton} />
            <div className={styles.subCardSkeleton} />
          </>
        )}
      </div>
    </div>
  );
};

export default TokenomicsChart;
