import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Data, Network, Options } from "vis-network/standalone/esm/vis-network";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import useFetchAccountTransactions from "@hooks/accounts/useFetchAccountTransactions";
import {
  Transaction,
  TransactionsDetails,
} from "@services/queries/accounts/fetchAccountTransactions";
import useThemeDetector from "@helpers/theme/useThemeDetector";
import { Card } from "@components/ui";
import { SearchIcon, CloseIcon } from "@components/ui/icons";

type TransactionsChartProps = {
  className?: string;
  id: string;
};

type Node = {
  id: string;
  count: number;
  amount: number;
  isTo: boolean;
  isInitialTrans: boolean;
  isFrom: boolean;
  toAmount: number;
  fromAmount: number;
  to: string;
  from: string;
};

const EDGE = {
  in: "#50BE8F",
  out: "#E84C25",
  inOut: "#00A2F7",
} as const;

const NODE_BG_LIGHT = {
  in: "#EBFFF6",
  out: "#FFE2DB",
  inOut: "#E5F6FF",
} as const;

const ROOT_NODE = {
  border: "#5D627B",
  background: "#8A92B8",
} as const;

const buildVisOptions = (): Options => ({
  nodes: {
    borderWidth: 1,
    chosen: false,
    font: {
      size: 18,
      face: "DM sans, system-ui, sans-serif",
      background: "none",
      align: "center",
      multi: false,
      vadjust: 0,
    },
  },
  edges: {
    chosen: false,
    font: {
      multi: "markdown",
      size: 18,
      bold: "true",
      face: "DM sans, system-ui, sans-serif",
    },
    smooth: false,
    width: 2,
  },
  interaction: {
    selectable: false,
    dragNodes: true,
    navigationButtons: true,
    zoomView: false,
  },
  physics: {
    enabled: true,
    barnesHut: {
      avoidOverlap: 0.9,
      gravitationalConstant: -20000,
      springLength: 280,
      springConstant: 0.07,
      damping: 1,
    },
    solver: "barnesHut",
    minVelocity: 5,
    maxVelocity: 10,
  },
});

