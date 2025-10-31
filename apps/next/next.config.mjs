/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["three"],
  },
  /* # ADDED: Alias @/* to apps/web/src for shared components */
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@/"] = new URL("../web/src/", import.meta.url).pathname;
    return config;
  },
};

export default nextConfig;


