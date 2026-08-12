import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Server-side auth gate for the authenticated PAGE surface.
 *
 * Next 16 renamed the `middleware` convention to `proxy`, and the file MUST sit
 * at `src/proxy.ts` — next to `src/app`. The previous root-level `middleware.ts`
 * was never compiled by Next 15 (the build emitted an empty middleware manifest),
 * so it was dead code for its entire life and is not a precedent for anything.
 *
 * WHY THIS IS A DENYLIST, AND WHY IT IS PAGES-ONLY
 * ------------------------------------------------
 * The old file was an ALLOWLIST of public paths behind a catch-all matcher.
 * That model cannot work here, for two independent reasons, both measured
 * against the running app rather than assumed:
 *
 *  1. Root-level article slugs (`/[slug]`) are indistinguishable by prefix from
 *     `/admin` or `/dashboard`. The public surface is open-ended, so it is not
 *     expressible as a list — which is why that list rotted until activating it
 *     would have 307'd every article, `/topic/*`, both `/.well-known/oauth-*`
 *     documents and `/api/mcp` to the login page.
 *
 *  2. The API surface cannot be gated by path at all. Probing all 207 routes
 *     anonymously showed `/api/pulse/league`, `/api/pulse/tiktok` and
 *     `/api/timeline/posts` each have some children that authenticate and
 *     others that are deliberately public, and several are GET-public /
 *     POST-authenticated ON THE SAME PATH. No prefix rule reproduces that.
 *     Those routes already enforce it themselves, correctly, per method — 65
 *     of them answer 401 to an anonymous request today. Middleware would be
 *     strictly less precise, so `/api/*` is deliberately NOT matched here.
 *
 * What this adds is defence in depth for pages that today guard themselves only
 * on the CLIENT: `/admin/genres`, `/admin/dashboard/track-completion`,
 * `/artist-profile`, `/profile/select`, `/profile/create/artist` and
 * `/profile/onboarding/artist` all return 200 with a rendered shell to an
 * anonymous visitor and only then redirect from JavaScript. No data leaks (the
 * `/api/admin/*` calls behind them 401), but the shell, the route structure and
 * a flash of admin chrome do. After this they never reach the browser.
 *
 * THE MATCHER IS THE SECURITY BOUNDARY. Keep it an explicit list of protected
 * prefixes. A catch-all matcher with exceptions is what caused the breakage
 * described above; with this form, a public route cannot be caught by accident
 * because middleware never runs for it.
 */
const proxy = withAuth(
  req => {
    const { token } = req.nextauth;
    const path = req.nextUrl.pathname;

    // `authorized` below already rejected the tokenless case; this is the
    // role layer.
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // `/artist-profile` is the artist MANAGEMENT dashboard. Public artist
    // profiles live at `/artist/[slug]`, which is not matched by this proxy.
    if (
      path.startsWith('/artist-profile') &&
      token?.role !== 'ARTIST' &&
      token?.role !== 'ADMIN'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Every path that reaches this proxy is protected by definition — the
      // matcher is the allowlist's inverse. Signed in is the baseline; roles
      // are checked above.
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export default proxy;

export const config = {
  // Protected page prefixes ONLY. Every route under these either already
  // redirects server-side or ships a client-guarded shell; none is public.
  // Deliberately absent: `/api/*` (routes self-authenticate per method),
  // `/[slug]` articles, `/topic/*`, `/stream`, `/pulse`, `/submissions`,
  // `/.well-known/*`, and all static assets.
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/artist-profile/:path*',
    '/profile/:path*',
  ],
};
