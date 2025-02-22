import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { getActor } from "@amerej/artemis-react";
import { Principal } from "@dfinity/principal";
import { CollectionContainer } from "@components/certificates/CollectionContainer";
import { CollectionCard } from "@components/certificates/CollectionCard";

type Collection = {
  name: [] | [string];
  canister_id: Principal;
  locked_value_usd: [] | [bigint];
  is_promoted: boolean;
  category: [] | [string];
};

const PAGE_SIZE = 20;

const deformatCategoryFromUrl = (urlCategory: string): string => {
  return urlCategory
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Collections = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const deformattedCategory = category ? deformatCategoryFromUrl(category) : "";

  const { data: collections, isLoading } = useQuery({
    queryKey: ["collections", deformattedCategory, currentPage],
    queryFn: async () => {
      const actor = await getActor("collectionIndex", { isAnon: true });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await actor.get_collections({
        categories: [[deformattedCategory]],
        offset: BigInt((currentPage - 1) * PAGE_SIZE),
        limit: BigInt(PAGE_SIZE),
      });

      if (!response.Ok) throw new Error("Failed to fetch collections");

      return response.Ok as {
        collections: Collection[];
        total_pages: bigint;
      };
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <CollectionCard.Skeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-bold mb-2">Certificates</h1>
        <p className="text-lg text-text-2">
          Browse and explore tokenized real-world assets across different
          categories using the{" "}
          <a
            href="https://github.com/ORIGYN-SA/origyn_nft"
            target="_blank"
            className="text-accent hover:text-accent/80"
          >
            ORIGYN NFT
          </a>{" "}
          standard.
        </p>
      </div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          {category && (
            <button
              onClick={() => navigate("/certificates")}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
          )}
          <h1 className="text-2xl font-semibold">
            {category ? deformattedCategory : "All Collections"}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {collections?.collections.map((collection: Collection) => (
          <CollectionContainer
            key={collection.canister_id.toString()}
            canisterId={collection.canister_id.toString()}
          />
        ))}
      </div>

      {collections && collections.total_pages > 1 && (
        <div className="flex justify-center items-center mt-8">
          <button
            onClick={() => {
              window?.scrollTo({ top: 0 });
              setCurrentPage((p) => Math.max(1, p - 1));
            }}
            disabled={currentPage === 1}
            className="px-4 py-2 mr-2 rounded-lg bg-surface-3 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="mx-4">
            Page {currentPage} of {collections.total_pages.toString()}
          </span>
          <button
            onClick={() => {
              window?.scrollTo({ top: 0 });
              setCurrentPage((p) => p + 1);
            }}
            disabled={currentPage >= Number(collections.total_pages)}
            className="px-4 py-2 ml-2 rounded-lg bg-surface-3 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Collections;
