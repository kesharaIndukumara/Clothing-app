import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF invoices are rendered with @react-pdf/renderer on the server
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    // Allow product image uploads through admin Server Actions
    serverActions: { bodySizeLimit: "25mb" },
    proxyClientMaxBodySize: "25mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
