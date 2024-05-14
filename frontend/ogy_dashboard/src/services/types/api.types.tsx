import { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";

export type ApiServiceErr = unknown;

export type MutOpt<Response, TVariables = unknown> = UseMutationOptions<
  Response,
  ApiServiceErr,
  TVariables,
  unknown
>;

export type QueryOptions<Response, TVariables = unknown> = UseQueryOptions<
  Response,
  ApiServiceErr,
  TVariables,
  unknown[]
>;
