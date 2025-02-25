import { useQuery } from "@tanstack/react-query";
import { LoaderSpin } from "@components/ui";
import { getActor } from "@amerej/artemis-react";
import { formatNumber } from "../../utils/format";
import {
  CurrencyDollarIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

type OverallStats = {
  total_collections: bigint;
  total_value_locked: bigint;
};

type Category = {
  active: boolean;
  collection_count: bigint;
};

const CATEGORIES = ["Precious Metals", "Art", "Jewlery"];

const formatCategoryForUrl = (category: string): string => {
  return category.toLowerCase().replace(/\s+/g, "-");
};

const CategoryIcon = ({ category }: { category: string }) => {
  const getBackgroundImage = (category: string) => {
    switch (category) {
      case "Precious Metals":
        return "url('/cat_gold_logo.png')";
      case "Art":
        return "url('/cat_art_logo.png')";
      case "Jewlery":
        return "url('/cat_jewlery_logo.png')";
      default:
        return "url('/images/default-bg.jpg')";
    }
  };

  return (
    <div
      className="absolute inset-0 bg-cover bg-center rounded-xl"
      style={{
        backgroundImage: getBackgroundImage(category),
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/50 rounded-xl" />
    </div>
  );
};

const Categories = () => {
  const navigate = useNavigate();

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const actor = await getActor("collectionIndex", { isAnon: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await actor.get_categories();
      if (!response.Ok) throw new Error("Failed to fetch categories");
      return Object.fromEntries(response.Ok) as Record<string, Category>;
    },
  });

  const { data: overallStats, isLoading: isLoadingOverallStats } = useQuery({
    queryKey: ["collectionsStats"],
    queryFn: async () => {
      const actor = await getActor("collectionIndex", { isAnon: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await actor.get_overall_stats(null);
      if (!response.Ok) throw new Error("Failed to fetch overall stats");
      return response.Ok as OverallStats;
    },
  });

  if (isLoadingOverallStats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoaderSpin />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 md:py-12 lg:py-16 px-4">
      <div className="text-center mb-8 md:mb-12 lg:mb-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2">
          Certificates
        </h1>
        <p className="text-base md:text-lg text-text-2 px-4">
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

      {overallStats && (
        <div className="flex flex-col md:flex-row gap-4 mb-8 md:mb-12 lg:mb-16 max-w-2xl mx-auto">
          <div className="relative bg-surface border border-border p-4 rounded-xl flex-1">
            <div className="flex">
              <div className="shrink-0 w-12 md:w-16 h-12 md:h-16 flex items-center justify-center bg-surface-2 rounded-xl">
                <RectangleStackIcon width={24} height={24} />
              </div>
              <div className="ml-4 md:ml-6">
                <div className="text-xl md:text-2xl font-semibold">
                  {formatNumber(Number(overallStats.total_collections))}
                </div>
                <div className="text-xs md:text-sm text-content/60">
                  Total Collections
                </div>
              </div>
            </div>
          </div>

          <div className="relative bg-surface border border-border p-4 rounded-xl flex-1">
            <div className="flex">
              <div className="shrink-0 w-12 md:w-16 h-12 md:h-16 flex items-center justify-center bg-surface-2 rounded-xl">
                <CurrencyDollarIcon width={24} height={24} />
              </div>
              <div className="ml-4 md:ml-6">
                <div className="text-xl md:text-2xl font-semibold">
                  ${formatNumber(Number(overallStats.total_value_locked))}
                </div>
                <div className="text-xs md:text-sm text-content/60">
                  Total Value Locked
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {isLoadingCategories ? (
          <div className="col-span-full flex justify-center">
            <LoaderSpin />
          </div>
        ) : (
          CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() =>
                navigate(`/certificates/${formatCategoryForUrl(category)}`)
              }
              className="relative p-6 bg-surface-2 rounded-xl shadow-lg hover:bg-surface-3 hover:scale-105 transition-all duration-500 h-[250px] md:h-[300px] lg:h-[350px] w-full overflow-hidden"
            >
              <CategoryIcon category={category} />
              <div className="relative flex flex-col items-center gap-2 h-full justify-end pb-4">
                <h3 className="text-lg md:text-xl font-bold text-center text-white">
                  {category}
                </h3>
                <p className="text-xs md:text-sm text-white/80">
                  {categories && categories[category]
                    ? `${formatNumber(Number(categories[category].collection_count))} ${Number(categories[category].collection_count) === 1 ? "collection" : "collections"}`
                    : "0 collections"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Categories;
