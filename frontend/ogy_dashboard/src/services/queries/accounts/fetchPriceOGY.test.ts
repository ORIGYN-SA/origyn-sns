import { beforeEach, describe, expect, it, vi } from "vitest";
import fetchPriceOGY from "./fetchPriceOGY";

const fetchOGYPriceFromICPSwap = vi.fn();
const getPriceHistory = vi.fn();

// Both price sources are on the network.
vi.mock("@services/icpswap/fetchOGYPriceFromICPSwap", () => ({
  default: () => fetchOGYPriceFromICPSwap(),
}));
vi.mock("@services/api/gldt/v1/endpoints", () => ({
  default: { getPriceHistory: () => getPriceHistory() },
}));

describe("fetchPriceOGY", () => {
  beforeEach(() => {
    fetchOGYPriceFromICPSwap.mockReset();
    getPriceHistory.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns the ICPSwap price without asking the GLDT API", async () => {
    fetchOGYPriceFromICPSwap.mockResolvedValue(0.00074);

    await expect(fetchPriceOGY()).resolves.toEqual({ ogyPrice: "0.00074" });
    expect(getPriceHistory).not.toHaveBeenCalled();
  });

  it("falls back to the newest daily price when ICPSwap fails", async () => {
    fetchOGYPriceFromICPSwap.mockRejectedValue(new Error("quote timed out"));
    getPriceHistory.mockResolvedValue([
      { date: "2026-11-14", price: 0.000687 },
      { date: "2026-11-15", price: 0.000739 },
      { date: "2026-11-16", price: 0.00074 },
    ]);

    await expect(fetchPriceOGY()).resolves.toEqual({ ogyPrice: "0.00074" });
  });

  it("rejects when ICPSwap fails and the GLDT API has no price", async () => {
    fetchOGYPriceFromICPSwap.mockRejectedValue(new Error("quote timed out"));
    getPriceHistory.mockResolvedValue([]);

    await expect(fetchPriceOGY()).rejects.toThrow(
      "api.gldt.org returned no OGY price"
    );
  });
});
