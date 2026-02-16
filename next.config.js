/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "header", key: "host", value: "factorytruth.com" }],
        destination: "https://www.factorytruth.com/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
