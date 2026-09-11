/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const offlineDocumentRoutes = new Set(["/", "/relatorios/novo", "/relatorios/editar", "/relatorios/preview"]);

function getCanonicalOfflineDocumentPath(pathname: string) {
  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}

function getOfflineDocumentPrecacheUrl(url: URL) {
  if (url.searchParams.has("_rsc")) {
    return;
  }

  const canonicalPath = getCanonicalOfflineDocumentPath(url.pathname);

  if (!offlineDocumentRoutes.has(canonicalPath)) {
    return;
  }

  const canonicalUrl = new URL(url);
  canonicalUrl.pathname = canonicalPath;
  canonicalUrl.search = "";
  canonicalUrl.hash = "";

  return canonicalUrl;
}

const serwist = new Serwist({
  clientsClaim: true,
  fallbacks: {
    entries: [
      {
        matcher({ request }) {
          return request.destination === "document";
        },
        url: "/~offline",
      },
    ],
  },
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // PrecacheRoute is registered before runtimeCaching. Normalize only the
    // document routes that make up the offline flow, keeping their query
    // string in the browser URL while reading the canonical HTML from cache.
    urlManipulation: ({ url }) => {
      const canonicalUrl = getOfflineDocumentPrecacheUrl(url);

      return canonicalUrl ? [canonicalUrl] : [];
    },
  },
  runtimeCaching: defaultCache,
  skipWaiting: true,
});

serwist.addEventListeners();
