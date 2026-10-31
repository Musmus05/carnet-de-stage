import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is per-user and reads the session cookie, so Cache Components
  // would wrap almost everything in Suspense for no gain. Kept off on purpose.
  cacheComponents: false,
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
