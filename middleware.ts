import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  req => {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Define public routes that don't require authentication
    const publicRoutes = [
      // Main pages - all publicly accessible
      '/',
      '/browse',
      '/tracks',
      '/artists',
      '/genres',
      '/albums',
      '/search',

      // Authentication pages
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/verify-email',

      // Static pages
      '/about',
      '/contact',
      '/privacy',
      '/terms',
      '/help',
      '/faq',

      // Public API endpoints
      '/api/health',
      '/api/tracks',
      '/api/artists',
      '/api/genres',
      '/api/albums',
      '/api/search',
      '/api/play-events', // For tracking plays (anonymous)
      '/api/smart-links',
      '/api/public',

      // Static assets
      '/_next',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(
      route => path === route || path.startsWith(`${route}/`)
    );

    // Allow public routes to pass through
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // All other routes require authentication
    if (!token) {
      // Redirect to login for protected routes
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Role-based access control for specific routes
    if (path.startsWith('/admin')) {
      if (token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    if (path.startsWith('/artist')) {
      if (token.role !== 'ARTIST' && token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Define public routes that don't need authorization
        const publicRoutes = [
          // Main pages
          '/',
          '/browse',
          '/tracks',
          '/artists',
          '/genres',
          '/albums',
          '/search',

          // Authentication pages
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',

          // Static pages
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/help',
          '/faq',

          // Public API endpoints
          '/api/health',
          '/api/tracks',
          '/api/artists',
          '/api/genres',
          '/api/albums',
          '/api/search',
          '/api/play-events',
          '/api/smart-links',
          '/api/public',

          // Static assets
          '/_next',
          '/favicon.ico',
          '/robots.txt',
          '/sitemap.xml',
        ];

        const isPublicRoute = publicRoutes.some(
          route => path === route || path.startsWith(`${route}/`)
        );

        // Public routes don't need authorization
        if (isPublicRoute) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    // Protect all routes except public ones
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
