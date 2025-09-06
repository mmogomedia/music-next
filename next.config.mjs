/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      { protocol: 'http', hostname: 'localhost' }
    ]
  }
}

export default nextConfig
