import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

// The laptop's Wi-Fi/LAN addresses, so a phone on the same network can use the dev server
// (Next 16 blocks dev resources such as HMR from other hosts, which leaves the page without JavaScript).
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net && net.family === "IPv4" && !net.internal)
  .map((net) => net!.address);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  allowedDevOrigins: lanAddresses,
  // Off: with partial (segment) prefetching every signed-in page rendered twice per request in the
  // production build (30 database queries for /student instead of 15), halving throughput (NFR04).
  partialPrefetching: false,
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
