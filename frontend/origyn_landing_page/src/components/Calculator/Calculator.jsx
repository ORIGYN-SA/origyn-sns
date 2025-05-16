import React, { useState, useEffect } from "react";
import { usePricingData } from "../../hooks/calculator/usePricingData";
import TooltipInfo from "../Tooltip/TooltipInfo";
import { Slider } from "@mui/material";
import styles from "./Calculator.module.css";

const Calculator = () => {
  const { data: pricing, loading, error } = usePricingData();
  const [mode, setMode] = useState("simple");
  const [assetQuality, setAssetQuality] = useState("pdf");
  const [calculations, setCalculations] = useState({
    collections: 0,
    storage: 0,
    certificates: 0,
    certificateUpdates: 0,
    storageSize: 0,
  });

  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (mode === "simple") {
      const certificatesCount = calculations.certificates;
      let newStorageSize = 0;

      switch (assetQuality) {
        case "pdf":
          newStorageSize = certificatesCount * 0.25; // 250KB = 0.25MB
          break;
        case "iphone":
          newStorageSize = certificatesCount * 3; // 3MB
          break;
        case "dslr":
          newStorageSize = certificatesCount * 20; // 20MB
          break;
        case "video":
          newStorageSize = certificatesCount * 1000; // 1GB = 1000MB
          break;
        case "video1hr":
          newStorageSize = certificatesCount * 60000; // 60GB = 60000MB
          break;
      }

      setCalculations((prev) => ({
        ...prev,
        storageSize: newStorageSize,
      }));
    }
  }, [mode, assetQuality, calculations.certificates]);

  useEffect(() => {
    if (pricing) {
      const total =
        mode === "simple"
          ? calculations.certificates * pricing.certificateCreation +
            calculations.certificateUpdates * pricing.certificateUpdate +
            calculations.storageSize * pricing.perMbSize
          : calculations.collections * pricing.collectionCreation +
            calculations.storage * pricing.storageCreation +
            calculations.certificates * pricing.certificateCreation +
            calculations.certificateUpdates * pricing.certificateUpdate +
            calculations.storageSize * pricing.perMbSize;

      setTotalPrice(total);
    }
  }, [calculations, pricing, mode]);

  const handleInputChange = (field) => (event) => {
    const value = parseFloat(event.target.value) || 0;
    setCalculations((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const handleQualityChange = (quality) => {
    setAssetQuality(quality);
  };

  if (loading)
    return (
      <div className={styles.loadingSpinner}>
        <div className={styles.spinner}></div>
      </div>
    );
  if (error) return <div className={styles.error}>{error}</div>;
  if (!pricing) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.modeToggle}>
          <span
            className={
              mode === "simple" ? styles.modeButtonActive : styles.modeButton
            }
            onClick={() => handleModeChange("simple")}
          >
            Simple
          </span>
          <span
            className={
              mode === "advanced" ? styles.modeButtonActive : styles.modeButton
            }
            onClick={() => handleModeChange("advanced")}
          >
            Advanced
          </span>
        </div>

        <div className={styles.calculatorGrid}>
          {mode === "advanced" && (
            <>
              <div className={styles.inputGroup}>
                <div className={styles.label}>
                  <label className={styles.labelText}>
                    How many pieces would you like to certify?
                  </label>
                  <TooltipInfo id="tooltip-collections-count">
                    A collection is a bucket/group of assets for example gold,
                    diamond is a separate collection.
                    <br />
                    <br />1 collection deployed ={" "}
                    <span className={styles.costItemValue}>
                      {pricing.collectionCreation.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <img
                        className={styles.ogyLogo}
                        src="/ogy_logo.svg"
                        alt="OGY Logo"
                      />
                    </span>
                  </TooltipInfo>
                </div>
                <div className={styles.inputWrapper}>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={calculations.collections || ""}
                    onChange={handleInputChange("collections")}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.label}>
                  <label className={styles.labelText}>
                    Number of Storage Units{" "}
                    <span className={styles.optionalText}>(optional)</span>
                  </label>
                  <TooltipInfo id="tooltip-storage-units">
                    Storage canisters are used to store your certificate data.
                    You might need to spawn a new storage canister in case you
                    run out of space.
                    <br />
                    <br />1 storage canister ={" "}
                    <span className={styles.costItemValue}>
                      {pricing.storageCreation.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <img
                        className={styles.ogyLogo}
                        src="/ogy_logo.svg"
                        alt="OGY Logo"
                      />
                    </span>
                  </TooltipInfo>
                </div>
                <div className={styles.inputWrapper}>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={calculations.storage || ""}
                    onChange={handleInputChange("storage")}
                  />
                </div>
              </div>
            </>
          )}

          <div className={styles.inputGroup}>
            <div className={styles.label}>
              <label className={styles.labelText}>
                How many pieces would you like to certify?
              </label>
              <TooltipInfo id="tooltip-certificates-count">
                The total number of certificates to be minted. For example, one
                gold bar = one certificate.
                <br />
                <br />1 certificate minted ={" "}
                <span className={styles.costItemValue}>
                  {pricing.certificateCreation.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <img
                    className={styles.ogyLogo}
                    src="/ogy_logo.svg"
                    alt="OGY Logo"
                  />
                </span>
              </TooltipInfo>
            </div>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                min="0"
                className={styles.input}
                value={calculations.certificates || ""}
                onChange={handleInputChange("certificates")}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.label}>
              <label className={styles.labelText}>
                Number of Certificate Updates{" "}
                <span className={styles.optionalText}>(optional)</span>
              </label>
              <TooltipInfo id="tooltip-certificate-updates">
                The estimated number of updates to your certificates.
                <br />
                <br />
                Each certificate update ={" "}
                <span className={styles.costItemValue}>
                  {pricing.certificateUpdate.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <img
                    className={styles.ogyLogo}
                    src="/ogy_logo.svg"
                    alt="OGY Logo"
                  />
                </span>
              </TooltipInfo>
            </div>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                min="0"
                className={styles.input}
                value={calculations.certificateUpdates || ""}
                onChange={handleInputChange("certificateUpdates")}
              />
            </div>
          </div>

          {mode === "simple" ? (
            <>
              <div className={styles.assetQualityWrapper}>
                <div className={styles.assetQualityHeader}>
                  <span className={styles.assetQualityLabel}>PDF Document</span>
                  <span className={styles.assetQualityLabel}>
                    iPhone Picture
                  </span>
                  <span className={styles.assetQualityLabel}>
                    Studio Camera Picture
                  </span>
                  <span className={styles.assetQualityLabel}>
                    4K Video (≈ 1min)
                  </span>
                  <span className={styles.assetQualityLabel}>
                    4K Video (1hr)
                  </span>
                </div>
                <Slider
                  sx={{
                    "& .MuiSlider-rail": {
                      height: 13,
                      background: "#e2e8f0",
                      opacity: 1,
                      border: "2px solid #e2e8f0",
                    },
                    "& .MuiSlider-track": {
                      height: 13,
                      background: "linear-gradient(to right, #254088, #1F9CD4)",
                      border: "2px solid #e2e8f0",
                    },
                    "& .MuiSlider-thumb": {
                      width: 20,
                      height: 20,
                      background: "white",
                      border: "4px solid white",
                      backgroundColor: "#85F1FF",
                    },
                    "& .MuiSlider-mark": {
                      display: "none",
                    },
                    "& .MuiSlider-markActive": {
                      background: "#306ce6",
                    },
                  }}
                  value={
                    assetQuality === "pdf"
                      ? 1
                      : assetQuality === "iphone"
                        ? 2
                        : assetQuality === "dslr"
                          ? 3
                          : assetQuality === "video"
                            ? 4
                            : 5
                  }
                  step={1}
                  marks
                  min={1}
                  max={5}
                  onChange={(_, value) => {
                    if (value === 1) handleQualityChange("pdf");
                    else if (value === 2) handleQualityChange("iphone");
                    else if (value === 3) handleQualityChange("dslr");
                    else if (value === 4) handleQualityChange("video");
                    else handleQualityChange("video1hr");
                  }}
                />
                <div className={styles.storageSize}>
                  (Total storage: {calculations.storageSize.toLocaleString()}{" "}
                  MB)
                </div>
              </div>
            </>
          ) : (
            <div className={styles.inputGroup}>
              <div className={styles.label}>
                <label className={styles.labelText}>Storage Size (MB)</label>
                <TooltipInfo id="tooltip-size-mb">
                  Total storage size needed in megabytes
                  <br />
                  <br />1 MB ={" "}
                  <span className={styles.costItemValue}>
                    {pricing.perMbSize.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <img
                      className={styles.ogyLogo}
                      src="/ogy_logo.svg"
                      alt="OGY Logo"
                    />
                  </span>
                </TooltipInfo>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  value={calculations.storageSize || ""}
                  onChange={handleInputChange("storageSize")}
                />
              </div>
            </div>
          )}
          <div className={styles.dividerPrice}></div>
        </div>

        <div className={styles.totalPriceWrapper}>
          <div>Total Price:</div>
          <div className={styles.totalPriceRight}>
            <h3 className={styles.totalPriceValue}>
              {totalPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <img
                className={styles.ogyLogo}
                src="/ogy_logo.svg"
                alt="OGY Logo"
              />
            </h3>
            <span className={styles.totalPriceValueUsd}>
              {(totalPrice * pricing.ogyUsdt).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USDT
            </span>
            <span className={styles.ogyToUsd}>
              (1 USDT = {pricing.ogyUsdt} OGY)
            </span>
          </div>
        </div>

        <div className={styles.costBreakdown}>
          <h4 className={styles.costBreakdownTitle}>Cost Breakdown</h4>
          <div className={styles.divider}></div>
          <div className={styles.costBreakdownItems}>
            {mode === "advanced" && (
              <>
                <div className={styles.costItem}>
                  <span>Collections ({calculations.collections})</span>
                  <span className={styles.costItemValue}>
                    {(
                      calculations.collections * pricing.collectionCreation
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    <img
                      className={styles.ogyLogo}
                      src="/ogy_logo.svg"
                      alt="OGY Logo"
                    />
                  </span>
                </div>
                <div className={styles.costItem}>
                  <span>Storage Units ({calculations.storage})</span>
                  <span className={styles.costItemValue}>
                    {(
                      calculations.storage * pricing.storageCreation
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    <img
                      className={styles.ogyLogo}
                      src="/ogy_logo.svg"
                      alt="OGY Logo"
                    />
                  </span>
                </div>
              </>
            )}
            <div className={styles.costItem}>
              <span>Certificates ({calculations.certificates})</span>
              <span className={styles.costItemValue}>
                {(
                  calculations.certificates * pricing.certificateCreation
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <img
                  className={styles.ogyLogo}
                  src="/ogy_logo.svg"
                  alt="OGY Logo"
                />
              </span>
            </div>
            <div className={styles.costItem}>
              <span>
                Certificate Updates ({calculations.certificateUpdates})
              </span>
              <span className={styles.costItemValue}>
                {(
                  calculations.certificateUpdates * pricing.certificateUpdate
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <img
                  className={styles.ogyLogo}
                  src="/ogy_logo.svg"
                  alt="OGY Logo"
                />
              </span>
            </div>
            <div className={styles.costItem}>
              <span>
                Storage Size ({calculations.storageSize.toLocaleString()} MB)
              </span>
              <span className={styles.costItemValue}>
                {(calculations.storageSize * pricing.perMbSize).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
                <img
                  className={styles.ogyLogo}
                  src="/ogy_logo.svg"
                  alt="OGY Logo"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
