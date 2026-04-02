import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
    ],
    // Disable WebP/AVIF for broader browser compatibility
    formats: ["image/webp"],
    // Ensure fallback for older browsers
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
};

export default nextConfig;
