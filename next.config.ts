import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev,
  buildExcludes: [/middleware-manifest.json$/],
  runtimeCaching: [
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 ano
      },
    },
    // API do seu servidor
    {
      urlPattern: /^\/api\/.*/, // todas as rotas que começam com /api/
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 1 dia
      },
    },
    // Tudo mais
    {
      urlPattern: /.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "general-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 1 dia
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/f/**",
      },
    ],
    formats: ["image/avif", "image/webp"], // Otimização de imagem
  },
};

// @ts-expect-error conflito de tipos do next-pwa
export default withPWA(nextConfig);
