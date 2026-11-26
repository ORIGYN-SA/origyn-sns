import { useEffect, useState } from "react";
import { useAtom } from "jotai";

import "../styles/wallet.css";
import { useAuth } from "@auth/index";
import { useEvmGldtHistory } from "../data/evm";
import { addressUrl, NETS, type EvmNet } from "../evm/chains";
import { icpAccountId, useIcpHistory } from "../data/wallet";
import type { Collection } from "../icp/canisters";
import { toNumber } from "../lib/format";
import { useIsPhone } from "../lib/ui";
import { transferRequestAtom, useEvmDialog } from "../shell/state";
import { Hero } from "./Hero";
import { NftView } from "./NftView";
import { TokenList } from "./TokenList";
import { TransferDialog } from "./TransferDialog";
import { SwapDialog } from "./SwapDialog";
import { NftTransferDialog } from "./NftTransferDialog";
import { NftDetails } from "./NftDetails";
import { WalletPhone } from "./WalletPhone";
import { TxList, type TxView } from "./TxList";
import { GLDT_ICP, decimalsOf, digitsOf, priceOf, useWalletData, type WalletData, type WalletToken } from "./model";

type Fungible = Exclude<WalletToken, { kind: "nft" }>;
const GLDT_ICP_F: Fungible = { kind: "icp", sym: "GLDT" };

/** The selected token's history: from its ledger index, from the explorer feed (GLDT on Ethereum and
 * Base), or a link to the chain's explorer for the other EVM tokens. */
const useTxRows = (t: Fungible, data: WalletData): TxView => {
  const icp = useIcpHistory(t.kind === "icp" ? t.sym : "GLDT");
  const evmGldt = t.kind === "evm" && t.token.sym === "GLDT";
  const evm = useEvmGldtHistory(evmGldt ? data.evmAddress : undefined, t.kind === "evm" ? t.token.net : "ethereum");
  const dec = decimalsOf(t);
  if (t.kind === "icp") {
    if (data.icp?.kind !== "signedIn") return { state: "off" };
    const me = [t.sym === "ICP" ? icpAccountId(data.icp.principal) : data.icp.principal.toText()];
    if (icp.isError) return { state: "unavailable" };
    if (!icp.data) return { state: "loading" };
    return {
      state: "ready",
      me,
      rows: icp.data.map((r) => ({ key: String(r.id), kind: r.kind, from: r.from, to: r.to, amount: toNumber(r.amount, dec), at: r.at })),
    };
  }
  if (!data.evmAddress) return { state: "off" };
  if (!evmGldt) return { state: "external", href: addressUrl(t.token.net, data.evmAddress), scan: NETS[t.token.net].scanName };
  if (evm.isError) return { state: "unavailable" };
  if (!evm.data) return { state: "loading" };
  return {
    state: "ready",
    me: [data.evmAddress],
    rows: evm.data.map((r) => ({ key: r.key, kind: r.kind, from: r.from, to: r.to, amount: toNumber(r.amount, dec), at: r.at })),
  };
};

const TokenPanel = ({
  t,
  data,
  tx,
  onTransfer,
  onBurn,
  onMint,
}: {
  t: Fungible;
  data: WalletData;
  tx: ReturnType<typeof useTxRows>;
  onTransfer: () => void;
  onBurn: () => void;
  onMint: () => void;
}) => {
  const sym = t.kind === "icp" ? t.sym : t.token.sym;
  return (
    <>
      <Hero t={t} data={data} onTransfer={onTransfer} onBurn={onBurn} onMint={onMint} />
      <TxList view={tx} sym={sym} digits={digitsOf(t)} price={priceOf(data.prices, t)} />
    </>
  );
};

/** What the Wallet page has open on top of it. */
export type WalletDialog =
  | { kind: "none" }
  | { kind: "transfer"; token: Fungible }
  | { kind: "nftTransfer" }
  | { kind: "swap"; mode: "mint" | "burn"; net?: EvmNet }
  | { kind: "nft"; collection: Collection; id: bigint };

