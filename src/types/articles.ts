import type { ArticleStatus, ClusterRole } from '@prisma/client';

export type { ArticleStatus, ClusterRole };

export interface ArticleCluster {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  about: string | null;
  goal: string | null;
  coverImageUrl: string | null;
  targetKeywords: string[];
  primaryKeywords: string[];
  secondaryKeywords: string[];
  longTailKeywords: string[];
  audience: string | null;
  status: ArticleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClusterWithCount extends ArticleCluster {
  _count: {
    articles: number;
  };
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  targetKeywords: string[];
  primaryKeyword: string | null;
  internalLinks: string[];
  toolSlugs: string[];
  ctaText: string | null;
  ctaLink: string | null;
  clusterId: string | null;
  clusterRole: ClusterRole;
  readTime: number;
  status: ArticleStatus;
  publishedAt: Date | null;
  authorId: string;
  timelinePostId: string | null;
  embeddingUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleVersion {
  id: string;
  articleId: string;
  version: number;
  title: string;
  body: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  targetKeywords: string[];
  primaryKeyword: string | null;
  internalLinks: string[];
  toolSlugs: string[];
  ctaText: string | null;
  ctaLink: string | null;
  savedById: string;
  savedBy?: { id: string; name: string | null };
  createdAt: Date;
}

/** Shape of a resolved internal-link article (lightweight) */
export interface InternalLinkArticle {
  slug: string;
  title: string;
  excerpt: string | null;
  readTime: number;
}

export interface ArticleWithCluster extends Article {
  cluster: (ArticleCluster & { articles: Article[] }) | null;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  /** Resolved articles referenced in internalLinks (slugs → full objects) */
  internalLinkArticles: InternalLinkArticle[];
  /**
   * Tool slugs resolved from ContentLink (preferred) or article.toolSlugs (fallback).
   * Use this instead of article.toolSlugs to read linked tools.
   */
  resolvedToolSlugs: string[];
}

export interface CreateArticleInput {
  title: string;
  slug?: string;
  body: string;
  excerpt?: string;
  coverImageUrl?: string;
  seoTitle?: string;
  metaDescription?: string;
  targetKeywords?: string[];
  primaryKeyword?: string;
  internalLinks?: string[];
  toolSlugs?: string[];
  ctaText?: string;
  ctaLink?: string;
  clusterId?: string;
  clusterRole?: ClusterRole;
}

export interface CreateClusterInput {
  name: string;
  slug?: string;
  description?: string;
  about?: string;
  goal?: string;
  coverImageUrl?: string;
  targetKeywords?: string[];
  primaryKeywords?: string[];
  secondaryKeywords?: string[];
  longTailKeywords?: string[];
  audience?: string;
}
