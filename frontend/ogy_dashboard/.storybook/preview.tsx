import type { Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import "../theme/preset.css";
import "./storybook.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      enabled: false,
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      gcTime: Infinity,
      queryFn: () => {
        throw new Error(
          "Storybook: a query was triggered without seeded data. Use withMockedQueries to seed it."
        );
      },
    },
  },
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: "todo" },
  },
  decorators: [
    (Story, { parameters }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {parameters.layout === "fullscreen" ? (
            <Story />
          ) : (
            <div className="p-12">
              <Story />
            </div>
          )}
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};

export default preview;
