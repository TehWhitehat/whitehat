import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: { "*": ["../../contracts/**", "../../services/**", "../../.env*", "./.env*"] },
  async headers() { return [{ source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "no-referrer" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }] }]; },
  // Worker threads avoid restricted child-process pipes in the local environment.
  experimental: { workerThreads: true, useTypeScriptCli: false },
};
export default nextConfig;

