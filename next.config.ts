import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Stops `next dev` from writing AGENTS.md and CLAUDE.md into the project.
  agentRules: false,

  // Compiles the chess package's TypeScript and CSS from vendor/chess as part of this build.
  transpilePackages: ["@chess/frontend"],

  allowedDevOrigins: ["192.168.*.*"],
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
