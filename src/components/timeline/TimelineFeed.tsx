'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  ChevronDownIcon,
  PlayIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { TimelinePostRenderer } from './renderers';
import CommentsModal from './CommentsModal';
import NewPostsBanner from './NewPostsBanner';
import TimelineChatMessages from './TimelineChatMessages';
import { useTimelineStream } from '@/hooks/useTimelineStream';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/components/ui/Toast';
import type { PostType } from '@prisma/client';
import type { TimelinePostWithAuthor } from '@/lib/services/timeline-service';
import GhostLoader from '@/components/ui/GhostLoader';

interface Genre {
  id: string;
  name: string;
  slug: string;
  colorHex?: string | null;
}

interface FeaturedContent {
  id: string;
  postType: PostType;
  title: string | null;
  description: string | null;
  coverImageUrl: string | null;
  videoUrl: string | null;
  songUrl: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  content: any;
}

type ViewMode = 'timeline' | 'chat';

interface TimelineFeedProps {
  chatMessages?: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    data?: any;
    timestamp: Date;
  }>;
  statusMessage?: string | null;
  chatLoading?: boolean;
  chatError?: string | null;
  onPlayTrack?: (_trackId: string) => void;
  onViewArtist?: (_artistId: string) => void;
  onAction?: (_action: any) => void;
  onClarificationAnswer?: (_answers: Record<string, string | string[]>) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (_mode: ViewMode) => void;
}

