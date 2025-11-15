'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import ChatNavigation from './ChatNavigation';
import UnifiedLayout from './UnifiedLayout';
import AIChat, { AIChatHandle } from '@/components/ai/AIChat';
import type { QuickLinkChatPayload } from '@/types/quick-links';
import type { QuickLinkLandingData } from '@/lib/services/quick-link-service';

interface ChatLayoutProps {
  children?: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { data: session } = useSession();
  const chatRef = useRef<AIChatHandle>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >();
  const [quickLinkData, setQuickLinkData] =
    useState<QuickLinkChatPayload | null>(null);
  const searchParams = useSearchParams();
  const quickLinkSlug = searchParams.get('quickLinkSlug');

  useEffect(() => {
    return () => {
      // Component unmounting
    };
  }, []);

  // Track session changes
  useEffect(() => {
    // Session changed
  }, [session]);

  // Track conversation ID changes
  useEffect(() => {
    // activeConversationId changed
  }, [activeConversationId]);

  useEffect(() => {
    if (!quickLinkSlug) {
      setQuickLinkData(null);
      return;
    }

    let cancelled = false;
    const fetchQuickLink = async () => {
      try {
        const res = await fetch(`/api/quick-links/${quickLinkSlug}`);
        if (!res.ok) {
          throw new Error('Failed to fetch quick link data');
        }
        const body = await res.json();
        if (!body?.data || cancelled) return;

        const apiData = body.data as QuickLinkLandingData;

        if (!apiData.quickLink) {
          setQuickLinkData(null);
          return;
        }

        const toIso = (value: unknown) => {
          if (!value) return null;
          if (value instanceof Date) return value.toISOString();
          if (typeof value === 'string') return value;
          return null;
        };

        const payload: QuickLinkChatPayload = {
          quickLink: {
            id: apiData.quickLink.id,
            slug: apiData.quickLink.slug,
            title: apiData.quickLink.title,
            description: apiData.quickLink.description ?? null,
            type: apiData.quickLink.type,
            isPrerelease: apiData.quickLink.isPrerelease ?? false,
          },
        };

        if (apiData.track) {
          payload.track = {
            ...apiData.track,
            releaseDate: toIso(apiData.track.releaseDate),
          };
        }

        if (apiData.album) {
          payload.album = {
            albumName: apiData.album.albumName,
            artistName: apiData.album.artist?.artistName ?? null,
            artistSlug: apiData.album.artist?.slug ?? null,
            tracks: apiData.album.tracks.map(track => ({
              ...track,
              releaseDate: toIso(track.releaseDate),
            })),
          };
        }

        if (apiData.artist) {
          payload.artist = {
            artistName: apiData.artist.profile?.artistName ?? 'Artist',
            bio: apiData.artist.profile?.bio ?? null,
            profileImage: apiData.artist.profile?.profileImage ?? null,
            location: apiData.artist.profile?.location ?? null,
            genre: apiData.artist.profile?.genre ?? null,
            slug: apiData.artist.profile?.slug ?? null,
            socialLinks: apiData.artist.socialLinks ?? null,
            streamingLinks: apiData.artist.streamingLinks ?? null,
            topTracks: apiData.artist.topTracks.map(track => ({
              ...track,
              releaseDate: toIso(track.releaseDate),
            })),
          };
        }

        setQuickLinkData(payload);
      } catch (error) {
        console.error(error);
        setQuickLinkData(null);
      } finally {
        // noop
      }
    };

    fetchQuickLink();

    return () => {
      cancelled = true;
    };
  }, [quickLinkSlug]);

  // Memoize context to prevent AIChat remounts
  const aiContext = useMemo(
    () => ({ userId: session?.user?.id }),
    [session?.user?.id]
  );

  const handleQuickLinkClick = useCallback((message: string) => {
    if (chatRef.current) {
      chatRef.current.setMessage(message);
    }
  }, []);

  const handleConversationSelect = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  const handleConversationIdChange = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  return (
    <UnifiedLayout
      sidebar={
        <ChatNavigation
          onQuickLinkClick={handleQuickLinkClick}
          onConversationSelect={handleConversationSelect}
          getConversationId={() => activeConversationId}
        />
      }
      contentClassName=''
      disableBottomPadding
    >
      {children || (
        <AIChat
          ref={chatRef}
          conversationId={activeConversationId}
          onConversationIdChange={handleConversationIdChange}
          context={aiContext}
          initialQuickLink={quickLinkData}
        />
      )}
    </UnifiedLayout>
  );
}
