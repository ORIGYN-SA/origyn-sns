import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Connect2ICProvider from "@providers/Connect2ICProvider";
import "@connect2ic/core/style.css";
import App from "./App.tsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Connect2ICProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Connect2ICProvider>
  </React.StrictMode>
);
