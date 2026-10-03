import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Logos, covers and product photos are sent as resized images until there is a file store.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
