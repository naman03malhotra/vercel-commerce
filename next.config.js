/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '**'
      }
    ]
  }
};
