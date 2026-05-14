/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'your-s3-bucket.s3.amazonaws.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  async redirects() {
    return [
      {
        source: '/services',
        destination: '/about',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