const TransactionsChart = ({ id }: TransactionsChartProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [mapAmount] = useState(10);
  const darkTheme = useThemeDetector();
  const [data, setData] = useState<Data>();
  const [network, setNetwork] = useState<Network | null>(null);
  const [searchterm, setSearchterm] = useState("");

  const {
    data: accountTxs,
    isLoading,
    isError,
  } = useFetchAccountTransactions(id);

  const surfaceColor = darkTheme ? "#202020" : "#FFFFFF";
  const edgeLabelColor = darkTheme ? "#A0A0A0" : "#69737C";

  const colors = useMemo(
    () => ({
      in: {
        border: EDGE.in,
        color: EDGE.in,
        background: darkTheme ? surfaceColor : NODE_BG_LIGHT.in,
        highlight: {
          background: darkTheme ? surfaceColor : NODE_BG_LIGHT.in,
          border: EDGE.in,
        },
        inherit: false,
      },
      out: {
        border: EDGE.out,
        color: EDGE.out,
        background: darkTheme ? surfaceColor : NODE_BG_LIGHT.out,
        highlight: {
          background: darkTheme ? surfaceColor : NODE_BG_LIGHT.out,
          border: EDGE.out,
        },
        inherit: false,
      },
      inOut: {
        border: EDGE.inOut,
        color: EDGE.inOut,
        background: darkTheme ? surfaceColor : NODE_BG_LIGHT.inOut,
        highlight: {
          background: darkTheme ? surfaceColor : NODE_BG_LIGHT.inOut,
          border: EDGE.inOut,
        },
        inherit: false,
      },
    }),
    [darkTheme, surfaceColor]
  );

  const handleResetSearch = () => setSearchterm("");

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchterm(e.target.value);
  };

  const handleOnKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") e.preventDefault();
  };

  const generateData = (accountTxs: TransactionsDetails): Data => {
    const data = accountTxs.data;
    const total = accountTxs.total_transactions;

    const accounts = data
      ? data.reduce((res: { [key: string]: Node }, item, index) => {
          const result = res;
          const amount = parseFloat(item.amount.replace(/,/g, ""));

          if (item.from_owner === id && item.to_owner !== id) {
            result[`i${item.to_owner}`] = {
              ...result[`i${item.to_owner}`],
              isTo: true,
              toAmount: (res[`i${item.to_owner}`]?.toAmount || 0) + amount,
              amount: (res[`i${item.to_owner}`]?.amount || 0) + amount,
              count: (res[`i${item.to_owner}`]?.count || 0) + 1,
              to: item.to_owner,
              from: item.from_owner,
            };

            if (mapAmount > total && index === total - 1) {
              result[`i${item.to_owner}`].isInitialTrans = true;
            }
          }
          if (item.to_owner === id && item.from_owner !== id) {
            result[`o${item.from_owner}`] = {
              ...result[`o${item.from_owner}`],
              isFrom: true,
              fromAmount:
                (res[`o${item.from_owner}`]?.fromAmount || 0) + amount,
              amount: (res[`o${item.from_owner}`]?.amount || 0) + amount,
              count: (res[`o${item.from_owner}`]?.count || 0) + 1,
              to: item.to_owner,
              from: item.from_owner,
            };
            if (mapAmount > total && index === total - 1) {
              result[`o${item.from_owner}`].isInitialTrans = true;
            }
          }

          return result;
        }, {})
      : {};

    const _nodes = [
      ...Object.keys(accounts).map((k) => ({
        ...accounts[k],
        id: k,
        label: `${k.substring(1, 4)}...${k.substring(k.length - 3)}`,
        font: {
          color:
            colors[
              accounts[k].isInitialTrans
                ? "inOut"
                : accounts[k].isTo
                  ? "out"
                  : "in"
            ].border,
        },
        margin: 25,
        shape: "circle",
        color:
          colors[
            accounts[k].isInitialTrans
              ? "inOut"
              : accounts[k].isTo
                ? "out"
                : "in"
          ],
      })),
    ];

    const nodes = [
      {
        id: id,
        shape: "circle",
        label: `${id?.substring(0, 4)}...${id?.substring(id.length - 4)}`,
        margin: 25,
        font: {
          color: "#fff",
        },
        color: {
          border: ROOT_NODE.border,
          background: ROOT_NODE.background,
          highlight: {
            background: ROOT_NODE.background,
            border: ROOT_NODE.border,
          },
          inherit: false,
        },
      },
      ..._nodes,
    ];

    const edges = _nodes.map((node) => ({
      from: id,
      to: node.id,
      dashes: [8, 16],
      font: {
        color: edgeLabelColor,
        strokeWidth: 10,
        strokeColor: surfaceColor,
      },
      label:
        node.count > 1
          ? `     ${node.count} transactions \n ${roundAndFormatLocale({
              number: divideBy1e8(node.amount),
            })} OGY   `
          : `     ${roundAndFormatLocale({
              number: divideBy1e8(node.amount),
            })} OGY     `,
      title:
        node.isTo && node.isFrom
          ? `Out: ${roundAndFormatLocale({
              number: divideBy1e8(node.toAmount),
            })} \nIn: ${roundAndFormatLocale({
              number: divideBy1e8(node.fromAmount),
            })} \n Total: ${roundAndFormatLocale({
              number: divideBy1e8(Math.abs(node.amount)),
            })} OGY`
          : `Total: ${Math.abs(node.amount).toFixed(2)} OGY`,
      arrows: node.isTo && node.isFrom ? "to, from" : node.isTo ? "to" : "from",
      color:
        colors[node.isInitialTrans ? "inOut" : node.isTo ? "out" : "in"].border,
    }));

    return {
      nodes: nodes as Node[],
      edges,
    };
  };

  const filteredCount = useMemo(() => {
    if (!accountTxs?.data) return 0;
    if (!searchterm) return accountTxs.data.length;
    return accountTxs.data.filter((tx) => {
      if (tx.to_account !== null && tx.from_account !== null) {
        return (
          tx.to_account.includes(searchterm) ||
          tx.from_account.includes(searchterm)
        );
      }
      return false;
    }).length;
  }, [accountTxs, searchterm]);

  const showEmptyOverlay = !!searchterm && filteredCount === 0;

  useEffect(() => {
    if (accountTxs) {
      if (searchterm) {
        const searchedData = accountTxs?.data.filter((tx) => {
          if (tx.to_account !== null && tx.from_account !== null) {
            return (
              tx.to_account.includes(searchterm) ||
              tx.from_account.includes(searchterm)
            );
          }
        });
        setTimeout(() => {
          setData(
            generateData({
              data: searchedData as Transaction[],
              total_transactions: accountTxs?.total_transactions as number,
            })
          );
        }, 300);
      } else {
        setData(generateData(accountTxs));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountTxs, id, darkTheme, searchterm]);

  useEffect(() => {
    if (ref.current && data) {
      const instance = new Network(ref.current, data as Data, buildVisOptions());
      setNetwork(instance);
      return () => network?.destroy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, id, mapAmount]);

  useEffect(() => {
    if (network) {
      network.on("click", function (properties) {
        const accountId = network.getNodeAt({
          x: properties.event.srcEvent.offsetX,
          y: properties.event.srcEvent.offsetY,
        });
        if (accountId) {
          navigate(
            `/transaction-history/transactions/accounts/${accountId.toString().slice(1)}`
          );
          return;
        }
      });

      network.on("dragEnd", function () {
        network.unselectAll();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  return (
    <Card className="mt-16 !p-0 overflow-hidden">
      <header className="flex flex-col gap-4 px-6 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-charcoal text-[22px] font-semibold leading-none">
          Transaction Flow
        </h2>
        <form
          onKeyDown={handleOnKeyDown}
          autoComplete="off"
          className="flex items-center gap-2 w-full sm:w-[300px] h-10 rounded-full border border-border-strong bg-surface-1 px-4"
        >
          <SearchIcon className="text-muted shrink-0" />
          <input
            id={id}
            type="text"
            placeholder="Search transactions…"
            value={searchterm}
            onChange={handleOnChange}
            className="flex-1 bg-transparent text-sm text-content placeholder:text-muted outline-none focus:outline-none focus:ring-0 border-0 p-0"
          />
          {searchterm && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="rounded-full p-1 text-muted hover:bg-border"
              aria-label="Clear search"
            >
              <CloseIcon />
            </button>
          )}
        </form>
      </header>

      <div className="relative border-t border-border">
        <div
          ref={ref}
          className="h-[560px] md:h-[680px] lg:h-[800px] w-full p-6"
        />
        {isLoading && (
          <div
            aria-busy="true"
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-full w-full animate-pulse bg-muted/10" />
          </div>
        )}
        {isError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="text-sm text-muted">
              Couldn't load transaction data. Please try again.
            </p>
          </div>
        )}
        {showEmptyOverlay && !isLoading && !isError && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center pointer-events-none">
            <p className="text-sm text-muted">
              No transactions match this search.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-3">
        <EdgeKey color={EDGE.out} label="Out transaction" />
        <EdgeKey color={EDGE.in} label="In transaction" />
        <EdgeKey color={EDGE.inOut} label="Includes initial transaction" />
      </div>

      <div className="border-t border-border px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-3">
        <NodeKey
          borderColor={ROOT_NODE.border}
          fillColor={ROOT_NODE.background}
          label="Root account"
        />
        <NodeKey
          borderColor={EDGE.out}
          fillColor={NODE_BG_LIGHT.out}
          label="Account"
          sub="With transactions from root"
        />
        <NodeKey
          borderColor={EDGE.in}
          fillColor={NODE_BG_LIGHT.in}
          label="Account"
          sub="With transactions to root"
        />
        <NodeKey
          borderColor={EDGE.inOut}
          fillColor={NODE_BG_LIGHT.inOut}
          label="Account"
          sub="Made initial transaction"
        />
      </div>
    </Card>
  );
};

const EdgeKey = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-3">
    <span
      className="h-1 w-8 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
    <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">
      {label}
    </span>
  </div>
);

const NodeKey = ({
  borderColor,
  fillColor,
  label,
  sub,
}: {
  borderColor: string;
  fillColor: string;
  label: string;
  sub?: string;
}) => (
  <div className="flex items-start gap-3">
    <span
      className="mt-[3px] h-3 w-3 shrink-0 rounded-full border"
      style={{ borderColor, backgroundColor: fillColor }}
    />
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {sub && (
        <span className="text-[11px] leading-tight text-muted/80">{sub}</span>
      )}
    </div>
  </div>
);

export default TransactionsChart;
