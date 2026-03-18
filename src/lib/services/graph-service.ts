import { prisma } from '@/lib/db';
import type { ContentType, LinkType } from '@prisma/client';

export type { ContentType, LinkType };

export interface CreateLinkInput {
  fromType: ContentType;
  fromId: string;
  toType: ContentType;
  toId: string;
  linkType?: LinkType;
  order?: number;
}

/**
 * Creates a directed content link. No-ops if the link already exists.
 */
export async function createLink(input: CreateLinkInput) {
  return prisma.contentLink.upsert({
    where: {
      fromType_fromId_toType_toId_linkType: {
        fromType: input.fromType,
        fromId: input.fromId,
        toType: input.toType,
        toId: input.toId,
        linkType: input.linkType ?? 'RELATED',
      },
    },
    create: {
      fromType: input.fromType,
      fromId: input.fromId,
      toType: input.toType,
      toId: input.toId,
      linkType: input.linkType ?? 'RELATED',
      order: input.order ?? 0,
    },
    update: { order: input.order ?? 0 },
  });
}

export async function deleteLink(id: string) {
  return prisma.contentLink.delete({ where: { id } });
}

export async function deleteLinksBySource(
  fromType: ContentType,
  fromId: string,
  toType?: ContentType,
  linkType?: LinkType
) {
  return prisma.contentLink.deleteMany({
    where: {
      fromType,
      fromId,
      ...(toType ? { toType } : {}),
      ...(linkType ? { linkType } : {}),
    },
  });
}

export async function getLinksFrom(
  fromType: ContentType,
  fromId: string,
  toType?: ContentType,
  linkType?: LinkType
) {
  return prisma.contentLink.findMany({
    where: {
      fromType,
      fromId,
      ...(toType ? { toType } : {}),
      ...(linkType ? { linkType } : {}),
    },
    orderBy: { order: 'asc' },
  });
}

export async function getLinksTo(
  toType: ContentType,
  toId: string,
  fromType?: ContentType,
  linkType?: LinkType
) {
  return prisma.contentLink.findMany({
    where: {
      toType,
      toId,
      ...(fromType ? { fromType } : {}),
      ...(linkType ? { linkType } : {}),
    },
    orderBy: { order: 'asc' },
  });
}

/**
 * Returns the tool slugs linked from an article.
 */
export async function getToolSlugsForArticle(
  articleId: string
): Promise<string[]> {
  const links = await getLinksFrom('ARTICLE', articleId, 'TOOL', 'REFERENCES');
  return links.map(l => l.toId);
}

/**
 * Replaces all ARTICLE→TOOL REFERENCES links for an article.
 * Pass an ordered array of tool slugs.
 */
export async function setToolLinksForArticle(
  articleId: string,
  toolSlugs: string[]
): Promise<void> {
  await deleteLinksBySource('ARTICLE', articleId, 'TOOL', 'REFERENCES');
  if (toolSlugs.length === 0) return;
  await Promise.all(
    toolSlugs.map((slug, i) =>
      createLink({
        fromType: 'ARTICLE',
        fromId: articleId,
        toType: 'TOOL',
        toId: slug,
        linkType: 'REFERENCES',
        order: i,
      })
    )
  );
}
