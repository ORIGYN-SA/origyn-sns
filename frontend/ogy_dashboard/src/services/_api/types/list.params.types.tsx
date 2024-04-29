import { SortingState } from "@tanstack/react-table";

export interface ListParams {
  limit: number;
  offset: number;
  sorting: SortingState;
}
