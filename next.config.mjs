/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don’t run ESLint during production builds (Coolify / CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;