import { Dispatch, SetStateAction, useState } from "react";
import { PaginationState } from "@tanstack/react-table";
import { useSearchParams } from "react-router-dom";

interface useTablePropsProps {
  pageSize?: number;
  pageIndex?: number;
  enablePagination?: boolean;
}

export interface PaginationProps {
  pagination: PaginationState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
  enablePagination: boolean;
}

const useTableProps = ({
  pageSize = 10,
  pageIndex = 0,
  enablePagination = true,
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

  return { pagination, setPagination, enablePagination };
};

export default useTableProps;
