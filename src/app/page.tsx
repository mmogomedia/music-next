import type { Metadata } from 'next';
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

/** The marketing landing page. The Learn directory lives at `/learn`. */
export default async function HomePage() {
  const [{ articles }, tracks] = await Promise.all([
    getArticles({ status: 'PUBLISHED', limit: 5 }),
    MusicService.getFeaturedTracks(5),
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
      <HomeHero />
      <HomeLearnSection featured={featured} rest={rest} />
      <HomeToolsSection tools={getAllTools()} />
      <HomeStreamSection tracks={streamTracks} />
      <HomeJoinSection />
      <HomeFooter />
    </div>
  );
}
