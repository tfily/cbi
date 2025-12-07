/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["cbi-ndoo.gt.tc"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
