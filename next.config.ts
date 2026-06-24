import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.softbrain.space",
        pathname: "/assets/**",
      },
      {
        protocol: "https",
        hostname: "softbrain.space",
        pathname: "/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
