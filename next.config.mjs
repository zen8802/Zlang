/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  webpack: (config) => {
    // hanzi-writer-data uses dynamic requires; ensure Node builtins
    // that aren't available in the browser are stubbed out.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    }
    return config
  },
};

export default nextConfig;
