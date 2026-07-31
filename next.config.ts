import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only allowlist for cross-origin asset requests. Covers the LAN address
  // used locally and the proxied preview origins StackBlitz/WebContainer serve
  // from — without these the page loads but never hydrates.
  allowedDevOrigins: [
    "*.webcontainer.io",
    "*.webcontainer-api.io",
    "*.stackblitz.io",
    "*.local-credentialless.webcontainer-api.io",
  ],
};

export default nextConfig;
