import withSerwistInit from "@serwist/next";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version: appVersion } = require("./package.json");

const buildRevision = Date.now().toString();

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [
    { url: "/", revision: buildRevision },
    { url: "/relatorios/novo", revision: buildRevision },
    { url: "/relatorios/editar", revision: buildRevision },
    { url: "/relatorios/preview", revision: buildRevision },
    { url: "/~offline", revision: buildRevision },
  ],
  disable: process.env.NODE_ENV !== "production",
  swDest: "public/sw.js",
  swSrc: "src/app/sw.ts",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  output: "export",
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default withSerwist(nextConfig);
