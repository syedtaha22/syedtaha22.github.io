import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  allowedDevOrigins: ["192.168.100.102"],
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
