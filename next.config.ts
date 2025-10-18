import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

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
    formats: ["image/avif", "image/webp"], // otimização de imagem
  },
};

// Configuração do PWA
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
    // API do servidor
    {
      urlPattern: /^\/api\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 1 dia
      },
    },
    // Assets estáticos do Next (_next)
    {
      urlPattern: /^\/_next\/.*\.(js|css|json)/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 dias
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

// @ts-expect-error conflito de tipos do next-pwa
export default withPWA(nextConfig);
