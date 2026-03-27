import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "backend.conciergeriebyisa.fr",
      },
      {
        protocol: "http",
        hostname: "backend.conciergeriebyisa.fr",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
