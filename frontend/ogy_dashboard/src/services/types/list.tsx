import { SortingState, PaginationState } from "@tanstack/react-table";

export interface IListProps {
  limit: number;
  offset: number;
  sorting?: SortingState;
  pagination?: PaginationState;
}
