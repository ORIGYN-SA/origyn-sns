import React, { useState, useEffect } from "react";
import { usePricingData } from "../../hooks/calculator/usePricingData";
import { TooltipInfo } from "@components/ui";
import Slider, { SliderThumb } from "@mui/material/Slider";
import { styled } from "@mui/material/styles";

type CalculatorMode = "simple" | "advanced";

type AssetQuality = "low" | "medium" | "high";

const AirbnbSlider = styled(Slider)(({ theme }) => ({
  color: "#3a8589",
  height: 3,
  padding: "13px 0",
  "& .MuiSlider-thumb": {
    height: 27,
    width: 27,
    backgroundColor: "#fff",
    border: "1px solid currentColor",
    "&:hover": {
      boxShadow: "0 0 0 8px rgba(58, 133, 137, 0.16)",
    },
    "& .airbnb-bar": {
      height: 9,
      width: 1,
      backgroundColor: "currentColor",
      marginLeft: 1,
      marginRight: 1,
    },
  },
  "& .MuiSlider-track": {
    height: 3,
  },
  "& .MuiSlider-rail": {
    color: theme.palette.mode === "dark" ? "#bfbfbf" : "#d8d8d8",
    opacity: theme.palette.mode === "dark" ? undefined : 1,
    height: 3,
  },
}));

interface AirbnbThumbComponentProps extends React.HTMLAttributes<unknown> {}

function AirbnbThumbComponent(props: AirbnbThumbComponentProps) {
  const { children, ...other } = props;
  return (
    <SliderThumb {...other}>
      {children}
      <span className="airbnb-bar" />
      <span className="airbnb-bar" />
      <span className="airbnb-bar" />
    </SliderThumb>
  );
}

