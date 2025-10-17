/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        child_process: false,
        buffer: false,
        stream: false,
        util: false,
        url: false,
        querystring: false,
        os: false,
        assert: false,
        http: false,
        https: false,
        zlib: false,
      };
      
      // Handle Node.js modules for Pyodide
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:crypto': false,
        'node:fs': false,
        'node:fs/promises': false,
        'node:path': false,
        'node:child_process': false,
        'node:buffer': false,
        'node:stream': false,
        'node:util': false,
        'node:url': false,
        'node:querystring': false,
        'node:os': false,
        'node:assert': false,
        'node:http': false,
        'node:https': false,
        'node:zlib': false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
