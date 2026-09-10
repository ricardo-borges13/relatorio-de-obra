import withSerwistInit from "@serwist/next";

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
  output: "export",
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default withSerwist(nextConfig);
