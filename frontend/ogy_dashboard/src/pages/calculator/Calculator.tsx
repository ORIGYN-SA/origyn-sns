import React, { useState, useEffect } from "react";
import { usePricingData } from "../../hooks/calculator/usePricingData";
import { TooltipInfo } from "@components/ui";

const Calculator: React.FC = () => {
  const { data: pricing, loading, error } = usePricingData();
  const [calculations, setCalculations] = useState({
    collections: 0,
    storage: 0,
    certificates: 0,
    certificateUpdates: 0,
    storageSize: 0,
  });

  const [totalPrice, setTotalPrice] = useState(0);

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
          <p className="mt-6 text-content/60">
            Use the ORIGYN NFT calculator to estimate the costs of putting all
            your data securely on-chain.
          </p>
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
                The number of collections you want to create and deploy
                on-chain.
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
                Number of Storage Units
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
                Number of Certificates
              </label>
              <TooltipInfo id="tooltip-certificates-count">
                The total number of certificates to be minted.
                <br />
                <br />1 certificate (NFT) minted ={" "}
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
                Number of Certificate Updates
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
