import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Connect2ICProvider from "@providers/Connect2ICProvider";
import { Toaster } from "react-hot-toast";
import "@amerej/connect2ic-core/style.css";
import App from "./App.tsx";
import { colors as themeColors } from "@theme/preset";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Toaster
      position="bottom-center"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        style: {
          background: themeColors.surface[2],
          color: themeColors.content,
        },
        // success: {
        //   duration: 3000,
        // },
        error: {
          duration: 4000,
        },
      }}
    />
    <Connect2ICProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Connect2ICProvider>
  </React.StrictMode>
);
