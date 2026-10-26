import type { NextConfig } from "next";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

// One committed .env.example at the repository root. Load it for local dev and
// builds; in containers the values are injected by the runtime instead.
try {
  loadEnvFile(fileURLToPath(new URL("../../.env", import.meta.url)));
} catch {
  // No root .env (CI or container): rely on injected environment variables.
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;
