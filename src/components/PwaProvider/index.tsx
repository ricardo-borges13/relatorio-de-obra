"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

interface PwaProviderProps {
  children: ReactNode;
}

export default function PwaProvider({ children }: PwaProviderProps) {
  return (
    <SerwistProvider
      cacheOnNavigation
      disable={process.env.NODE_ENV !== "production"}
      reloadOnOnline={false}
      swUrl="/serwist/sw.js"
    >
      {children}
    </SerwistProvider>
  );
}
