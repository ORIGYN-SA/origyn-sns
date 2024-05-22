import { usePagination } from "@helpers/table/useTable";
import ProposalsList from "@pages/proposals/proposals-list/ProposalsList";

export const Proposals = () => {
  const [pagination, setPagination] = usePagination({
    pageSize: 10,
    pageIndex: 0,
  });
  // const [sorting] = useSorting({});

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">Proposals</h1>
          <p className="mt-6 text-content/60">
            Holders of OGY tokens can directly influence the ORIGYN Network by
            staking their OGY and voting on proposals. By participating in the
            decision-making process, these staked token holders earn rewards.
          </p>
        </div>
      </div>
      <div className="my-16">
        <ProposalsList
          pagination={pagination}
          setPagination={setPagination}
          // sorting={sorting}
          // setSorting={{ setSorting }}
        />
      </div>
    </div>
  );
};
