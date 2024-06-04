import { useQuery, QueryClient, UseQueryResult } from "@tanstack/react-query";
import {
  useLoaderData,
  // defer,
  // Await,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";

import fetchOneAccountQuery, {
  AccountParams,
} from "@services/queries/accounts/fetchOneAccountQuery";
import {
  Network,
  Options,
} from "vis-network/standalone/esm/vis-network";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import Skeleton from "react-loading-skeleton";
import { useEffect, useRef, useState } from "react";
import useFetchAccountTransactions from "@hooks/accounts/useFetchAccaountTransactions";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import { useCanister } from "@connect2ic/react";

// export const loader = async () => {
//   const dataProposals = new Promise((resolve) => {
//     setTimeout(() => {
//       resolve([{ name: "State", value: "Dissolving" }]);
//     }, 300);
//   });

//   return defer({
//     dataProposals: await dataProposals,
//   });
// };
const options: Options = {
  nodes: {
    font: {
      color: '#ffffff',
      size: 14, // px
      face: 'Montserrat, arial',
      background: 'none',
      strokeWidth: 0, // px
      strokeColor: '#ffffff',
      align: 'center',
      multi: false,
      vadjust: 0,
      bold: {
        color: '#343434',
        size: 14, // px
        face: 'Montserrat, arial',
        vadjust: 0,
        mod: 'bold'
      },
    },
  },
  edges: {
    font: {
      face: 'Montserrat',
    },
    width: 2
  },
  interaction: {
    selectable: false,
    dragNodes: false,
    navigationButtons: true,
    zoomView: false,
  },
  physics: {
    // solver: 'repulsion',
    // stabilization: {
    //   iterations: 200,

    // },
    barnesHut: {
      theta: 0.1,
      avoidOverlap: 0.7,
      //springLength: 100,
      //springConstant: 0.01,
      gravitationalConstant: -12000,
      //centralGravity: 5,
      //springConstant: 0.1,
    },
    minVelocity: 5,
    maxVelocity: 10,
  },
};

const colors = {
  in: {
    border: "#0AB57F",
    color: "#0AB57F",
    background: "#F7FFFC",
  },
  out: {
    border: "#FB7474",
    color: "#FB7474",
    background: "#FFF4F4",
  },
  inOut: {
    border: "#74D1EF",
    color: "#74D1EF",
    background: "#EDFBFF",
  },
}


const loader =
  (queryClient: QueryClient) =>
    async ({ params }: { params: AccountParams }) => {
      const query = fetchOneAccountQuery({ id: params.id });
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    };

export const TransactionsAccountsDetails = () => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [network, addNetwork] = useState<Network | null>(null);
  const [mapAmount, setMapAmount] = useState<any>(100);
  const [transactions, setTransactions] = useState<any>();
  const handleOnClickBack = () => {
    navigate(-1);
  };

  const initialData = useLoaderData() as Awaited<
    ReturnType<ReturnType<typeof loader>>
  >;

  const params = useParams();

  const { data, isError, isLoading, isSuccess } = useFetchAccountTransactions(params.id || '');

  const generateDataFromNodes = (nodes: any, parentNodeId: any, initialData = {}) => ({
    nodes: [initialData, ...nodes],
    edges: nodes.map((node: any) => ({
      from: parentNodeId,
      to: node.id,
      dashes: [1, 4],
      font: {
        multi: "markdown",
        color: "#1A1D1E", // isDarktheme ? "#1A1D1E" : "#525252"
        strokeWidth: 0,
        strokeColor: "#1A1D1E", // isDarktheme ? "#1A1D1E" : "#525252",
      },
      label: node.count > 1 ? `     ${node.count} transactions \n ${node.amount.toFixed(2)} OGY   ` : `     ${node.amount.toFixed(2)} OGY     `,
      title: node.isTo && node.isFrom ? `Out: ${node.toAmount} \nIn: ${node.fromAmount} \n Total: ${Math.abs(node.amount.toFixed(2))} OGY` : `Total: ${Math.abs(node.amount.toFixed(2))} OGY`,
      arrows: node.isTo && node.isFrom ? "to, from" : (node.isTo ? "to" : "from"),
      color: colors[node.isInitialTrans ? "inOut" : (node.isTo ? "out" : "in")]
    })),
  });

  useEffect(() => {

    if (ref.current && data.accountTransactions) {
    
      const hp = data.accountTransactions.data;
      const total = data.accountTransactions.total_transactions;

      const accounts = hp.reduce((res, item, index) => {
        const result = res;
        const amount = parseFloat(item.amount.replace(/,/g, ""));

        if (item.from_owner === params.id && item.to_owner !== params.id) {
          result[`i${item.to_owner}`] = { ...result[`i${item.to_owner}`], isTo: true, toAmount: (res[`i${item.to_owner}`]?.toAmount || 0) + (amount), amount: (res[`i${item.to_owner}`]?.amount || 0) + amount, count: (res[`i${item.to_owner}`]?.count || 0) + 1, to: item.to_owner, from: item.from_owner };

          if (mapAmount > total && index === (total - 1)) {
            result[`i${item.to_owner}`].isInitialTrans = true;
            console.log("IsInit");
          }
        }
        if (item.to_owner === params.id && item.from_owner !== params.id) {

          result[`o${item.from_owner}`] = { ...result[`o${item.from_owner}`], isFrom: true, fromAmount: (res[`o${item.from_owner}`]?.fromAmount || 0) + (amount), amount: (res[`o${item.from_owner}`]?.amount || 0) + amount, count: (res[`o${item.from_owner}`]?.count || 0) + 1, to: item.to_owner, from: item.from_owner };
          if (mapAmount > total && index === (total - 1)) {
            //result[`f${item.from_owner}`] = { isInitialTrans: true, isFrom: true, fromAmount: amount, amount: amount, count: 1, to: item.to_owner, from: item.from_owner };
            result[`o${item.from_owner}`].isInitialTrans = true;
            console.log("IsInit");
          }
        }

        return (result)
      }, {})

      const initialData = generateDataFromNodes(
        [
          ...(Object.keys(accounts).map((k) => ({
            ...accounts[k],
            id: k,
            label: `${k.substring(1, 4)}...${k.substring(k.length - 3)}`,
            font: {
              color: colors[accounts[k].isInitialTrans ? "inOut" : (accounts[k].isTo ? "out" : "in")].border
            },
            margin: 25,
            shape: "circle",
            borderWidth: 2,
            //mass: 15 - Math.pow(accounts[k].count, 1 / 3),
            color: colors[accounts[k].isInitialTrans ? "inOut" : (accounts[k].isTo ? "out" : "in")]
          }))),
        ],
        params.id,
        {
          id: params.id,
          shape: "circle",
          label: `${params?.id?.substring(0, 4)}...${params?.id?.substring(params.id.length - 4)}`,
          margin: 20,
          physics: false,
          borderWidth: 2,
          color: {
            border: "#5D627B",
            background: "#5D627B",
          },
        }
      );

      const instance = new Network(ref.current, initialData, options);
      setTransactions(initialData);
      addNetwork(instance);
    }
    return () => network?.destroy();
  }, [data]);

  return (
    <>
      <div className="container mx-auto pt-8 pb-16 px-4">
        <div className="div div-col xl:div-row items-center justify-between py-8">
          <div className="div div-col xl:div-row xl:justify-center items-center gap-4 xl:gap-8">
            <ArrowLeftIcon
              className="h-8 w-8 hover:cursor-pointer"
              onClick={handleOnClickBack}
            />
            <div className="div div-col items-center xl:items-start">
              <div className="text-sm">Explorer</div>
              <div className="text-3xl font-bold mb-4 xl:mb-0">
                OGY account
              </div>
            </div>
          </div>
        </div>
        <div className="grid xl:grid-cols-3 mt-8 bg-surface rounded-xl border border-border">
          <div className="div div-col text-center xl:text-start xl:col-span-2 rounded-t-xl xl:rounded-tr-none xl:rounded-s-lg p-6 bg-surface">
            <div className="mb-4">
              <div className="text-content/60">ID</div>
              <div className="font-bold break-all">{data?.accountData?.id}</div>
            </div>
            <div className="mb-4">
              <div className="text-content/60">Owner</div>
              <div className="font-bold break-all">{data?.accountData?.owner}</div>
            </div>
            <div className="mb-4">
              <div className="text-content/60">Subaccount</div>
              <div className="font-bold break-all">
                {data?.accountData && (
                  data?.accountData?.subaccount
                || AccountIdentifier.fromPrincipal({principal: Principal.fromText(data?.accountData?.id || ""),}).toHex()
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-flow-row xl:border-l border-border">
            <div className="xl:col-span-1 rounded-tr-none xl:rounded-tr-lg p-6 bg-surface div items-center justify-center border-t border-border xl:border-none">
              <div className="div div-col items-center">
                <div className="font-semibold mb-4">Balance</div>
                <div className="mt-4 flex items-center text-2xl font-semibold">
                  {isSuccess && (
                    <>
                      <img src="/ogy_logo.svg" alt="OGY Logo" />
                      <span className="ml-2 mr-3">{
                        roundAndFormatLocale({
                          number: divideBy1e8(data?.accountData?.balance),
                        })}</span>
                      <span className="text-content/60">OGY</span>
                    </>
                  )}
                  {(isLoading || isError) && <Skeleton className="w-64" />}
                </div>
              </div>
            </div>
            <div className="xl:col-span-1 rounded-b-lg xl:rounded-bl-none xl:rounded-br-lg border-t border-border p-6 bg-surface-2">
              <div className="div div-col items-center">
                <div className="mb-1">
                  <span className="text-sm text-content/60">Historical max balance</span>
                  <span className="">{1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 bg-surface rounded-xl border border-border">
          <div style={{ height: 600, width: "100%" }} ref={ref} />
          <div className="flex flex-col justify-between">
            <div className="p-6 flex gap-12  border-border border-t border-b">
              <div className="flex gap-4 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="33" height="16" viewBox="0 0 33 16" fill="none">
                  <path d="M32.3536 8.35356C32.5488 8.1583 32.5488 7.84171 32.3536 7.64645L29.1716 4.46447C28.9763 4.26921 28.6597 4.26921 28.4645 4.46447C28.2692 4.65973 28.2692 4.97632 28.4645 5.17158L31.2929 8.00001L28.4645 10.8284C28.2692 11.0237 28.2692 11.3403 28.4645 11.5355C28.6597 11.7308 28.9763 11.7308 29.1716 11.5355L32.3536 8.35356ZM-8.74228e-08 8.5L2 8.5L2 7.5L8.74228e-08 7.5L-8.74228e-08 8.5ZM6 8.5L10 8.5L10 7.5L6 7.5L6 8.5ZM14 8.5L18 8.5L18 7.5L14 7.5L14 8.5ZM22 8.5L26 8.5L26 7.5L22 7.5L22 8.5ZM30 8.50001L32 8.50001L32 7.50001L30 7.50001L30 8.50001ZM32.7071 8.70711C33.0976 8.31659 33.0976 7.68342 32.7071 7.2929L26.3431 0.928937C25.9526 0.538412 25.3195 0.538412 24.9289 0.928937C24.5384 1.31946 24.5384 1.95263 24.9289 2.34315L30.5858 8.00001L24.9289 13.6569C24.5384 14.0474 24.5384 14.6805 24.9289 15.0711C25.3195 15.4616 25.9526 15.4616 26.3431 15.0711L32.7071 8.70711ZM-1.74846e-07 9L2 9L2 7L1.74846e-07 7L-1.74846e-07 9ZM6 9L10 9L10 7L6 7L6 9ZM14 9L18 9L18 7L14 7L14 9ZM22 9L26 9L26 7L22 7L22 9ZM30 9.00001L32 9.00001L32 7.00001L30 7.00001L30 9.00001Z" fill="#FB7474" />
                </svg>
                <p>Out Transaction</p>
              </div>
              <div className="flex gap-4 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="33" height="16" viewBox="0 0 33 16" fill="none">
                  <path d="M32.3536 8.35356C32.5488 8.1583 32.5488 7.84171 32.3536 7.64645L29.1716 4.46447C28.9763 4.26921 28.6597 4.26921 28.4645 4.46447C28.2692 4.65973 28.2692 4.97632 28.4645 5.17158L31.2929 8.00001L28.4645 10.8284C28.2692 11.0237 28.2692 11.3403 28.4645 11.5355C28.6597 11.7308 28.9763 11.7308 29.1716 11.5355L32.3536 8.35356ZM-8.74228e-08 8.5L2 8.5L2 7.5L8.74228e-08 7.5L-8.74228e-08 8.5ZM6 8.5L10 8.5L10 7.5L6 7.5L6 8.5ZM14 8.5L18 8.5L18 7.5L14 7.5L14 8.5ZM22 8.5L26 8.5L26 7.5L22 7.5L22 8.5ZM30 8.50001L32 8.50001L32 7.50001L30 7.50001L30 8.50001ZM32.7071 8.70711C33.0976 8.31659 33.0976 7.68342 32.7071 7.2929L26.3431 0.928937C25.9526 0.538412 25.3195 0.538412 24.9289 0.928937C24.5384 1.31946 24.5384 1.95263 24.9289 2.34315L30.5858 8.00001L24.9289 13.6569C24.5384 14.0474 24.5384 14.6805 24.9289 15.0711C25.3195 15.4616 25.9526 15.4616 26.3431 15.0711L32.7071 8.70711ZM-1.74846e-07 9L2 9L2 7L1.74846e-07 7L-1.74846e-07 9ZM6 9L10 9L10 7L6 7L6 9ZM14 9L18 9L18 7L14 7L14 9ZM22 9L26 9L26 7L22 7L22 9ZM30 9.00001L32 9.00001L32 7.00001L30 7.00001L30 9.00001Z" fill="#0AB57F" />
                </svg>
                <p>In Transaction</p>
              </div>
              <div className="flex gap-4 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="33" height="16" viewBox="0 0 33 16" fill="none">
                  <path d="M32.3536 8.35356C32.5488 8.1583 32.5488 7.84171 32.3536 7.64645L29.1716 4.46447C28.9763 4.26921 28.6597 4.26921 28.4645 4.46447C28.2692 4.65973 28.2692 4.97632 28.4645 5.17158L31.2929 8.00001L28.4645 10.8284C28.2692 11.0237 28.2692 11.3403 28.4645 11.5355C28.6597 11.7308 28.9763 11.7308 29.1716 11.5355L32.3536 8.35356ZM-8.74228e-08 8.5L2 8.5L2 7.5L8.74228e-08 7.5L-8.74228e-08 8.5ZM6 8.5L10 8.5L10 7.5L6 7.5L6 8.5ZM14 8.5L18 8.5L18 7.5L14 7.5L14 8.5ZM22 8.5L26 8.5L26 7.5L22 7.5L22 8.5ZM30 8.50001L32 8.50001L32 7.50001L30 7.50001L30 8.50001ZM32.7071 8.70711C33.0976 8.31659 33.0976 7.68342 32.7071 7.2929L26.3431 0.928937C25.9526 0.538412 25.3195 0.538412 24.9289 0.928937C24.5384 1.31946 24.5384 1.95263 24.9289 2.34315L30.5858 8.00001L24.9289 13.6569C24.5384 14.0474 24.5384 14.6805 24.9289 15.0711C25.3195 15.4616 25.9526 15.4616 26.3431 15.0711L32.7071 8.70711ZM-1.74846e-07 9L2 9L2 7L1.74846e-07 7L-1.74846e-07 9ZM6 9L10 9L10 7L6 7L6 9ZM14 9L18 9L18 7L14 7L14 9ZM22 9L26 9L26 7L22 7L22 9ZM30 9.00001L32 9.00001L32 7.00001L30 7.00001L30 9.00001Z" fill="#74D1EF" />
                </svg>
                <p>Includes Initial Transaction</p>
              </div>
            </div>
            <div className="p-6 flex gap-16">
              <div className="flex gap-4 items-center">
                <div style={{ width: 16, height: 16, borderRadius: 8, border: "1px solid #5D627B", background: "#8A92B8" }} />
                <p className="text-sm font-semibold">ROOT ACCOUNT</p>
              </div>
              <div className="flex gap-4 items-center">
                <div style={{ width: 16, height: 16, borderRadius: 8, border: "1px solid #FB7474", background: "#FFF4F4" }} />
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">ACCOUNT</p>
                  <p className="text-xs">(with transactions from root account)</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div style={{ width: 16, height: 16, borderRadius: 8, border: "1px solid #0AB57F", background: "#F7FFFC" }} />
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">ACCOUNT</p>
                  <p className="text-xs">(with transactions to root account)</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div style={{ width: 16, height: 16, borderRadius: 8, border: "1px solid #74D1EF", background: "#EDFBFF" }} />
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">ACCOUNT</p>
                  <p className="text-xs">(that made initial transaction)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

TransactionsAccountsDetails.loader = loader;
