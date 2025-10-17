/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    // Simple webpack config - no complex polyfills needed
    return config;
  },
};

module.exports = nextConfig;
