import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["three"],
  },
  /* # ADDED: Alias @/* to apps/web/src for shared components */
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@/"] = path.join(__dirname, '../web/src');
    
    // # ADDED: Handle MP3 audio files as static assets
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Find existing file-loader rule and update it, or add new one
    const fileLoaderRuleIndex = config.module.rules.findIndex(
      (rule) => rule && typeof rule === 'object' && rule.test && rule.test.toString().includes('png|svg|jpg|jpeg|gif|webp')
    );
    
    if (fileLoaderRuleIndex !== -1) {
      // Modify existing rule to include audio files
      const existingRule = config.module.rules[fileLoaderRuleIndex];
      if (existingRule && typeof existingRule === 'object' && existingRule.test) {
        existingRule.test = /\.(png|jpe?g|gif|svg|webp|ico|mp3|wav|ogg)$/i;
      }
    } else {
      // Add new rule for audio files
      config.module.rules.push({
        test: /\.(mp3|wav|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/audio/[name][hash][ext]',
        },
      });
    }
    
    return config;
  },
};

export default nextConfig;


