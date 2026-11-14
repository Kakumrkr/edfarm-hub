import type { NextConfig } from "next";

// cacheComponents and partialPrefetching are intentionally OFF.
// With them on, pages that read cookies or the database fail the build.
const nextConfig: NextConfig = {
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
