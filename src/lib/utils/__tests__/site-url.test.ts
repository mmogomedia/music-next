/**
 * SITE_URL is the base for every canonical, og:url, sitemap <loc> and the
 * Sitemap: directive in robots.txt, so a malformed value corrupts all of them
 * at once.
 *
 * This suite exists because of a live incident: NEXT_PUBLIC_SITE_URL was set
 * in Vercel with a trailing newline (the usual `echo … | vercel env add`
 * mistake). Only a trailing *slash* was stripped, so production shipped
 * `<loc>https://flemoji.com\n/learn</loc>` and a robots.txt whose Sitemap:
 * line was split across two lines. Metadata canonicals masked it by going
 * through `new URL()`; the raw interpolations did not.
 *
 * The module reads env at import time, so each case re-imports in isolation.
 */
describe('SITE_URL resolution', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function loadSiteUrl() {
    return require('../site-url') as typeof import('../site-url');
  }

  it('strips a trailing newline from NEXT_PUBLIC_SITE_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://flemoji.com\n';
    const { SITE_URL, absoluteUrl } = loadSiteUrl();

    expect(SITE_URL).toBe('https://flemoji.com');
    expect(absoluteUrl('/learn')).toBe('https://flemoji.com/learn');
    expect(absoluteUrl('/learn')).not.toContain('\n');
  });

  it('strips surrounding whitespace of any kind', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '  https://flemoji.com\r\n ';
    expect(loadSiteUrl().SITE_URL).toBe('https://flemoji.com');
  });

  it('still strips trailing slashes', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://flemoji.com/';
    expect(loadSiteUrl().SITE_URL).toBe('https://flemoji.com');
  });

  it('normalises the Vercel production URL fallback', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'flemoji.com\n';
    expect(loadSiteUrl().SITE_URL).toBe('https://flemoji.com');
  });

  it('falls back to the canonical host when nothing is set', () => {
    expect(loadSiteUrl().SITE_URL).toBe('https://flemoji.com');
  });
});
