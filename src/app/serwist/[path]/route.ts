import { createSerwistRoute } from "@serwist/turbopack";

const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? Date.now().toString();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [
    { url: "/", revision },
    { url: "/relatorios/novo", revision },
    { url: "/~offline", revision },
    { url: "/images/logo-riow.webp", revision },
    { url: "/icons/riow-192.png", revision },
    { url: "/icons/riow-512.png", revision },
    { url: "/icons/riow-180.png", revision },
  ],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});
