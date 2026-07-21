import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api-mb.meanchey.org",
      },
      {
        protocol: "http",
        hostname: "dev.kramajobs.com",
      },
      {
        protocol: "https",
        hostname: "dev.kramajobs.com",
      },
      {
        protocol: "https",
        hostname: "meanchey.org",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