const Calculator: React.FC = () => {
  const { data: pricing, loading, error } = usePricingData();
  const [mode, setMode] = useState<CalculatorMode>("simple");
  const [assetQuality, setAssetQuality] = useState<AssetQuality>("medium");
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
        case "low":
          newStorageSize = certificatesCount * 10;
          break;
        case "medium":
          newStorageSize = certificatesCount * 100;
          break;
        case "high":
          newStorageSize = certificatesCount * 1000;
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
        calculations.collections * pricing.collectionCreation +
        calculations.storage * pricing.storageCreation +
        calculations.certificates * pricing.certificateCreation +
        calculations.certificateUpdates * pricing.certificateUpdate +
        calculations.storageSize * pricing.perMbSize;

      setTotalPrice(total);
    }
  }, [calculations, pricing]);

  const handleInputChange =
    (field: keyof typeof calculations) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value) || 0;
      setCalculations((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleModeChange = (newMode: CalculatorMode) => {
    setMode(newMode);
  };

  const handleQualityChange = (quality: AssetQuality) => {
    setAssetQuality(quality);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  if (error) return <div className="text-error">{error}</div>;
  if (!pricing) return null;

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">Calculator</h1>
          <p className="mt-6 text-content/60 text-lg">
            Use the ORIGYN calculator to estimate the cost of your unique
            certificate with all your data on chain
          </p>
        </div>
      </div>

      <div className="flex justify-center mt-8 mb-4">
        <div className="flex items-center rounded-full bg-black/20">
          <button
            type="button"
            className={`text-sm py-2 px-4 font-semibold ${
              mode === "simple"
                ? "bg-sky text-white tracking-widest px-4 py-1 text-xs rounded-full font-semibold uppercase"
                : "text-white"
            }`}
            onClick={() => handleModeChange("simple")}
          >
            Simple
          </button>
          <button
            type="button"
            className={`text-sm py-2 px-4 font-semibold ${
              mode === "advanced"
                ? "bg-sky text-white tracking-widest px-4 py-1 text-xs rounded-full font-semibold uppercase"
                : "text-white"
            }`}
            onClick={() => handleModeChange("advanced")}
          >
            Advanced
          </button>
        </div>
      </div>

      <div className="my-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-foreground">
                Number of Collections
              </label>
              <TooltipInfo id="tooltip-collections-count">
                A collection is a bucket/group of assets for example gold,
                diamond is a separate collection.
                <br />
                <br />1 collection deployed ={" "}
                <span className="inline-flex items-center">
                  {pricing.collectionCreation.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <img
                    className="mx-2 h-4 w-4"
                    src="/ogy_logo.svg"
                    alt="OGY Logo"
                  />
                </span>
              </TooltipInfo>
            </div>
            <div className="rounded-full bg-surface border border-border px-4 py-2 flex justify-between items-center w-full">
              <input
                type="number"
                min="0"
                className="form-input bg-surface w-full outline-none focus:outline-none focus:border-none border-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={calculations.collections || ""}
                onChange={handleInputChange("collections")}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-foreground">
                Number of Storage Units{" "}
                <span className="text-content/60">(optional)</span>
              </label>
              <TooltipInfo id="tooltip-storage-units">
                Storage canisters are used to store your certificate data. You
                might need to spawn a new storage canister in case you run out
                of space.
                <br />
                <br />1 storage canister ={" "}
                <span className="inline-flex items-center">
                  {pricing.storageCreation.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <img
                    className="mx-2 h-4 w-4"
                    src="/ogy_logo.svg"
                    alt="OGY Logo"
                  />
                </span>
              </TooltipInfo>
            </div>
            <div className="rounded-full bg-surface border border-border px-4 py-2 flex justify-between items-center w-full">
              <input
                type="number"
                min="0"
                className="form-input bg-surface w-full outline-none focus:outline-none focus:border-none border-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={calculations.storage || ""}
                onChange={handleInputChange("storage")}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-foreground">
                How many pieces you would like to certify?
              </label>
              <TooltipInfo id="tooltip-certificates-count">
                The total number of certificates to be minted. For example, one
                gold bar = one certificate.
                <br />
                <br />1 certificate minted ={" "}
                <span className="inline-flex items-center">
                  {pricing.certificateCreation.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <img
                    className="mx-2 h-4 w-4"
                    src="/ogy_logo.svg"
                    alt="OGY Logo"
                  />
                </span>
              </TooltipInfo>
            </div>
            <div className="rounded-full bg-surface border border-border px-4 py-2 flex justify-between items-center w-full">
              <input
                type="number"
                min="0"
                className="form-input bg-surface w-full outline-none focus:outline-none focus:border-none border-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={calculations.certificates || ""}
                onChange={handleInputChange("certificates")}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-foreground">
                Number of Certificate Updates{" "}
                <span className="text-content/60">(optional)</span>
              </label>
              <TooltipInfo id="tooltip-certificate-updates">
                The estimated number of updates to your certificates.
                <br />
                <br />
                Each certificate update ={" "}
                <span className="inline-flex items-center">
                  {pricing.certificateUpdate.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <img
                    className="mx-2 h-4 w-4"
                    src="/ogy_logo.svg"
                    alt="OGY Logo"
                  />
                </span>
              </TooltipInfo>
            </div>
            <div className="rounded-full bg-surface border border-border px-4 py-2 flex justify-between items-center w-full">
              <input
                type="number"
                min="0"
                className="form-input bg-surface w-full outline-none focus:outline-none focus:border-none border-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={calculations.certificateUpdates || ""}
                onChange={handleInputChange("certificateUpdates")}
              />
            </div>
          </div>

          {mode === "simple" ? (
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Certificate Asset Quality
                </label>
                <TooltipInfo id="tooltip-asset-quality">
                  Select the quality level for your certificate assets:
                  <br />
                  <br />
                  Low: 10 MB per certificate
                  <br />
                  Medium: 100 MB per certificate
                  <br />
                  High: 1000 MB per certificate
                </TooltipInfo>
              </div>
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Low</span>
                  <span className="text-sm">Medium</span>
                  <span className="text-sm">High</span>
                </div>
                <AirbnbSlider
                  slots={{ thumb: AirbnbThumbComponent }}
                  aria-label="Asset Quality"
                  value={
                    assetQuality === "low"
                      ? 1
                      : assetQuality === "medium"
                        ? 2
                        : 3
                  }
                  step={null}
                  valueLabelDisplay="auto"
                  min={1}
                  max={3}
                  marks={[{ value: 1 }, { value: 2 }, { value: 3 }]}
                  onChange={(event) => {
                    const value = Number(
                      (event.target as HTMLInputElement).value
                    );
                    if (value === 1) handleQualityChange("low");
                    else if (value === 2) handleQualityChange("medium");
                    else handleQualityChange("high");
                  }}
                />
                <div className="mt-4 text-sm text-content/60">
                  Total storage: {calculations.storageSize.toLocaleString()} MB
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Storage Size (MB)
                </label>
                <TooltipInfo id="tooltip-size-mb">
                  Total storage size needed in megabytes
                  <br />
                  <br />1 MB ={" "}
                  <span className="inline-flex items-center">
                    {pricing.perMbSize.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <img
                      className="mx-2 h-4 w-4"
                      src="/ogy_logo.svg"
                      alt="OGY Logo"
                    />
                  </span>
                </TooltipInfo>
              </div>
              <div className="rounded-full bg-surface border border-border px-4 py-2 flex justify-between items-center w-full">
                <input
                  type="number"
                  min="0"
                  className="form-input bg-surface w-full outline-none focus:outline-none focus:border-none border-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={calculations.storageSize || ""}
                  onChange={handleInputChange("storageSize")}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="text-xl font-semibold text-primary flex items-center">
            Total Price:{" "}
            {totalPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            <img className="mx-2 h-4 w-4" src="/ogy_logo.svg" alt="OGY Logo" />
            <span className="text-sm">
              ≈{" "}
              {(totalPrice * pricing.ogyUsdt).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USDT
            </span>
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            <span className="inline-flex items-center">
              1 USDT = {pricing.ogyUsdt}
              <img
                className="mx-2 h-4 w-4"
                src="/ogy_logo.svg"
                alt="OGY Logo"
              />
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
