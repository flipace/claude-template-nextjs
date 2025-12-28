import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Ensure server-side features work in Docker
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
