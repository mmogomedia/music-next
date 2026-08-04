import { permanentRedirect } from 'next/navigation';

/**
 * Legacy `/articles/:slug` URLs. Guides live at `/:slug`.
 *
 * `permanentRedirect` (308) rather than `redirect` (307): the move is
 * permanent, and only a permanent redirect tells Google to transfer ranking
 * signals to the new URL instead of continuing to index the old one.
 */
export default async function ArticlesRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/${slug}`);
}
