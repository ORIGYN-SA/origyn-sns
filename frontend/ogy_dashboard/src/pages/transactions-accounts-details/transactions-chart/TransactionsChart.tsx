import { useEffect, useRef, useState, KeyboardEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Data, Network, Options } from "vis-network/standalone/esm/vis-network";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import useFetchAccountTransactions from "@hooks/accounts/useFetchAccountTransactions";
import {
  Transaction,
  TransactionsDetails,
} from "@services/queries/accounts/fetchAccountTransactions";
import useThemeDetector from "@helpers/theme/useThemeDetector";

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

const options: Options = {
  nodes: {
    borderWidth: 1,
    font: {
      size: 18,
      face: "Montserrat, arial",
      background: "none",
      align: "center",
      multi: false,
      vadjust: 0,
    },
  },
  edges: {
    font: {
      multi: "markdown",
      size: 18,
      bold: "true",
      face: "Montserrat, arial",
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
};

const TransactionsChrart = ({ id }: TransactionsChartProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [mapAmount] = useState(10);
  const darkTheme = useThemeDetector();
  // const [transactions, setTransactions] = useState<any>();
  const [data, setData] = useState<Data>();
  const [network, setNetwork] = useState<Network | null>(null);

  const colors = {
    in: {
      border: "#50BE8F",
      color: "#50BE8F",
      background: darkTheme ? "#202020" : "#EBFFF6",
      highlight: {
        background: darkTheme ? "#202020" : "#EBFFF6",
        border: "#50BE8F",
      },
      inherit: false,
    },
    out: {
      border: "#E84C25",
      color: "#E84C25",
      background: darkTheme ? "#202020" : "#FFE2DB",
      highlight: {
        background: darkTheme ? "#202020" : "#FFE2DB",
        border: "#E84C25",
      },
      inherit: false,
    },
    inOut: {
      border: "#00A2F7",
      color: "#00A2F7",
      background: darkTheme ? "#202020" : "#E5F6FF",
      highlight: {
        background: darkTheme ? "#202020" : "#E5F6FF",
        border: "#00A2F7",
      },
      inherit: false,
    },
  };

  // TODO: add loading status
  const { data: accountTxs, isError } = useFetchAccountTransactions(id);

  const { register, reset } = useForm({
    mode: "onChange",
    shouldUnregister: true,
  });

  const [searchterm, setSearchterm] = useState("");

  const handleResetSearch = () => {
    setSearchterm("");
    reset();
  };

  const handleOnChange = (e: ChangeEvent) => {
    const value = (e?.target as HTMLTextAreaElement)?.value;
    if (value === "") {
      handleResetSearch();
    } else {
      setSearchterm(value);
    }
  };

  const handleOnKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.key === "Enter" && e.preventDefault();
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
              //result[`f${item.from_owner}`] = { isInitialTrans: true, isFrom: true, fromAmount: amount, amount: amount, count: 1, to: item.to_owner, from: item.from_owner };
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
          border: "#5D627B",
          background: "#8A92B8",
          highlight: { background: "#8A92B8", border: "#5D627B" },
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
        color: darkTheme ? "#ffffff" : "#a6a6a6",
        strokeWidth: 10,
        strokeColor: darkTheme ? "#202020" : "#fff",
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
      const instance = new Network(ref.current, data as Data, options);
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
            `/explorer/transactions/accounts/${accountId.toString().slice(1)}`
          );
          return;
        }
        // if (properties.items.length && properties.items[0]?.edgeId) {
        //   console.log(
        //     data?.edges?.find(
        //       ({ id }: { id: string }) => id === properties.items[0]?.edgeId
        //     )
        //   );
        //   return;
        //   // handleTransactionsOpen(data.edges.find(({ id }) => id === properties.items[0]?.edgeId));
        // }
      });

      network.on("dragEnd", function () {
        network.unselectAll();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  return (
    <div className="relative mt-12 bg-surface text-content rounded-xl border border-border">
      <div className="absolute top-10 left-10 z-10 w-96">
        <form
          onKeyDown={handleOnKeyDown as () => void}
          className="rounded-xl bg-surface-3 border border-border px-3 py-1 flex justify-between items-center w-full"
          autoComplete="off"
        >
          <input
            id={id}
            type="text"
            placeholder="Search in transactions..."
            {...(register(id),
            {
              onChange: (e) => handleOnChange(e),
              value: searchterm,
            })}
            className="form-input bg-surface-3 w-full outline-none focus:outline-none focus:border-none border-0 focus:ring-0"
          />
          {searchterm === "" ? (
            <div
              onClick={handleResetSearch}
              className="rounded-full bg-surface-3 mr-2 p-1"
            ></div>
          ) : (
            <button
              onClick={handleResetSearch}
              className="rounded-full bg-surface-3 mr-2 p-1"
            >
              <XMarkIcon className="h-7 w-7" aria-hidden="true" />
            </button>
          )}
        </form>
      </div>
      <div style={{ height: 800, width: "100%", padding: "32px" }} ref={ref} />
      <div>{isError && "Error occured when loading the data"}</div>
      <div className="flex flex-col justify-between">
        <div className="p-6 flex gap-12  border-border border-t border-b">
          <div className="flex gap-4 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="33"
              height="16"
              viewBox="0 0 33 16"
              fill="none"
            >
              <path
                d="M32.3536 8.35356C32.5488 8.1583 32.5488 7.84171 32.3536 7.64645L29.1716 4.46447C28.9763 4.26921 28.6597 4.26921 28.4645 4.46447C28.2692 4.65973 28.2692 4.97632 28.4645 5.17158L31.2929 8.00001L28.4645 10.8284C28.2692 11.0237 28.2692 11.3403 28.4645 11.5355C28.6597 11.7308 28.9763 11.7308 29.1716 11.5355L32.3536 8.35356ZM-8.74228e-08 8.5L2 8.5L2 7.5L8.74228e-08 7.5L-8.74228e-08 8.5ZM6 8.5L10 8.5L10 7.5L6 7.5L6 8.5ZM14 8.5L18 8.5L18 7.5L14 7.5L14 8.5ZM22 8.5L26 8.5L26 7.5L22 7.5L22 8.5ZM30 8.50001L32 8.50001L32 7.50001L30 7.50001L30 8.50001ZM32.7071 8.70711C33.0976 8.31659 33.0976 7.68342 32.7071 7.2929L26.3431 0.928937C25.9526 0.538412 25.3195 0.538412 24.9289 0.928937C24.5384 1.31946 24.5384 1.95263 24.9289 2.34315L30.5858 8.00001L24.9289 13.6569C24.5384 14.0474 24.5384 14.6805 24.9289 15.0711C25.3195 15.4616 25.9526 15.4616 26.3431 15.0711L32.7071 8.70711ZM-1.74846e-07 9L2 9L2 7L1.74846e-07 7L-1.74846e-07 9ZM6 9L10 9L10 7L6 7L6 9ZM14 9L18 9L18 7L14 7L14 9ZM22 9L26 9L26 7L22 7L22 9ZM30 9.00001L32 9.00001L32 7.00001L30 7.00001L30 9.00001Z"
                fill="#E84C25"
              />
            </svg>
            <p>Out Transaction</p>
          </div>
          <div className="flex gap-4 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="33"
              height="16"
              viewBox="0 0 33 16"
              fill="none"
            >
              <path
                d="M32.3536 8.35356C32.5488 8.1583 32.5488 7.84171 32.3536 7.64645L29.1716 4.46447C28.9763 4.26921 28.6597 4.26921 28.4645 4.46447C28.2692 4.65973 28.2692 4.97632 28.4645 5.17158L31.2929 8.00001L28.4645 10.8284C28.2692 11.0237 28.2692 11.3403 28.4645 11.5355C28.6597 11.7308 28.9763 11.7308 29.1716 11.5355L32.3536 8.35356ZM-8.74228e-08 8.5L2 8.5L2 7.5L8.74228e-08 7.5L-8.74228e-08 8.5ZM6 8.5L10 8.5L10 7.5L6 7.5L6 8.5ZM14 8.5L18 8.5L18 7.5L14 7.5L14 8.5ZM22 8.5L26 8.5L26 7.5L22 7.5L22 8.5ZM30 8.50001L32 8.50001L32 7.50001L30 7.50001L30 8.50001ZM32.7071 8.70711C33.0976 8.31659 33.0976 7.68342 32.7071 7.2929L26.3431 0.928937C25.9526 0.538412 25.3195 0.538412 24.9289 0.928937C24.5384 1.31946 24.5384 1.95263 24.9289 2.34315L30.5858 8.00001L24.9289 13.6569C24.5384 14.0474 24.5384 14.6805 24.9289 15.0711C25.3195 15.4616 25.9526 15.4616 26.3431 15.0711L32.7071 8.70711ZM-1.74846e-07 9L2 9L2 7L1.74846e-07 7L-1.74846e-07 9ZM6 9L10 9L10 7L6 7L6 9ZM14 9L18 9L18 7L14 7L14 9ZM22 9L26 9L26 7L22 7L22 9ZM30 9.00001L32 9.00001L32 7.00001L30 7.00001L30 9.00001Z"
                fill="#50BE8F"
              />
            </svg>
            <p>In Transaction</p>
          </div>
          <div className="flex gap-4 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="33"
              height="16"
              viewBox="0 0 33 16"
              fill="none"
            >
              <path
                d="M32.3536 8.35356C32.5488 8.1583 32.5488 7.84171 32.3536 7.64645L29.1716 4.46447C28.9763 4.26921 28.6597 4.26921 28.4645 4.46447C28.2692 4.65973 28.2692 4.97632 28.4645 5.17158L31.2929 8.00001L28.4645 10.8284C28.2692 11.0237 28.2692 11.3403 28.4645 11.5355C28.6597 11.7308 28.9763 11.7308 29.1716 11.5355L32.3536 8.35356ZM-8.74228e-08 8.5L2 8.5L2 7.5L8.74228e-08 7.5L-8.74228e-08 8.5ZM6 8.5L10 8.5L10 7.5L6 7.5L6 8.5ZM14 8.5L18 8.5L18 7.5L14 7.5L14 8.5ZM22 8.5L26 8.5L26 7.5L22 7.5L22 8.5ZM30 8.50001L32 8.50001L32 7.50001L30 7.50001L30 8.50001ZM32.7071 8.70711C33.0976 8.31659 33.0976 7.68342 32.7071 7.2929L26.3431 0.928937C25.9526 0.538412 25.3195 0.538412 24.9289 0.928937C24.5384 1.31946 24.5384 1.95263 24.9289 2.34315L30.5858 8.00001L24.9289 13.6569C24.5384 14.0474 24.5384 14.6805 24.9289 15.0711C25.3195 15.4616 25.9526 15.4616 26.3431 15.0711L32.7071 8.70711ZM-1.74846e-07 9L2 9L2 7L1.74846e-07 7L-1.74846e-07 9ZM6 9L10 9L10 7L6 7L6 9ZM14 9L18 9L18 7L14 7L14 9ZM22 9L26 9L26 7L22 7L22 9ZM30 9.00001L32 9.00001L32 7.00001L30 7.00001L30 9.00001Z"
                fill="#00A2F7"
              />
            </svg>
            <p>Includes Initial Transaction</p>
          </div>
        </div>
        <div className="p-6 flex gap-16">
          <div className="flex gap-4 items-center">
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                border: "1px solid #5D627B",
                background: "#8A92B8",
              }}
            />
            <p className="text-sm font-semibold">ROOT ACCOUNT</p>
          </div>
          <div className="flex gap-4 items-center">
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                border: "1px solid #E84C25",
                background: "#FFE2DB",
              }}
            />
            <div className="flex flex-col">
              <p className="text-sm font-semibold">ACCOUNT</p>
              <p className="text-xs">(with transactions from root account)</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                border: "1px solid #50BE8F",
                background: "#EBFFF6",
              }}
            />
            <div className="flex flex-col">
              <p className="text-sm font-semibold">ACCOUNT</p>
              <p className="text-xs">(with transactions to root account)</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                border: "1px solid #00A2F7",
                background: "#E5F6FF",
              }}
            />
            <div className="flex flex-col">
              <p className="text-sm font-semibold">ACCOUNT</p>
              <p className="text-xs">(that made initial transaction)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsChrart;
