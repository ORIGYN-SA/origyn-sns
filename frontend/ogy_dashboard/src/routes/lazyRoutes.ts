import { ComponentType, LazyExoticComponent, lazy } from "react";

type Factory<T extends ComponentType<any>> = () => Promise<{ default: T }>;
type Preloadable<T extends ComponentType<any>> = LazyExoticComponent<T> & {
  preload: () => Promise<{ default: T }>;
};

const lazyWithPreload = <T extends ComponentType<any>>(
  factory: Factory<T>
): Preloadable<T> => {
  const Component = lazy(factory) as Preloadable<T>;
  Component.preload = factory;
  return Component;
};

export const Dashboard = lazyWithPreload(() => import("@pages/dashboard"));
export const Governance = lazyWithPreload(() =>
  import("@pages/governance").then((m) => ({ default: m.Governance }))
);
export const Neurons = lazyWithPreload(() =>
  import("@pages/neurons/Neurons").then((m) => ({ default: m.Neurons }))
);
export const NeuronsDetails = lazyWithPreload(() =>
  import("@pages/neurons-details/NeuronsDetails").then((m) => ({
    default: m.NeuronsDetails,
  }))
);
export const Proposals = lazyWithPreload(() =>
  import("@pages/proposals/Proposals").then((m) => ({ default: m.Proposals }))
);
export const ProposalsDetails = lazyWithPreload(() =>
  import("@pages/proposals-details/ProposalsDetails").then((m) => ({
    default: m.ProposalsDetails,
  }))
);
export const TokenDistribution = lazyWithPreload(() =>
  import("@pages/token-distribution").then((m) => ({
    default: m.TokenDistribution,
  }))
);
export const Explorer = lazyWithPreload(() =>
  import("@pages/explorer/Explorer").then((m) => ({ default: m.Explorer }))
);
export const TransactionsDetails = lazyWithPreload(() =>
  import("@pages/transactions-details/TransactionsDetails").then((m) => ({
    default: m.TransactionsDetails,
  }))
);
export const TransactionsAccountsDetails = lazyWithPreload(
  () => import("@pages/transactions-accounts-details")
);
export const TransactionsAccountHistory = lazyWithPreload(
  () => import("@pages/transactions-accounts-history")
);
export const Account = lazyWithPreload(() =>
  import("@pages/account/index").then((m) => ({ default: m.Account }))
);
export const Recovery = lazyWithPreload(() => import("@pages/recovery/Recovery"));
export const Support = lazyWithPreload(() => import("@pages/support"));
export const Calculator = lazyWithPreload(
  () => import("@pages/calculator/Calculator")
);
export const TopTransfersAndBurnsFull = lazyWithPreload(
  () =>
    import("@pages/dashboard/top-transfers-and-burns/TopTransfersAndBurnsFull")
);

const PRELOAD_BY_PATH: Record<string, () => Promise<unknown>> = {
  "/": Dashboard.preload,
  "/governance": Governance.preload,
  "/calculator": Calculator.preload,
  "/account": Account.preload,
  "/proposals": Proposals.preload,
  "/token-distribution": TokenDistribution.preload,
  "/explorer": Explorer.preload,
  "/recovery": Recovery.preload,
  "/support": Support.preload,
};

export const preloadRoute = (path: string) => {
  const fn = PRELOAD_BY_PATH[path];
  if (fn) fn().catch(() => {});
};
