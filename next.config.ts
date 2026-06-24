import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.softbrain.space",
        pathname: "/assets/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
};

export default withNextIntl(nextConfig);
