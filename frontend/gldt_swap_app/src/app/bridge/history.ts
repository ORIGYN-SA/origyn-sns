import { useQuery } from "@tanstack/react-query";
import { decodeEventLog, keccak256, toBytes, type Hash } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";

import { fetchBridgeOperation, fetchBridgeOperations, type Operation, type OperationDetails } from "../data/api";
import { gldtBridgeAbi } from "../evm/abi";
import { GLDT_TOKEN, NETS, type EvmNet } from "../evm/chains";
import { wagmiConfig } from "../evm/config";
import type { BridgeNet } from "./calls";

export const netOf = (chain: Operation["from_chain"]): BridgeNet => chain;

/** The user's bridge transfers in every direction, newest first, refreshed while any is moving. */
export const useBridgeHistory = (addresses: string[]) =>
  useQuery({
    queryKey: ["bridge-history", ...addresses],
    enabled: addresses.length > 0,
    queryFn: () =>
      fetchBridgeOperations({
        address: addresses,
        kind: ["icp_to_evm", "nft_to_evm", "evm_to_icp", "evm_to_evm"],
        offset: 0,
        limit: 50,
      }),
    refetchInterval: (q) => (q.state.data?.data.some((o) => o.status === "pending") ? 10_000 : false),
  });

/** One transfer with its steps, polled until it settles. Null while the API has not seen it yet. */
export const useBridgeOperation = (id: string | null) =>
  useQuery({
    queryKey: ["bridge-op", id],
    enabled: !!id,
    retry: false,
    queryFn: async (): Promise<OperationDetails | null> => {
      if (!id) return null;
      try {
        return await fetchBridgeOperation(id);
      } catch (e) {
        if (e instanceof Error && / 404 /.test(e.message)) return null;
        throw e;
      }
    },
    refetchInterval: (q) => (q.state.data && q.state.data.status !== "pending" ? false : 5_000),
  });

/** LayerZero's OFTSent event: its first indexed topic is the message GUID. */
const OFT_SENT_TOPIC = keccak256(toBytes("OFTSent(bytes32,uint32,address,uint256,uint256)"));

/** The bridge API's id of a transfer started on an EVM chain, read from its transaction's logs:
 * `in-<chain>-<burn id>` for a burn to ICP, `lz-<guid>` for a LayerZero send. */
export const opIdOfEvmTx = async (net: EvmNet, hash: Hash): Promise<string | null> => {
  const receipt = await waitForTransactionReceipt(wagmiConfig, { chainId: NETS[net].chainId, hash });
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== GLDT_TOKEN.toLowerCase()) continue;
    try {
      const ev = decodeEventLog({ abi: gldtBridgeAbi, data: log.data, topics: log.topics });
      if (ev.eventName === "BurnedToIcp") return `in-${net}-${ev.args.burnId}`;
    } catch {
      // Not one of the bridge events; a LayerZero send is read below.
    }
    if (log.topics[0] === OFT_SENT_TOPIC && log.topics[1]) return `lz-${log.topics[1]}`;
  }
  return null;
};

