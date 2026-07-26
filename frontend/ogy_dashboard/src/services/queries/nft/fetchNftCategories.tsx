import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import {
  ApiNftCategoryCatalogEntry,
  ApiNftCollection,
} from "@services/api/gldt/v1/types";

const PAGE_SIZE = 100;

const fetchAllCollections = async (): Promise<ApiNftCollection[]> => {
  const first = await gldtEndpoints.getNftCollections({ limit: PAGE_SIZE });
  const items = [...first.items];

  for (let offset = PAGE_SIZE; offset < first.total; offset += PAGE_SIZE) {
    const page = await gldtEndpoints.getNftCollections({
      limit: PAGE_SIZE,
      offset,
    });
    items.push(...page.items);
  }

  return items;
};

const fetchNftCategories = async (): Promise<ApiNftCategoryCatalogEntry[]> => {
  const [catalog, collections] = await Promise.all([
    gldtEndpoints.getNftCategoriesCatalog(),
    fetchAllCollections(),
  ]);

  const populated = new Set(
    collections
      .filter((collection) => collection.total_tokens > 0)
      .flatMap((collection) => collection.categories)
  );

  return catalog.filter((category) => populated.has(category.name));
};

export default fetchNftCategories;
