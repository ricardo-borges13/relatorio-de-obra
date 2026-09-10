"use client";

import { SerwistProvider } from "@serwist/next/react";
import type { ReactNode } from "react";

interface PwaProviderProps {
  children: ReactNode;
}

export default function PwaProvider({ children }: PwaProviderProps) {
  return (
    <SerwistProvider
      cacheOnNavigation
      disable={process.env.NODE_ENV !== "production"}
      options={{ scope: "/" }}
      reloadOnOnline={false}
      swUrl="/sw.js"
    >
      {children}
    </SerwistProvider>
  );
}
