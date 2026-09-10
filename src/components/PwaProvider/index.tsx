"use client";

import { SerwistProvider } from "@serwist/next/react";
import { useEffect, useRef, type ReactNode } from "react";
import { APP_VERSION } from "@/lib/app-version";

interface PwaProviderProps {
  children: ReactNode;
}

export default function PwaProvider({ children }: PwaProviderProps) {
  const hasLoggedVersion = useRef(false);

  useEffect(() => {
    if (hasLoggedVersion.current) {
      return;
    }

    console.info(`RIOW | Relatórios de Obra | v${APP_VERSION}`);
    hasLoggedVersion.current = true;
  }, []);

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
