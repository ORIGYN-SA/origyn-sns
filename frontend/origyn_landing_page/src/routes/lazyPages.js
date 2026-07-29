import { lazy } from "react";

const lazyWithPreload = (importPage) => {
  let pagePromise;
  const loadPage = () => {
    pagePromise ??= importPage();
    return pagePromise;
  };
  const Page = lazy(loadPage);
  Page.preload = loadPage;
  return Page;
};

export const UseCasesPage = lazyWithPreload(
  () => import("@/pages/UseCasesPage"),
);
export const HelpCenterPage = lazyWithPreload(
  () => import("@/pages/HelpCenterPage"),
);
export const IntegratorPage = lazyWithPreload(
  () => import("@/pages/IntegratorPage"),
);
export const IntegratorJoinPage = lazyWithPreload(
  () => import("@/pages/IntegratorJoinPage"),
);
export const TokenPage = lazyWithPreload(() => import("@/pages/TokenPage"));
export const AIPage = lazyWithPreload(() => import("@/pages/AIPage"));
export const DPPPage = lazyWithPreload(() => import("@/pages/DPPPage"));
