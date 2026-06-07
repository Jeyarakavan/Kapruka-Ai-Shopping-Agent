/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.kapruka.com',
      },
      {
        protocol: 'https',
        hostname: 'kapruka.com',
      },
      {
        protocol: 'http',
        hostname: '**.kapruka.com',
      },
    ],
  },
};

module.exports = nextConfig;
