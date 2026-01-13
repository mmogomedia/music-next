'use client';

import React from 'react';
import { MusicPostRenderer } from './music-post-renderer';
import { NewsArticleRenderer } from './news-article-renderer';
import { VideoContentRenderer } from './video-content-renderer';
import { AdvertisementRenderer } from './advertisement-renderer';
import { ReleasePromoRenderer } from './release-promo-renderer';
import { SongRenderer } from './song-renderer';
import { DefaultPostRenderer } from './default-post-renderer';
import type { TimelinePostWithAuthor } from '@/lib/services/timeline-service';
import type { PostType } from '@prisma/client';

export interface TimelinePostRendererProps {
  post: TimelinePostWithAuthor;
  onLike?: (_postId: string) => Promise<void>;
  onComment?: (
    _postId: string,
    _content: string,
    _parentId?: string
  ) => Promise<void>;
  onShare?: (_postId: string, _platform?: string) => Promise<void>;
  onFollow?: (_authorId: string, _isFollowing: boolean) => Promise<void>;
  onViewArtist?: (_artistId: string) => void;
  onPlayTrack?: (_trackId: string) => void;
}

/**
 * Timeline Post Renderer Registry
 * Maps PostType to appropriate renderer component
 */
const rendererMap: Record<
  PostType,
  React.ComponentType<TimelinePostRendererProps>
> = {
  MUSIC_POST: MusicPostRenderer,
  SONG: SongRenderer,
  NEWS_ARTICLE: NewsArticleRenderer,
  ADVERTISEMENT: AdvertisementRenderer,
  FEATURED_CONTENT: DefaultPostRenderer,
  RELEASE_PROMO: ReleasePromoRenderer,
  VIDEO_CONTENT: VideoContentRenderer,
  EVENT_ANNOUNCEMENT: DefaultPostRenderer,
  POLL: DefaultPostRenderer,
};

/**
 * Main Timeline Post Renderer
 * Routes to appropriate renderer based on post type
 * Memoized to prevent unnecessary re-renders
 */
// eslint-disable-next-line prefer-arrow-callback
export const TimelinePostRenderer = React.memo(function TimelinePostRenderer(
  props: TimelinePostRendererProps
) {
  const { post } = props;
  const Renderer = rendererMap[post.postType] || DefaultPostRenderer;

  return <Renderer {...props} />;
});
