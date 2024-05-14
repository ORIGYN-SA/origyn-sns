import { SortingState, PaginationState } from "@tanstack/react-table";

export interface ListParams {
  limit: number;
  offset: number;
  sorting: SortingState;
}

export interface IListProps {
  limit: number;
  offset: number;
  sorting?: SortingState;
  pagination?: PaginationState;
}
