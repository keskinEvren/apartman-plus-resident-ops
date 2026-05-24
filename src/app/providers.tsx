"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          headers() {
            if (typeof window !== "undefined") {
              const token = localStorage.getItem("auth-token");
              const siteId = localStorage.getItem("active-site-id");
              const headers: Record<string, string> = {};
              if (token) {
                headers["authorization"] = `Bearer ${token}`;
              }
              if (siteId) {
                headers["x-site-id"] = siteId;
              }
              return headers;
            }
            return {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