export default function TimelineFeed({
  chatMessages = [],
  statusMessage = null,
  chatLoading = false,
  chatError = null,
  onPlayTrack,
  onViewArtist,
  onAction,
  onClarificationAnswer,
  viewMode: propViewMode,
  onViewModeChange,
}: TimelineFeedProps) {
  const [internalViewMode, setInternalViewMode] =
    useState<ViewMode>('timeline');
  const viewMode = propViewMode ?? internalViewMode;
  const setViewMode = (mode: ViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posts, setPosts] = useState<TimelinePostWithAuthor[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy] = useState<'relevance' | 'recent' | 'trending'>('relevance');
  const [selectedPostForComments, setSelectedPostForComments] =
    useState<TimelinePostWithAuthor | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const viewedPosts = useRef<Set<string>>(new Set());
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  // Track the most recent post ID from the current feed view as baseline
  // Only set once when feed finishes initial load, with a small delay to ensure stability
  const [baselinePostId, setBaselinePostId] = useState<string | null>(null);
  const hasInitializedStream = useRef(false);

  // Set baseline post ID once when feed finishes initial load
  // Use the post with the most recent publishedAt, not just posts[0] (which might be sorted by relevance)
  useEffect(() => {
    if (
      !loading &&
      posts.length > 0 &&
      !baselinePostId &&
      !hasInitializedStream.current
    ) {
      // Delay setting baseline to ensure feed is stable
      const timer = setTimeout(() => {
        if (posts.length > 0) {
          // Find the post with the most recent publishedAt (not just posts[0] which might be sorted by relevance)
          const mostRecentPost = posts.reduce((latest, post) => {
            const postDate = post.publishedAt
              ? new Date(post.publishedAt)
              : new Date(0);
            const latestDate = latest.publishedAt
              ? new Date(latest.publishedAt)
              : new Date(0);
            return postDate > latestDate ? post : latest;
          });

          if (mostRecentPost?.id) {
            const baselineId = mostRecentPost.id;
            logger.info(
              'Setting baseline post ID:',
              baselineId,
              'publishedAt:',
              mostRecentPost.publishedAt
            );
            setBaselinePostId(baselineId);
            hasInitializedStream.current = true;
          }
        }
      }, 1000); // 1 second delay to ensure feed is fully loaded

      return () => clearTimeout(timer);
    }
  }, [loading, posts, baselinePostId]);

  // Real-time feed updates via SSE - pass most recent post ID to avoid counting existing posts
  // Only connect when we have a stable baseline
  const streamEnabled =
    !loading &&
    posts.length > 0 &&
    !!baselinePostId &&
    hasInitializedStream.current; // Only enable after baseline is set

  logger.info('[TimelineFeed] Stream enabled check:', {
    loading,
    postsLength: posts.length,
    baselinePostId,
    hasInitializedStream: hasInitializedStream.current,
    streamEnabled,
  });

  const { newPostsCount, pendingPosts, clearNewPosts } = useTimelineStream({
    enabled: streamEnabled,
    initialPostId: baselinePostId, // Pass most recent post ID so server knows what's already visible
    onNewPosts: useCallback((newPosts: TimelinePostWithAuthor[]) => {
      // New posts are tracked, but we'll prepend them on refresh
      logger.info('New posts received:', newPosts.length);
    }, []),
    onError: useCallback(
      (error: Error) => {
        logger.error('SSE connection error:', error);
        showErrorToast('Connection lost. Reconnecting...', 3000);
      },
      [showErrorToast]
    ),
  });

  // Map PostType to display type
  const mapPostTypeToDisplayType = (
    postType: PostType
  ): 'video' | 'song' | 'article' | 'spotify' | 'social' => {
    switch (postType) {
      case 'VIDEO_CONTENT':
        return 'video';
      case 'SONG':
      case 'MUSIC_POST':
        return 'song';
      case 'NEWS_ARTICLE':
        return 'article';
      case 'FEATURED_CONTENT':
        return 'spotify'; // Default for featured content
      default:
        return 'article';
    }
  };

  // Fetch featured content
  const fetchFeaturedContent = useCallback(async () => {
    try {
      const response = await fetch('/api/timeline/featured?limit=10');
      if (response.ok) {
        const data = await response.json();
        setFeaturedContent(data.featured || []);
      }
    } catch (error) {
      logger.error('Error fetching featured content:', error);
    }
  }, []);

  // Fetch timeline posts
  const fetchPosts = useCallback(
    async (cursor?: string | null, append = false) => {
      if (loadingMore && append) return; // Prevent duplicate requests

      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // Build query params
        const params = new URLSearchParams({
          limit: '20',
          sortBy,
        });

        if (cursor) {
          params.append('cursor', cursor);
        }

        // Add following filter
        if (activeFilter === 'following') {
          params.append('following', 'true');
        }

        // Add post type filters
        const postTypes: PostType[] = [];
        if (activeFilter === 'music') {
          postTypes.push('MUSIC_POST', 'SONG');
        } else if (activeFilter === 'news') {
          postTypes.push('NEWS_ARTICLE');
        } else if (activeFilter === 'videos') {
          postTypes.push('VIDEO_CONTENT');
        }
        // 'all' and 'following' don't filter by type

        if (postTypes.length > 0) {
          params.append('postTypes', postTypes.join(','));
        }

        if (selectedGenre) {
          params.append('genreId', selectedGenre);
        }

        const response = await fetch(`/api/timeline/feed?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch timeline feed');
        }

        const data = await response.json();

        if (append) {
          setPosts(prev => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        logger.error('Error fetching timeline posts:', err);
        setError('Failed to load timeline posts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, selectedGenre, sortBy, loadingMore]
  );

  // Track if we've done the initial fetch
  const hasInitialized = useRef(false);
  const prevFilters = useRef<string>(
    JSON.stringify({ activeFilter, selectedGenre, sortBy })
  );

  // Initial data fetch - only once on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const fetchInitialData = async () => {
      await Promise.all([fetchFeaturedContent(), fetchPosts(null, false)]);
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Listen for refresh events (e.g., when a new post is created)
  useEffect(() => {
    const handleRefresh = () => {
      fetchPosts(null, false);
      fetchFeaturedContent();
    };

    window.addEventListener('timeline:refresh', handleRefresh);
    return () => {
      window.removeEventListener('timeline:refresh', handleRefresh);
    };
  }, [fetchPosts, fetchFeaturedContent]);

  // Refetch when filters change (but not on initial mount)
  useEffect(() => {
    if (!hasInitialized.current) return; // Skip on initial mount

    const currentFilters = JSON.stringify({
      activeFilter,
      selectedGenre,
      sortBy,
    });
    // Check if filters actually changed
    if (prevFilters.current !== currentFilters) {
      prevFilters.current = currentFilters;
      fetchPosts(null, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, selectedGenre, sortBy]); // Re-fetch when filters change

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPosts(nextCursor, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, nextCursor, fetchPosts]);

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/genres');
        if (response.ok) {
          const data = await response.json();
          setGenres(data.genres || []);
        }
      } catch (error) {
        logger.error('Error fetching genres:', error);
      }
    };
    fetchGenres();
  }, []);

  // Interaction handlers
  const handleLike = useCallback(async (postId: string) => {
    try {
      const response = await fetch(`/api/timeline/posts/${postId}/like`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to toggle like');
      const data = await response.json();

      // Update local state
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                userLiked: data.liked,
                likeCount: data.likeCount,
                _count: {
                  likes: data.likeCount,
                  comments: p._count?.comments || 0,
                  shares: p._count?.shares || 0,
                },
              }
            : p
        )
      );
    } catch (error) {
      logger.error('Error toggling like:', error);
      throw error;
    }
  }, []);

  const handleComment = useCallback(
    async (postId: string, _content: string, _parentId?: string) => {
      const post = posts.find(p => p.id === postId);
      if (post) {
        setSelectedPostForComments(post);
      }
    },
    [posts]
  );

  const handleShare = useCallback(async (postId: string, platform?: string) => {
    try {
      const response = await fetch(`/api/timeline/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      if (!response.ok) throw new Error('Failed to share');
      const data = await response.json();

      // Update local state
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                shareCount: data.shareCount,
                _count: {
                  likes: p._count?.likes || 0,
                  comments: p._count?.comments || 0,
                  shares: data.shareCount,
                },
              }
            : p
        )
      );
    } catch (error) {
      logger.error('Error sharing post:', error);
      throw error;
    }
  }, []);

  const handlePlayTrack = useCallback(
    (_trackId: string) => {
      if (onPlayTrack) {
        onPlayTrack(_trackId);
      } else {
        logger.warn(
          'Play track requested but no onPlayTrack handler provided:',
          _trackId
        );
      }
    },
    [onPlayTrack]
  );

  // Handle follow/unfollow
  const handleFollow = useCallback(
    async (authorId: string, isFollowing: boolean) => {
      try {
        let response: Response;
        if (isFollowing) {
          // Unfollow
          response = await fetch(`/api/timeline/follows/${authorId}`, {
            method: 'DELETE',
          });
        } else {
          // Follow
          response = await fetch('/api/timeline/follows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ followingId: authorId }),
          });
        }

        if (!response.ok) {
          // Extract error message from response
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            (isFollowing ? 'Failed to unfollow user' : 'Failed to follow user');
          throw new Error(errorMessage);
        }

        // Update local state and get author name for success message
        let authorName: string | null = null;
        setPosts(prev =>
          prev.map(p => {
            if (p.author.id === authorId) {
              authorName = p.author.name || p.author.email || 'user';
              return {
                ...p,
                isFollowingAuthor: !isFollowing,
                userFollowsAuthor: !isFollowing,
              };
            }
            return p;
          })
        );

        // Show success toast with author name if available
        const authorDisplayName = authorName || 'user';
        const successMessage = isFollowing
          ? `Unfollowed ${authorDisplayName}`
          : `Now following ${authorDisplayName}`;
        showSuccessToast(successMessage, 3000);
      } catch (error) {
        logger.error('Error toggling follow:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : isFollowing
              ? 'Failed to unfollow user'
              : 'Failed to follow user';
        showErrorToast(errorMessage, 5000);
        throw error;
      }
    },
    [showErrorToast, showSuccessToast]
  );

  // Handle refresh from new posts banner
  const handleRefreshFeed = useCallback(() => {
    if (pendingPosts.length > 0) {
      // Prepend new posts to the beginning of the feed
      setPosts(prev => {
        // Filter out duplicates (posts that already exist)
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewPosts = pendingPosts.filter(p => !existingIds.has(p.id));
        return [...uniqueNewPosts, ...prev];
      });
      clearNewPosts();
    } else {
      // If no pending posts, just refresh the feed
      fetchPosts(null, false);
      clearNewPosts();
    }
  }, [pendingPosts, clearNewPosts, fetchPosts]);

  // Track post views when they enter viewport
  const handleViewPost = useCallback(async (postId: string) => {
    // Debounce: only track once per post
    if (viewedPosts.current.has(postId)) return;
    viewedPosts.current.add(postId);

    try {
      await fetch(`/api/timeline/posts/${postId}/view`, {
        method: 'POST',
      });
      // Silently update view count in local state
      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p
        )
      );
    } catch (error) {
      // Silently fail - view tracking is not critical
      logger.error('Error tracking view:', error);
    }
  }, []);

  // Set up intersection observer for view tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId) {
              handleViewPost(postId);
            }
          }
        });
      },
      { threshold: 0.5 } // Track when 50% of post is visible
    );

    // Observe all post elements
    postRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      postRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [posts, handleViewPost]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'following', label: 'Following' },
    { id: 'music', label: 'Music' },
    { id: 'news', label: 'News' },
    { id: 'videos', label: 'Videos' },
  ];

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return VideoCameraIcon;
      case 'song':
        return MusicalNoteIcon;
      case 'article':
        return DocumentTextIcon;
      case 'spotify':
        return MusicalNoteIcon;
      case 'social':
        return GlobeAltIcon;
      default:
        return DocumentTextIcon;
    }
  };

  // Convert API featured content to display format
  const convertFeaturedToDisplay = (
    item: FeaturedContent
  ): {
    id: string;
    type: 'video' | 'song' | 'article' | 'spotify' | 'social';
    title: string;
    coverArt?: string;
    thumbnail?: string;
    artist?: string;
    author?: string;
    duration?: string;
    url?: string;
    platform?: string;
  } => {
    const displayType = mapPostTypeToDisplayType(item.postType);
    const content = item.content || {};

    return {
      id: item.id,
      type: displayType,
      title: item.title || 'Untitled',
      coverArt: item.coverImageUrl || undefined,
      thumbnail: item.coverImageUrl || item.videoUrl || undefined,
      artist: item.author.name || item.author.email,
      author: item.author.name || item.author.email,
      duration: content.duration || undefined,
      url: item.videoUrl || item.songUrl || content.url || undefined,
      platform: content.platform || (item.videoUrl ? 'YouTube' : undefined),
    };
  };

  const typeStyles: Record<
    'video' | 'song' | 'article' | 'spotify' | 'social',
    { label: string; className: string }
  > = {
    video: {
      label: 'Video',
      className:
        'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 border border-red-100 dark:border-red-800',
    },
    song: {
      label: 'Song',
      className:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800',
    },
    article: {
      label: 'Article',
      className:
        'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-800',
    },
    spotify: {
      label: 'Playlist',
      className:
        'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-800',
    },
    social: {
      label: 'Social',
      className:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800',
    },
  };

  if (loading) {
    return (
      <div className='px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-4 py-6'>
        <GhostLoader variant='post' count={3} />
      </div>
    );
  }

  // Convert featured content to display format, with fallback placeholders
  const displayFeatured =
    featuredContent.length > 0
      ? featuredContent.map(convertFeaturedToDisplay)
      : [
          {
            id: 'placeholder-yt',
            type: 'video' as const,
            title: 'Amapiano Mix 2024 - Best of South African House Music',
            thumbnail:
              'https://img.youtube.com/vi/UNWbmiwIzkY/maxresdefault.jpg',
            artist: 'DJ Mix',
            duration: '45:30',
            url: 'https://www.youtube.com/watch?v=UNWbmiwIzkY',
            platform: 'YouTube',
          },
          {
            id: 'placeholder-song',
            type: 'song' as const,
            title: 'Summer Vibes',
            coverArt:
              'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
            artist: 'Local Artist',
            duration: '03:28',
          },
          {
            id: 'placeholder-article-1',
            type: 'article' as const,
            title: 'New Music Trends in South Africa',
            thumbnail:
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
            author: 'Flemoji News',
            duration: '5 min read',
          },
          {
            id: 'placeholder-song-2',
            type: 'song' as const,
            title: 'City Lights',
            coverArt:
              'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
            artist: 'Urban Sounds',
            duration: '04:12',
          },
          {
            id: 'placeholder-article-2',
            type: 'article' as const,
            title: 'How Amapiano Took Over the World',
            thumbnail:
              'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
            author: 'Music Weekly',
            duration: '8 min read',
          },
          {
            id: 'placeholder-video-2',
            type: 'video' as const,
            title: 'Live Performance - Jazz Night',
            thumbnail:
              'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
            artist: 'Live Sessions',
            duration: '32:15',
            url: 'https://www.youtube.com',
            platform: 'YouTube',
          },
          {
            id: 'placeholder-song-3',
            type: 'song' as const,
            title: 'Midnight Groove',
            coverArt:
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
            artist: 'Night Beats',
            duration: '03:55',
          },
          {
            id: 'placeholder-article-3',
            type: 'article' as const,
            title: 'Inside the Johannesburg Live Music Scene',
            thumbnail:
              'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=400&fit=crop',
            author: 'SA Music Journal',
            duration: '7 min read',
          },
          {
            id: 'placeholder-article-4',
            type: 'article' as const,
            title: '10 Upcoming Artists to Watch This Summer',
            thumbnail:
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
            author: 'Flemoji Editorial',
            duration: '6 min read',
          },
        ];

  return (
    <div className='w-full py-6'>
      {/* Filter Bar - Fixed at Top - Above Featured Section */}
      <div className='sticky top-0 z-20 w-full mb-4 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-sm pt-3 pb-3'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-wrap items-center gap-2 justify-between'>
            <div className='flex flex-wrap items-center gap-2'>
              {/* Main Filters - Quick Link Style */}
              {filters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    activeFilter === filter.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}

              {/* Genre Dropdown - Same Line */}
              <div className='relative'>
                <button
                  onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    selectedGenre
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span>
                    {selectedGenre
                      ? genres.find(g => g.id === selectedGenre)?.name ||
                        'Genre'
                      : 'All Genres'}
                  </span>
                  <ChevronDownIcon
                    className={`w-3.5 h-3.5 transition-transform ${
                      isGenreDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isGenreDropdownOpen && (
                  <>
                    <button
                      type='button'
                      className='fixed inset-0 z-0 cursor-default'
                      onClick={() => setIsGenreDropdownOpen(false)}
                      aria-label='Close genre menu'
                    />
                    <div className='absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-lg max-h-60 overflow-y-auto scrollbar-hide z-20 min-w-[200px]'>
                      <button
                        onClick={() => {
                          setSelectedGenre(null);
                          setIsGenreDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${
                          !selectedGenre
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        All Genres
                      </button>
                      {genres.map(genre => (
                        <button
                          key={genre.id}
                          onClick={() => {
                            setSelectedGenre(genre.id);
                            setIsGenreDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 ${
                            selectedGenre === genre.id
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {genre.colorHex && (
                            <span
                              className='w-3 h-3 rounded-full'
                              style={{ backgroundColor: genre.colorHex }}
                            />
                          )}
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Timeline/Chat Toggle - Right Side */}
            <div className='flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-full p-1'>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('chat')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'chat'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Content Section - Horizontal Scroll - Only in Timeline View */}
      {viewMode === 'timeline' && (
        <div className='mb-6 w-full'>
          <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-3'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                Featured
              </h2>
              <span className='hidden sm:inline text-xs text-gray-500 dark:text-gray-400'>
                Swipe to explore
              </span>
            </div>
          </div>
          {/* Mobile: grid (no horizontal scrolling) */}
          <div className='sm:hidden max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-2 gap-3'>
              {displayFeatured.map(item => {
                const Icon = getContentIcon(item.type);
                return (
                  <a
                    key={item.id}
                    href={item.url || '#'}
                    target={item.url ? '_blank' : undefined}
                    rel={item.url ? 'noopener noreferrer' : undefined}
                    className='relative group bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 shadow-sm'
                  >
                    {/* Featured Badge */}
                    <div className='absolute top-2 left-2 z-0'>
                      <span className='px-2 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold rounded-full shadow-lg backdrop-blur-sm'>
                        Featured
                      </span>
                    </div>

                    {/* Platform Badge */}
                    {item.platform && (
                      <div className='absolute top-2 right-2 z-0'>
                        <span className='px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium rounded'>
                          {item.platform}
                        </span>
                      </div>
                    )}

                    <div className='flex flex-col'>
                      {/* Cover Art / Thumbnail */}
                      <div className='relative w-full aspect-video flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30'>
                        {item.coverArt || item.thumbnail ? (
                          <Image
                            src={item.coverArt || item.thumbnail || ''}
                            alt={item.title}
                            fill
                            className='object-cover group-hover:scale-110 transition-transform duration-500'
                            sizes='(max-width: 640px) 50vw, 224px'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center'>
                            <Icon className='w-10 h-10 text-blue-600 dark:text-blue-400' />
                          </div>
                        )}
                        {/* Gradient Overlay */}
                        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0' />
                        {item.type === 'video' && (
                          <div className='absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors'>
                            <div className='w-10 h-10 bg-white/95 dark:bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300'>
                              <PlayIcon className='w-5 h-5 text-blue-600 ml-0.5' />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className='p-2.5 flex-1 bg-white dark:bg-slate-800'>
                        <div className='flex items-start justify-between gap-1 mb-1'>
                          <h3 className='font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                            {item.title}
                          </h3>
                          <span
                            className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                              typeStyles[item.type]?.className ??
                              'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
                            }`}
                          >
                            {typeStyles[item.type]?.label ?? 'Content'}
                          </span>
                        </div>
                        {(item.artist || item.author) && (
                          <p className='text-xs text-gray-600 dark:text-gray-400 truncate mb-1'>
                            {item.artist || item.author}
                          </p>
                        )}
                        {item.duration && (
                          <div className='flex items-center gap-1.5'>
                            <span className='text-[10px] text-gray-500 dark:text-gray-500 font-medium'>
                              {item.duration}
                            </span>
                            {item.type === 'video' && (
                              <span className='text-[10px] text-blue-600 dark:text-blue-400 font-medium'>
                                Watch →
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Desktop: horizontal scroll */}
          <div className='hidden sm:block featured-scroll'>
            <div className='flex gap-3 pt-1 pb-2 pl-4 sm:pl-6 lg:pl-8'>
              {/* Spacer to align with centered content */}
              <div
                className='flex-shrink-0'
                style={{
                  width: 'max(0px, calc((100% - 48rem) / 2))',
                }}
              />
              <div className='flex gap-3'>
                {displayFeatured.map(item => {
                  const Icon = getContentIcon(item.type);
                  return (
                    <a
                      key={item.id}
                      href={item.url || '#'}
                      target={item.url ? '_blank' : undefined}
                      rel={item.url ? 'noopener noreferrer' : undefined}
                      className='relative group bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 flex-shrink-0 w-48 sm:w-56 shadow-sm hover:shadow-lg hover:-translate-y-0.5'
                    >
                      {/* Featured Badge */}
                      <div className='absolute top-2 left-2 z-0'>
                        <span className='px-2 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold rounded-full shadow-lg backdrop-blur-sm'>
                          Featured
                        </span>
                      </div>

                      {/* Platform Badge */}
                      {item.platform && (
                        <div className='absolute top-2 right-2 z-0'>
                          <span className='px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium rounded'>
                            {item.platform}
                          </span>
                        </div>
                      )}

                      <div className='flex flex-col'>
                        {/* Cover Art / Thumbnail */}
                        <div className='relative w-full aspect-video flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30'>
                          {item.coverArt || item.thumbnail ? (
                            <Image
                              src={item.coverArt || item.thumbnail || ''}
                              alt={item.title}
                              fill
                              className='object-cover group-hover:scale-110 transition-transform duration-500'
                              sizes='(max-width: 640px) 192px, 224px'
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center'>
                              <Icon className='w-10 h-10 text-blue-600 dark:text-blue-400' />
                            </div>
                          )}
                          {/* Gradient Overlay */}
                          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0' />
                          {item.type === 'video' && (
                            <div className='absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors'>
                              <div className='w-10 h-10 bg-white/95 dark:bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300'>
                                <PlayIcon className='w-5 h-5 text-blue-600 ml-0.5' />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Content Info */}
                        <div className='p-2.5 flex-1 bg-white dark:bg-slate-800'>
                          <div className='flex items-start justify-between gap-1 mb-1'>
                            <h3 className='font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                              {item.title}
                            </h3>
                            <span
                              className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                                typeStyles[item.type]?.className ??
                                'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
                              }`}
                            >
                              {typeStyles[item.type]?.label ?? 'Content'}
                            </span>
                          </div>
                          {(item.artist || item.author) && (
                            <p className='text-xs text-gray-600 dark:text-gray-400 truncate mb-1'>
                              {item.artist || item.author}
                            </p>
                          )}
                          {item.duration && (
                            <div className='flex items-center gap-1.5'>
                              <span className='text-[10px] text-gray-500 dark:text-gray-500 font-medium'>
                                {item.duration}
                              </span>
                              {item.type === 'video' && (
                                <span className='text-[10px] text-blue-600 dark:text-blue-400 font-medium'>
                                  Watch →
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
                {/* Right spacer to create subtle gap after last item */}
                <div className='w-3 sm:w-4 lg:w-5 flex-shrink-0' />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State - Only in Timeline View */}
      {viewMode === 'timeline' && error && (
        <div className='text-center py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto'>
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
            <p className='text-red-600 dark:text-red-400'>{error}</p>
            <button
              onClick={() => fetchPosts(null, false)}
              className='mt-2 text-sm text-red-600 dark:text-red-400 hover:underline'
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* New Posts Banner - Only in Timeline View */}
      {viewMode === 'timeline' && (
        <NewPostsBanner
          count={newPostsCount}
          onRefresh={handleRefreshFeed}
          onDismiss={clearNewPosts}
        />
      )}

      {/* Chat Messages - Only in Chat View */}
      {viewMode === 'chat' && (
        <TimelineChatMessages
          messages={chatMessages}
          statusMessage={statusMessage}
          loading={chatLoading}
          error={chatError}
          onPlayTrack={onPlayTrack}
          onViewArtist={onViewArtist}
          onAction={onAction}
          onClarificationAnswer={onClarificationAnswer}
        />
      )}

      {/* Timeline Posts - Only in Timeline View */}
      {viewMode === 'timeline' && (
        <>
          {!loading && !error && posts.length === 0 ? (
            <div className='text-center py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto'>
              <div className='w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-200/50 dark:border-blue-800/50'>
                <svg
                  className='w-16 h-16 text-blue-600 dark:text-blue-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              </div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-3'>
                Your Timeline Awaits
              </h2>
              <p className='text-gray-600 dark:text-gray-400 max-w-md mx-auto'>
                Timeline posts will appear here once artists start sharing
                music, news, and updates
              </p>
            </div>
          ) : (
            <div className='space-y-4 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto'>
              {posts.map(post => (
                <div
                  key={post.id}
                  ref={el => {
                    if (el) {
                      postRefs.current.set(post.id, el);
                    } else {
                      postRefs.current.delete(post.id);
                    }
                  }}
                  data-post-id={post.id}
                >
                  <TimelinePostRenderer
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onFollow={handleFollow}
                    onPlayTrack={handlePlayTrack}
                  />
                </div>
              ))}

              {/* Infinite Scroll Trigger */}
              {hasMore && (
                <div ref={observerTarget} className='py-8 flex justify-center'>
                  {loadingMore && (
                    <div className='w-full'>
                      <GhostLoader variant='post' count={2} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Comments Modal */}
      <CommentsModal
        post={selectedPostForComments}
        isOpen={!!selectedPostForComments}
        onClose={() => setSelectedPostForComments(null)}
        onLike={handleLike}
        onShare={handleShare}
        onPlayTrack={handlePlayTrack}
      />
    </div>
  );
}
