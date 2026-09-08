import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "utfs.io" },
      // Fotos de relleno (placeholder) mientras se suben fotos reales del
      // taller vía el panel admin — quitar cuando ya no se usen.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
