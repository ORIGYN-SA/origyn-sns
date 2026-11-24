import { ArrowDown, CopySm, TX_ICON, TxIcon } from "../icons";
import { fmt, shortDate } from "../lib/format";
import { useCopy } from "../lib/ui";

/** One transaction as the wallet lists it, whatever its chain. `from`/`to` null is the minting
 * account. */
export type TxRow = {
  key: string;
  kind: "Transfer" | "Approve" | "Mint" | "Burn";
  from: string | null;
  to: string | null;
  /** In whole tokens. */
  amount: number;
  at: number;
};

const MINTER = "Minting account";

/** The design shows 6 + 4 characters of an EVM address and 12 + 12 of anything else. */
const cut = (a: string): [string, string] => (a.startsWith("0x") ? [a.slice(0, 6), a.slice(-4)] : [a.slice(0, 12), a.slice(-12)]);

const AddrCell = ({ text }: { text: string | null }) => {
  const copy = useCopy();
  const full = text ?? MINTER;
  const [a, b] = text ? cut(text) : [MINTER, ""];
  return (
    <div className="w-tcn">
      <span className="adr lg tip" data-tip={full}>
        <span className="adri">
          <span className="a1">{a}</span>
          {b && <span className="a2">…</span>}
          {b && <span className="a3">{b}</span>}
        </span>
        {text && (
          <button type="button" className="cpb" aria-label="Copy" onClick={() => copy(text)}>
            <CopySm />
          </button>
        )}
      </span>
    </div>
  );
};

export const kindIcon = (kind: TxRow["kind"], credit: boolean): string =>
  kind === "Transfer" ? (credit ? TX_ICON.In : TX_ICON.Out) : TX_ICON[kind];

/** The Transactions section of a token: placeholder while logged out, then the rows. */
export const TxList = ({
  state,
  rows,
  me,
  sym,
  digits,
  price,
}: {
  state: "off" | "loading" | "ready" | "unavailable";
  rows: TxRow[];
  /** The viewer's own addresses: a row to one of them is a credit. */
  me: string[];
  sym: string;
  digits: number;
  price: number | null;
}) => (
  <div className="w-sec">
    <div className="w-mb16">Transactions</div>
    {state === "off" && (
      <div className="w-tph">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className="w-tpr">
              <div className="w-phi">
                <div className="w-phg">
                  <div className="phc w-o20" />
                  <div className="phb w-h5 w-q20" />
                </div>
                <div className="phb w-h5 w-q20" />
              </div>
            </div>
          </div>
        ))}
        <div className="fade96 fadebg" />
      </div>
    )}
    {state === "loading" && <div>Loading...</div>}
    {state === "unavailable" && (
      <div className="emptyb">
        <div>Transactions can't be shown right now</div>
      </div>
    )}
    {state === "ready" && rows.length === 0 && (
      <div className="emptyb">
        <div>No transactions found</div>
      </div>
    )}
    {state === "ready" && rows.length > 0 && (
      <div className="w-txl">
        {rows.map((r) => {
          const credit = r.to !== null && me.some((m) => m.toLowerCase() === r.to?.toLowerCase());
          return (
            <div key={r.key}>
              <div className="txr">
                <div className="txg w-txk">
                  <div className="kic">
                    <TxIcon d={kindIcon(r.kind, credit)} />
                  </div>
                  <div className="txb">
                    <div className="txk">{r.kind}</div>
                    <div className="txs">
                      <span className="txd">{shortDate(r.at)}</span>
                    </div>
                  </div>
                </div>
                <div className="t14 w-txm">
                  <div className="w-txln">
                    <AddrCell text={r.from} />
                    <div className="w-fc">
                      <ArrowDown className="rotm90" />
                    </div>
                    <AddrCell text={r.to} />
                  </div>
                </div>
                <div className="txv">
                  <div className={`txa ${credit ? "ok" : "err"}`}>
                    {credit ? "+" : "−"}
                    {fmt(r.amount, digits)} {sym}
                  </div>
                  <div className="txu">{price === null ? "" : "$" + fmt(r.amount * price)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div />
        <div className="w-txf">
          <div>
            <div>No more transactions found</div>
          </div>
        </div>
      </div>
    )}
  </div>
);
