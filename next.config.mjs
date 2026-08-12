/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  // Next 16 makes Turbopack the default bundler for `next dev` AND `next build`.
  // Turbopack infers the workspace root from lockfiles, and this repo ships both
  // package-lock.json and yarn.lock (yarn is the real package manager), so the
  // inference can silently walk up to a parent directory and root the build
  // outside the project. Pin it explicitly.
  turbopack: {
    root: import.meta.dirname,
  },
  // NOTE (Next 16): the `eslint` config option was REMOVED, and `next build` no
  // longer runs ESLint at all — so the old `eslint.ignoreDuringBuilds: true`
  // escape hatch is both unsupported and unnecessary. Linting stays gated by CI
  // (`yarn check-all`), which now calls the ESLint CLI directly because the
  // `next lint` command was also removed in 16.
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
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable compression
  compress: true,
  // Enable React strict mode for better performance
  reactStrictMode: true,
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
      // Individual guides moved out from under /learn to the root of the site:
      // articles are now `/:slug` and topics `/topic/:slug`. These rewrites
      // keep every previously-published /learn/* URL serving the same page
      // instead of 404ing. They're rewrites, not redirects, so old links stay
      // valid; each page sets its canonical to the new root URL, so search
      // engines consolidate there rather than seeing duplicates.
      //
      // `/learn` itself is NOT rewritten — it's a real page (the Learn
      // directory, src/app/learn/page.tsx) and keeps its own URL.
      //
      // Order matters — /learn/topic/:slug must be matched before /learn/:slug.
      { source: '/learn/topic/:slug', destination: '/topic/:slug' },
      { source: '/learn/:slug', destination: '/:slug' },
    ];
  },
};

export default nextConfig;
