"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

function clearAuthAndRedirect() {
  localStorage.removeItem("auth-token");
  localStorage.removeItem("active-site-id");
  localStorage.removeItem("active-membership-id");
  document.cookie = "auth-token=; path=/; max-age=0";
  window.location.href = "/login";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              // Don't retry on 401
              if (error?.data?.code === "UNAUTHORIZED") return false;
              return failureCount < 2;
            },
          },
          mutations: {
            onError: (error: any) => {
              if (error?.data?.code === "UNAUTHORIZED") {
                clearAuthAndRedirect();
              }
            },
          },
        },
      }),
  );
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
              const membershipId = localStorage.getItem("active-membership-id");
              const headers: Record<string, string> = {};
              if (token) {
                headers["authorization"] = `Bearer ${token}`;
              }
              if (siteId) {
                headers["x-site-id"] = siteId;
              }
              if (membershipId) {
                headers["x-membership-id"] = membershipId;
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
