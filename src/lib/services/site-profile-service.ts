/**
 * Site profile — the editable site-level identity (title / description /
 * tagline). Stored as a singleton row (id = "default"). Read by
 * `generateMetadata` for the homepage <title> + <meta description>, and
 * read/written over MCP (`get_site_profile` / `set_site_profile`) so a
 * connected AI client (the Pic-A-Site CMS) can manage it.
 *
 * When no row exists yet the hardcoded DEFAULTS are returned — these mirror the
 * values that used to live inline in src/app/layout.tsx, so behaviour is
 * unchanged until someone edits the profile.
 */
import { prisma } from '@/lib/db';

export interface SiteProfile {
  title: string;
  description: string;
  tagline: string;
  updatedAt: string | null;
}

/** Fallback identity — matches the previous static layout.tsx metadata. */
export const SITE_PROFILE_DEFAULTS: Omit<SiteProfile, 'updatedAt'> = {
  title: 'Flemoji — AI-Powered South African Music Discovery',
  description:
    'Discover and stream South African music with AI. Chat with Flemoji to find new tracks, explore artists, and build your perfect playlist.',
  tagline: '',
};

const SINGLETON_ID = 'default';

/** The current site profile, or the defaults when unset. Never throws. */
export async function getSiteProfile(): Promise<SiteProfile> {
  try {
    const row = await prisma.siteProfile.findUnique({
      where: { id: SINGLETON_ID },
      select: {
        title: true,
        description: true,
        tagline: true,
        updatedAt: true,
      },
    });
    if (!row) return { ...SITE_PROFILE_DEFAULTS, updatedAt: null };
    return {
      title: row.title,
      description: row.description,
      tagline: row.tagline,
      updatedAt: row.updatedAt.toISOString(),
    };
  } catch {
    // Missing table (pre-migration) / DB blip → never break rendering.
    return { ...SITE_PROFILE_DEFAULTS, updatedAt: null };
  }
}

/**
 * Partial patch of the site profile. Only the provided fields change; the rest
 * keep their current (or default) value. Upserts the singleton row and returns
 * the full profile after the write.
 */
export async function updateSiteProfile(patch: {
  title?: string;
  description?: string;
  tagline?: string;
}): Promise<SiteProfile> {
  const current = await getSiteProfile();
  const next = {
    title: patch.title?.trim() || current.title,
    description: patch.description?.trim() || current.description,
    tagline: patch.tagline?.trim() ?? current.tagline,
  };
  const row = await prisma.siteProfile.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...next },
    update: next,
    select: { title: true, description: true, tagline: true, updatedAt: true },
  });
  return {
    title: row.title,
    description: row.description,
    tagline: row.tagline,
    updatedAt: row.updatedAt.toISOString(),
  };
}