const WalletPage = () => {
  const data = useWalletData();
  const phone = useIsPhone();
  const { login } = useAuth();
  const evmDialog = useEvmDialog();
  const [selected, setSelected] = useState<WalletToken>(GLDT_ICP);
  const [dialog, setDialog] = useState<WalletDialog>({ kind: "none" });
  const [transferRequest, setTransferRequest] = useAtom(transferRequestAtom);

  // The account menu's Transfer item opens the transfer of the token on screen.
  useEffect(() => {
    if (transferRequest === 0) return;
    setTransferRequest(0);
    setDialog(selected.kind === "nft" ? { kind: "nftTransfer" } : { kind: "transfer", token: selected });
  }, [transferRequest, selected, setTransferRequest]);

  // A token of a network that disconnected is not shown any more: back to GLDT.
  useEffect(() => {
    if (selected.kind === "evm" && !data.evmAddress) setSelected(GLDT_ICP);
    if (selected.kind === "nft" && !data.icpIn) setSelected(GLDT_ICP);
  }, [selected, data.evmAddress, data.icpIn]);

  const onConnect = (net: "icp" | "ethereum" | "base") => {
    if (net === "icp") login();
    else evmDialog.open();
  };

  const tx = useTxRows(selected.kind === "nft" ? GLDT_ICP_F : selected, data);
  const close = () => setDialog({ kind: "none" });
  const dialogs = (
    <>
      {dialog.kind === "transfer" && <TransferDialog t={dialog.token} data={data} onClose={close} />}
      {dialog.kind === "swap" && (
        <SwapDialog data={data} initial={dialog.mode} initialNet={dialog.net} onConnectEvm={evmDialog.open} onClose={close} />
      )}
      {dialog.kind === "nftTransfer" && <NftTransferDialog data={data} onClose={close} />}
      {dialog.kind === "nft" && <NftDetails c={dialog.collection} id={dialog.id} onClose={close} />}
    </>
  );

  return (
    <>
      {phone ? (
        <WalletPhone
          data={data}
          selected={selected}
          tx={tx}
          onSelect={setSelected}
          onTransfer={(token) => setDialog({ kind: "transfer", token })}
          onNftTransfer={() => setDialog({ kind: "nftTransfer" })}
          onSwap={(mode, net) => setDialog({ kind: "swap", mode, net })}
          onOpenNft={(collection, id) => setDialog({ kind: "nft", collection, id })}
          onConnect={onConnect}
        />
      ) : (
        <div className="inner">
          <section className="lp" aria-label="Wallet">
            <div className="t60 f6 gold">Wallet</div>
            <div>
              <TokenList data={data} selected={selected} onPick={setSelected} onConnect={onConnect} />
            </div>
            {!data.icpIn && (
              <div className="lpconn">
                <button type="button" className="btn block" onClick={() => onConnect("icp")}>
                  Connect Wallet
                </button>
              </div>
            )}
          </section>
          <section className="rp" aria-label="Token">
            {selected.kind === "nft" ? (
              <NftView
                data={data}
                onTransfer={() => setDialog({ kind: "nftTransfer" })}
                onMint={() => setDialog({ kind: "swap", mode: "mint" })}
                onBurn={() => setDialog({ kind: "swap", mode: "burn" })}
                onOpen={(collection, id) => setDialog({ kind: "nft", collection, id })}
              />
            ) : (
              <TokenPanel
                t={selected}
                data={data}
                tx={tx}
                onTransfer={() => setDialog({ kind: "transfer", token: selected })}
                onBurn={() => setDialog({ kind: "swap", mode: "burn" })}
                onMint={() => setDialog({ kind: "swap", mode: "mint", net: selected.kind === "evm" ? selected.token.net : undefined })}
              />
            )}
          </section>
        </div>
      )}
      {dialogs}
    </>
  );
};

export default WalletPage;
