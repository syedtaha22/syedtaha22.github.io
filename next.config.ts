import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Stops `next dev` from writing AGENTS.md and CLAUDE.md into the project.
  agentRules: false,

  allowedDevOrigins: ["192.168.*.*"],
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
