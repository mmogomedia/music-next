import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/services/article-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/articles/[slug]/export
 *
 * Returns the article as a downloadable Markdown file formatted exactly
 * like the flemoji-article-template.md so it can be re-imported later.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const article = await getArticleBySlug(slug);

    if (article.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Build the YAML front-matter + body in the template format
    const secondaryKeywords =
      article.targetKeywords.length > 0
        ? article.targetKeywords.map(kw => `  - ${kw}`).join('\n')
        : '  - ';

    const frontmatter = [
      '---',
      `title: ${article.title}`,
      `excerpt: ${article.excerpt ?? ''}`,
      `seo_title: ${article.seoTitle ?? ''}`,
      `meta_description: ${article.metaDescription ?? ''}`,
      `primary_keyword: ${article.primaryKeyword ?? ''}`,
      `secondary_keywords:`,
      secondaryKeywords,
      `cluster_role: ${article.clusterRole ?? 'SPOKE'}`,
      `cta_text: ${article.ctaText ?? ''}`,
      `cta_link: ${article.ctaLink ?? ''}`,
      '---',
    ].join('\n');

    const markdown = `${frontmatter}\n\n${article.body}`;

    // Sanitise the filename
    const filename = `${slug}.md`;

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting article:', error);
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }
}
