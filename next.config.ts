import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp", "bcrypt"],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
