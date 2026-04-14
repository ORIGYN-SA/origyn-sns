import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Decorator } from "@storybook/react-vite";

export const withMockedQueries =
  (seed: (qc: QueryClient) => void): Decorator =>
  (Story) => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          enabled: false,
          retry: false,
          refetchOnWindowFocus: false,
          staleTime: Infinity,
          gcTime: Infinity,
          queryFn: () => {
            throw new Error(
              "Storybook: a query was triggered without seeded data."
            );
          },
        },
      },
    });
    seed(qc);
    return (
      <QueryClientProvider client={qc}>
        <Story />
      </QueryClientProvider>
    );
  };
