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
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
