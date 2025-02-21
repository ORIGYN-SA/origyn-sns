import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoaderSpin } from "@components/ui";
import { getActor } from "@amerej/artemis-react";
import { Principal } from "@dfinity/principal";
import { CollectionContainer } from "@components/collections/CollectionContainer";

type Category = {
  active: boolean;
  collection_count: bigint;
};

type Collection = {
  name: [] | [string];
  canister_id: Principal;
  locked_value_usd: [] | [bigint];
  is_promoted: boolean;
  category: [] | [string];
};

const CATEGORIES = ["Precious Metals", "Art", "Jewelry"];
const PAGE_SIZE = 10;

const Certificates = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: collections, isLoading } = useQuery({
    queryKey: ["collections", selectedCategory, currentPage],
    enabled: !!selectedCategory,
    queryFn: async () => {
      const actor = await getActor("collectionIndex", { isAnon: true });

      const response = await actor.get_collections({
        categories: [[selectedCategory]],
        offset: BigInt((currentPage - 1) * PAGE_SIZE),
        limit: BigInt(PAGE_SIZE),
      });

      return response.Ok;
    },
  });

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoaderSpin />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!selectedCategory ? (
        <div className="flex justify-center items-center gap-6">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className="p-6 bg-surface-2 rounded-xl shadow-lg hover:bg-surface-3 transition-colors duration-200 min-w-[200px]"
            >
              <h3 className="text-xl font-bold text-center">{category}</h3>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{selectedCategory}</h2>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-accent hover:text-accent/80"
            >
              Back to Categories
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collections?.collections.map((collection: Collection) => (
              <CollectionContainer
                key={collection.canister_id.toString()}
                name={collection.name[0] || "Unnamed Collection"}
                canisterId={collection.canister_id.toString()}
              />
            ))}
          </div>

          {collections && collections.total_pages > 1 && (
            <div className="flex justify-center items-center mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 mr-2 rounded-lg bg-surface-3 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="mx-4">
                Page {currentPage} of {collections.total_pages.toString()}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= Number(collections.total_pages)}
                className="px-4 py-2 ml-2 rounded-lg bg-surface-3 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Certificates;
