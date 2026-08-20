import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { getArticles, getClusters } from '@/lib/services/article-service';
import { authOptions } from '@/lib/auth';
import { absoluteUrl } from '@/lib/utils/site-url';
import type { Article, ArticleCluster } from '@/types/articles';
import LearnDirectory from '@/components/learn/LearnDirectory';

export const dynamic = 'force-dynamic';

type ArticleWithClusterName = Article & {
  cluster: Pick<ArticleCluster, 'id' | 'name' | 'slug'> | null;
};

const TITLE =
  'Music Industry Guides for Independent South African Artists | Flemoji';
const DESCRIPTION =
  'Free music industry guides for independent South African artists — royalties, streaming, distribution, promotion, and more.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl('/learn') },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl('/learn'),
    siteName: 'Flemoji',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    site: '@flemoji',
  },
};

/**
 * The Learn directory.
 *
 * `/learn` is the cluster hub; `/learn?view=grid` is the paginated article
 * grid with cluster filters. Individual guides live at `/:slug` and topics at
 * `/topic/:slug` — those moved to the root in the landing-page revamp and are
 * NOT nested under /learn.
 */
export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string; page?: string; view?: string }>;
}) {
  const { cluster, page: pageParam, view } = await searchParams;
  const isGridView = view === 'grid';
  const page = Number(pageParam ?? 1);

  const [{ articles, total, pages }, clusters, session] = await Promise.all([
    isGridView
      ? getArticles({
          status: 'PUBLISHED',
          clusterId: cluster,
          page,
          limit: 12,
        })
      : getArticles({ status: 'PUBLISHED', limit: 3 }), // hub: 3 latest for the Latest section
    getClusters(),
    getServerSession(authOptions),
  ]);

  return (
    <LearnDirectory
      articles={articles as ArticleWithClusterName[]}
      clusters={clusters}
      total={total}
      pages={pages}
      page={page}
      clusterId={cluster}
      isGridView={isGridView}
      isAdmin={session?.user?.role === 'ADMIN'}
    />
  );
}
