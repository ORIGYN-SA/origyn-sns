import { Dispatch, SetStateAction, useState } from "react";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { useSearchParams } from "react-router-dom";

interface useTablePropsProps {
  pageSize?: number;
  pageIndex?: number;
  enablePagination?: boolean;
  id?: string;
  desc?: boolean;
}

export interface PaginationProps {
  pagination: PaginationState;
  sorting: SortingState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
  setSorting: Dispatch<SetStateAction<SortingState>>;
  enablePagination: boolean;
}

const useTableProps = ({
  pageSize = 10,
  pageIndex = 0,
  enablePagination = true,
  id = "",
  desc = true,
}: useTablePropsProps) => {
  const [searchParams] = useSearchParams();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex:
      enablePagination && Number(searchParams.get("pageIndex"))
        ? Number(searchParams.get("pageIndex")) - 1
        : pageIndex,
    pageSize:
      enablePagination && Number(searchParams.get("pageSize"))
        ? Number(searchParams.get("pageSize"))
        : pageSize,
  });

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: searchParams.get("id") ? (searchParams.get("id") as string) : id,
      desc: searchParams.get("desc")
        ? searchParams?.get("desc") === "true"
        : desc,
    },
  ]);

  return { pagination, setPagination, enablePagination, sorting, setSorting };
};

export default useTableProps;
