/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for deployment
  output: 'export',
  
  // Required for static export
  images: {
    unoptimized: true
  },
  
  // Build configuration
  distDir: 'out',
  
  // Linting and type checking
  eslint: {
    ignoreDuringBuilds: false, // Don't ignore linting errors
  },
  typescript: {
    ignoreBuildErrors: false, // Don't ignore TypeScript errors
  },
  
  // Note: Security headers are not supported with static export
  // Consider using a CDN or hosting service that supports custom headers
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Simple webpack config - no complex polyfills needed
    return config;
  },
};

module.exports = nextConfig;
