import type { NextConfig } from "next";

// Sent on every response. The CSP covers framing, base and form targets;
// a script-src policy would need per-request nonces and is not set yet.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
];

const nextConfig: NextConfig = {
  // Every page is per-user and reads the session cookie, so Cache Components
  // would wrap almost everything in Suspense for no gain. Kept off on purpose.
  cacheComponents: false,
  poweredByHeader: false,
  experimental: {
    // Keep visited and prefetched pages for 30 s, so going back to a section is instant.
    staleTimes: { dynamic: 30 },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
