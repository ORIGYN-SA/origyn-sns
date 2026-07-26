import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import {
  ApiNftAccountItem,
  ApiNftCollection,
  ApiNftOwnedItem,
  NftOwnedStatus,
} from "@services/api/gldt/v1/types";
import { collectionNamesById, toNftCard, NftCard } from "./mapNft";

interface PageParams {
  limit?: number;
  offset?: number;
}

const ONE_MINUTE = 60 * 1000;

type AccountNft = ApiNftAccountItem | ApiNftOwnedItem;

const useNftCards = (data?: {
  items?: AccountNft[];
  collections?: ApiNftCollection[];
}) =>
  useMemo(() => {
    const names = collectionNamesById(data?.collections);
    return (data?.items ?? []).map((nft) => toNftCard(nft, names));
  }, [data]);

export const useNftAccountStats = (principal: string | null) =>
  useQuery({
    queryKey: ["NFT_ACCOUNT_STATS", principal],
    queryFn: () => gldtEndpoints.getNftAccountStats(principal as string),
    enabled: principal !== null,
    staleTime: ONE_MINUTE,
    retry: 1,
  });

export const useNftAccountCollections = (principal: string | null) =>
  useQuery({
    queryKey: ["NFT_ACCOUNT_COLLECTIONS", principal],
    queryFn: () => gldtEndpoints.getNftAccountCollections(principal as string),
    enabled: principal !== null,
    staleTime: ONE_MINUTE,
  });

export const useNftAccountNfts = (
  principal: string | null,
  params: PageParams = {}
) => {
  const query = useQuery({
    queryKey: ["NFT_ACCOUNT_NFTS", principal, params],
    queryFn: () => gldtEndpoints.getNftAccountNfts(principal as string, params),
    enabled: principal !== null,
    placeholderData: keepPreviousData,
    staleTime: ONE_MINUTE,
  });

  const cards: NftCard[] = useNftCards(query.data);

  return { ...query, cards, total: query.data?.total ?? 0 };
};

export const useNftOwnerNfts = (
  principal: string | null,
  params: PageParams & { status?: NftOwnedStatus } = {}
) => {
  const query = useQuery({
    queryKey: ["NFT_OWNER_NFTS", principal, params],
    queryFn: () => gldtEndpoints.getNftOwnerNfts(principal as string, params),
    enabled: principal !== null,
    placeholderData: keepPreviousData,
    staleTime: ONE_MINUTE,
  });

  const cards: NftCard[] = useNftCards(query.data);

  return { ...query, cards, total: query.data?.total ?? 0 };
};

export const useNftAccountPastNfts = (
  principal: string | null,
  params: PageParams = {}
) => {
  const query = useQuery({
    queryKey: ["NFT_ACCOUNT_PAST_NFTS", principal, params],
    queryFn: () =>
      gldtEndpoints.getNftAccountPastNfts(principal as string, params),
    enabled: principal !== null,
    placeholderData: keepPreviousData,
    staleTime: ONE_MINUTE,
  });

  const cards: NftCard[] = useNftCards(query.data);

  return { ...query, cards, total: query.data?.total ?? 0 };
};
