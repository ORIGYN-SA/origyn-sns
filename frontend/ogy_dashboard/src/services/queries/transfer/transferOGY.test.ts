import { describe, expect, it, vi } from "vitest";
import transferOGY from "./transferOGY";

const icrc1_transfer = vi.fn();

// The ledger is on mainnet; everything between it and the caller is real.
vi.mock("@services/actor", () => ({
  getActor: async () => ({ icrc1_transfer }),
}));

const RECIPIENT =
  "d7pq3-zzibw-juyno-46vnq-wb5kb-jbfkw-jco3z-2id2i-qma3p-sprkj-6qe";

describe("transferOGY", () => {
  it("rejects with the ledger's reason when the ledger refuses the transfer", async () => {
    icrc1_transfer.mockResolvedValue({
      Err: { InsufficientFunds: { balance: 0n } },
    });

    await expect(
      transferOGY({ amount: 1_000_000_000n, to: RECIPIENT })
    ).rejects.toThrow(
      'OGY transfer failed: Err: {"InsufficientFunds":{"balance":"0"}}'
    );
  });

  it("resolves with the block index when the ledger accepts the transfer", async () => {
    icrc1_transfer.mockResolvedValue({ Ok: 1_379_700n });

    await expect(
      transferOGY({ amount: 1_000_000_000n, to: RECIPIENT })
    ).resolves.toBe(1_379_700n);
  });
});
