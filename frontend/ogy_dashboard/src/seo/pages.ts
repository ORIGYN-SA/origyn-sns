import type { PageSeo } from "../../../origyn_landing_page/src/seo/pages.ts";

export type DashboardPage = PageSeo & { indexable: boolean };

const page = ({
  id,
  path,
  title,
  description,
  indexable = true,
}: {
  id: string;
  path: string;
  title: string;
  description: string;
  indexable?: boolean;
}): DashboardPage => ({
  id: `dashboard-${id}`,
  path,
  keys: {
    title,
    description,
    imageAlt: title,
    cardTitle: title,
    cardLead: description,
  },
  card: { layout: "type" },
  siteLabel: "dashboard.origyn.com",
  indexable,
});

export const pages: DashboardPage[] = [
  page({
    id: "home",
    path: "",
    title: "nav.dashboard",
    description: "seo.dashboard",
  }),
  page({
    id: "transfers",
    path: "transfers",
    title: "seo.transfersTitle",
    description: "seo.transactions",
  }),
  page({
    id: "burns",
    path: "burns",
    title: "seo.burnsTitle",
    description: "dashboard.totalBurned.tooltipTitle",
  }),
  page({
    id: "governance",
    path: "governance",
    title: "governance.overview.title",
    description: "governance.tokensSection.paragraph1",
  }),
  page({
    id: "neurons",
    path: "governance/neurons",
    title: "neurons.list.title",
    description: "governance.features.stakeVote.description",
  }),
  page({
    id: "neuron",
    path: "governance/neurons/details",
    title: "neurons.details.title",
    description: "governance.features.stakeVote.description",
    indexable: false,
  }),
  page({
    id: "proposals",
    path: "proposals",
    title: "proposals.list.title",
    description: "governance.features.governCollectively.description",
  }),
  page({
    id: "proposal",
    path: "proposals/details",
    title: "proposals.list.title",
    description: "governance.features.governCollectively.description",
    indexable: false,
  }),
  page({
    id: "distribution",
    path: "token-distribution",
    title: "dashboard.tokenDistribution.title",
    description: "dashboard.circulationState.tooltip",
  }),
  page({
    id: "viewer",
    path: "viewer",
    title: "explorer.title",
    description: "explorer.subtitle",
  }),
  page({
    id: "certificates",
    path: "viewer/certificates",
    title: "explorer.certificatesPage.title",
    description: "explorer.subtitle",
  }),
  page({
    id: "certificate",
    path: "viewer/certificate/:canisterId/:tokenId",
    title: "explorer.detail.certificate",
    description: "explorer.subtitle",
  }),
  page({
    id: "collections",
    path: "viewer/collections",
    title: "explorer.collectionsPage.title",
    description: "explorer.subtitle",
  }),
  page({
    id: "collection",
    path: "viewer/collections/:canisterId",
    title: "explorer.collectionsPage.title",
    description: "explorer.subtitle",
  }),
  page({
    id: "nft-transaction",
    path: "viewer/transaction/:canisterId/:tokenId/:blockId",
    title: "explorer.transactionPage.title",
    description: "explorer.subtitle",
  }),
  page({
    id: "collector",
    path: "viewer/collectors/:principal",
    title: "explorer.collector.title",
    description: "explorer.subtitle",
  }),
  page({
    id: "transactions",
    path: "transaction-history",
    title: "transactions.history.title",
    description: "seo.transactions",
  }),
  page({
    id: "transaction",
    path: "transaction-history/transactions/:index",
    title: "transactions.details.title",
    description: "seo.transactions",
  }),
  page({
    id: "address",
    path: "transaction-history/transactions/accounts/:accountId",
    title: "transactions.accountDetails.title",
    description: "seo.transactions",
  }),
  page({
    id: "address-history",
    path: "transaction-history/transactions/accounts/:accountId/history",
    title: "transactions.history.title",
    description: "seo.transactions",
  }),
  page({
    id: "account",
    path: "account",
    title: "dashboard.cta.myAccount",
    description: "account.overview.manageDescription",
    indexable: false,
  }),
  page({
    id: "recovery",
    path: "recovery",
    title: "recovery.title",
    description: "recovery.description",
    indexable: false,
  }),
  page({
    id: "support",
    path: "support",
    title: "footer.support.contactSupport",
    description: "seo.support",
    indexable: false,
  }),
  page({
    id: "calculator",
    path: "calculator",
    title: "calculator.header.title",
    description: "calculator.header.description",
  }),
];

export const notFound = page({
  id: "not-found",
  path: "404",
  title: "notFound.title",
  description: "notFound.description",
  indexable: false,
});

export const matchPage = (path: string): DashboardPage => {
  const parts = path.replace(/^\/+|\/+$/g, "").split("/");
  return (
    pages.find((candidate) => {
      const pattern = candidate.path.split("/");
      return (
        pattern.length === parts.length &&
        pattern.every((part, i) => part.startsWith(":") || part === parts[i])
      );
    }) ?? notFound
  );
};
