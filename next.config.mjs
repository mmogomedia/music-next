/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  // Optimize images
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
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable compression
  compress: true,
  // Optimize production builds
  swcMinify: true,
  // Enable React strict mode for better performance
  reactStrictMode: true,
  // Optimize font loading
  optimizeFonts: true,
  // Power by header removal (security)
  poweredByHeader: false,
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      '@heroui/react',
      '@heroicons/react',
      'framer-motion',
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
