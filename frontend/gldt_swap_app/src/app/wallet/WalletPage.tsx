import { useEffect, useState } from "react";
import { useAtom } from "jotai";

import "../styles/wallet.css";
import { useAuth } from "@auth/index";
import { useEvmHistory } from "../data/evm";
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
import { TxList, type TxRow } from "./TxList";
import { GLDT_ICP, decimalsOf, digitsOf, priceOf, useWalletData, type WalletData, type WalletToken } from "./model";

type Fungible = Exclude<WalletToken, { kind: "nft" }>;

/** The selected token's history as list rows, from its ledger index or from api.gldt.org. */
const useTxRows = (t: Fungible, data: WalletData): { state: "off" | "loading" | "ready" | "unavailable"; rows: TxRow[]; me: string[] } => {
  const icpSym = t.kind === "icp" ? t.sym : "GLDT";
  const icp = useIcpHistory(icpSym);
  const evm = useEvmHistory(t.kind === "evm" ? data.evmAddress : undefined, t.kind === "evm" ? t.token.net : "ethereum", t.kind === "evm" ? t.token.sym : "GLDT");
  const dec = decimalsOf(t);
  if (t.kind === "icp") {
    if (data.icp?.kind !== "signedIn") return { state: "off", rows: [], me: [] };
    const me = [t.sym === "ICP" ? icpAccountId(data.icp.principal) : data.icp.principal.toText()];
    if (icp.isError) return { state: "unavailable", rows: [], me };
    if (!icp.data) return { state: "loading", rows: [], me };
    return {
      state: "ready",
      me,
      rows: icp.data.map((r) => ({ key: String(r.id), kind: r.kind, from: r.from, to: r.to, amount: toNumber(r.amount, dec), at: r.at })),
    };
  }
  if (!data.evmAddress) return { state: "off", rows: [], me: [] };
  const me = [data.evmAddress];
  if (evm.isError) return { state: "unavailable", rows: [], me };
  if (!evm.data) return { state: "loading", rows: [], me };
  return {
    state: "ready",
    me,
    rows: evm.data.map((r) => ({ key: r.key, kind: r.kind, from: r.from, to: r.to, amount: toNumber(r.amount, dec), at: r.at })),
  };
};

const TokenPanel = ({ t, data, onTransfer, onBurn }: { t: Fungible; data: WalletData; onTransfer: () => void; onBurn: () => void }) => {
  const tx = useTxRows(t, data);
  const sym = t.kind === "icp" ? t.sym : t.token.sym;
  return (
    <>
      <Hero t={t} data={data} onTransfer={onTransfer} onBurn={onBurn} />
      <TxList state={tx.state} rows={tx.rows} me={tx.me} sym={sym} digits={digitsOf(t)} price={priceOf(data.prices, t)} />
    </>
  );
};

/** What the Wallet page has open on top of it. */
export type WalletDialog =
  | { kind: "none" }
  | { kind: "transfer"; token: Fungible }
  | { kind: "nftTransfer" }
  | { kind: "swap"; mode: "mint" | "burn" }
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
  }, [selected, data.evmAddress]);

  const onConnect = (net: "icp" | "ethereum" | "base") => {
    if (net === "icp") login();
    else evmDialog.open();
  };

  if (phone) return null;

  return (
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
            onTransfer={() => setDialog({ kind: "transfer", token: selected })}
            onBurn={() => setDialog({ kind: "swap", mode: "burn" })}
          />
        )}
      </section>
      {dialog.kind === "transfer" && (
        <TransferDialog t={dialog.token} data={data} onClose={() => setDialog({ kind: "none" })} />
      )}
      {dialog.kind === "swap" && (
        <SwapDialog data={data} initial={dialog.mode} onClose={() => setDialog({ kind: "none" })} />
      )}
      {dialog.kind === "nftTransfer" && <NftTransferDialog data={data} onClose={() => setDialog({ kind: "none" })} />}
      {dialog.kind === "nft" && (
        <NftDetails c={dialog.collection} id={dialog.id} onClose={() => setDialog({ kind: "none" })} />
      )}
    </div>
  );
};

export default WalletPage;
