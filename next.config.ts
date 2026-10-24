import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Logos, covers and product photos are sent as resized images until there is a file store.
      bodySizeLimit: "8mb",
    },
  },
  // On every response the worker renders (OpenNext applies these too): HTTPS only, never inside
  // another site's frame (checkout and settings can't be overlaid), and no more about the page than
  // other sites need.
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
    {
      // Where Gate-E sends the brand back, which can be inside the payment panel (CardPanel) on laqta's own
      // page: framed by laqta only (these replace the two above for this path), and it then takes the tab.
      source: "/payments/:path*",
      headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
      ],
    },
  ],
};

export default nextConfig;
