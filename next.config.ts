import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Habilita o modo estrito do React
  images: {
    domains: ["example.com"], // Domínios permitidos para otimização de imagens
  },
  async redirects() {
    return [
      {
        source: "/old-page", // Redireciona /old-page para /new-page
        destination: "/new-page",
        permanent: true, // Redirecionamento permanente (301)
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*", // Aplica cabeçalhos personalizados a todas as rotas da API
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
