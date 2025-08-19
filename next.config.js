/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for serverless deployment
  experimental: {
    serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallbacks for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    // Exclude binaries from webpack bundling
    if (isServer) {
      config.externals = [...(config.externals || []), "@sparticuz/chromium"];
    }

    return config;
  },
};

module.exports = nextConfig;
