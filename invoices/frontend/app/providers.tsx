"use client";

import * as React from "react";
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <QueryClientProvider client={queryClient}>
      {mounted && children}
    </QueryClientProvider>
  );
}

