import { usePagination } from "@helpers/table/useTable";
import NeuronsList from "@pages/neurons/neurons-list/NeuronsList";

export const Neurons = () => {
  const [pagination, setPagination] = usePagination({
    pageSize: 10,
    pageIndex: 0,
  });
  // const [sorting, setSorting] = useSorting({});

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">Neurons</h1>
          <p className="mt-6 text-content/60">
            Holders of OGY tokens can directly influence the ORIGYN Network by
            staking their OGY and voting on proposals. By participating in the
            decision-making process, these staked token holders earn rewards.
          </p>
        </div>
      </div>
      <div className="mt-8 mb-16">
        <NeuronsList
          pagination={pagination}
          setPagination={setPagination}
          // sorting={sorting}
          // setSorting={{ setSorting }}
        />
      </div>
    </div>
  );
};
