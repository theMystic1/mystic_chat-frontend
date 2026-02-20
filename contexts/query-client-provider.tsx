// app/providers.tsx
"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const QueryProviders = ({ children }: { children: React.ReactNode }) => {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            gcTime: 20 * 60_000, // cache kept 5 mins
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

export default QueryProviders;
