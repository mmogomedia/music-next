import type { Metadata } from 'next';
import { logger } from '@/lib/utils/logger';
import { getArticles } from '@/lib/services/article-service';
import { MusicService } from '@/lib/services/music-service';
import { getAllTools } from '@/lib/tools/registry';
import { absoluteUrl } from '@/lib/utils/site-url';
import type { Article, ArticleCluster } from '@/types/articles';
import LearnHeader from '@/components/layout/LearnHeader';
import HomeHero from '@/components/home/HomeHero';
import HomeLearnSection from '@/components/home/HomeLearnSection';
import HomeToolsSection from '@/components/home/HomeToolsSection';
import HomeStreamSection, {
  type StreamTrack,
} from '@/components/home/HomeStreamSection';
import HomeJoinSection from '@/components/home/HomeJoinSection';
import HomeFooter from '@/components/home/HomeFooter';

export const dynamic = 'force-dynamic';

type ArticleWithClusterName = Article & {
  cluster: Pick<ArticleCluster, 'id' | 'name' | 'slug'> | null;
};

// Title and description come from the SiteProfile via the root layout, so a
// connected AI client can manage them with get_site_profile / set_site_profile.
export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl('/') },
};

/**
 * Fetch a landing-page section's data, degrading to a fallback instead of
 * throwing.
 *
 * `/` is the most important URL on the site and every section here is
 * decorative-if-empty — each one already renders an empty state. Letting a
 * database problem bubble up turns the whole homepage into a 500, which is a
 * far worse outcome than a section rendering empty. This is not hypothetical:
 * the preview database is not migrated (migrate-deploy.mjs is production-only
 * by design), so `prisma.article.findMany()` fails with P2022 and took the
 * entire page down.
 */
async function safely<T>(label: string, load: () => Promise<T>, fallback: T) {
  try {
    return await load();
  } catch (error) {
    logger.error(`[landing] ${label} failed — rendering without it`, error);
    return fallback;
  }
}

/** The marketing landing page. The Learn directory lives at `/learn`. */
export default async function HomePage() {
  const [{ articles }, tracks] = await Promise.all([
    safely('guides', () => getArticles({ status: 'PUBLISHED', limit: 5 }), {
      articles: [],
      total: 0,
      page: 1,
      pages: 0,
    }),
    safely('featured tracks', () => MusicService.getFeaturedTracks(5), []),
  ]);

  // Lead with the cluster pillar when there is one — it's the "start here" read.
  const typed = articles as ArticleWithClusterName[];
  const featured =
    typed.find(a => a.clusterRole === 'PILLAR') ?? typed[0] ?? null;
  const rest = typed.filter(a => a.id !== featured?.id).slice(0, 4);

  const streamTracks: StreamTrack[] = tracks.map(track => ({
    id: track.id,
    title: track.title,
    artist: track.artistProfile?.artistName ?? track.artist ?? null,
    artworkUrl: track.coverImageUrl,
    href: '/stream',
  }));

  return (
    <div className='min-h-screen bg-white font-jakarta dark:bg-slate-900'>
      <LearnHeader />
      <HomeHero tracks={streamTracks} />
      <HomeLearnSection featured={featured} rest={rest} />
      <HomeToolsSection tools={getAllTools()} />
      <HomeStreamSection tracks={streamTracks} />
      <HomeJoinSection />
      <HomeFooter />
    </div>
  );
}
