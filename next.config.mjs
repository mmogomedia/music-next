/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'profile-images.flemoji.com' },
      { protocol: 'https', hostname: 'profile-image.flemoji.com' },
      { protocol: 'https', hostname: 'asset.flemoji.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/audio.flemoji.com/:path*',
        destination: 'https://audio.flemoji.com/:path*',
      },
    ];
  },
};

export default nextConfig;
