'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, Spinner, Tabs, Tab, Button } from '@heroui/react';
import {
  TrophyIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import TimelineChatMessages from '@/components/timeline/TimelineChatMessages';
import ChatInput from '@/components/shared/ChatInput';
import type { AIResponse } from '@/types/ai-responses';
import type { ChatRequest, ChatResponse } from '@/types/ai';
import { ChatType } from '@prisma/client';
import type { LeagueEntry, LeagueData } from './types';
import LeagueTable from './LeagueTable';
import ScoreComparisonModal from './modals/ScoreComparisonModal';
import SubscoreExplanationModal from './modals/SubscoreExplanationModal';
import ArtistProfileModal from './modals/ArtistProfileModal';
import HowItWorksModal from './modals/HowItWorksModal';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: AIResponse;
  timestamp: Date;
}

type ViewMode = 'league' | 'chat';

export default function LeaguePage() {
  const { data: session } = useSession();
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<'premier' | 'watchlist'>(
    'premier'
  );
  const [viewMode, setViewMode] = useState<ViewMode>('league');
  const [message, setMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLeagueInfoOpen, setIsLeagueInfoOpen] = useState(false);
  const [selectedScoreEntry, setSelectedScoreEntry] =
    useState<LeagueEntry | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedArtistEntry, setSelectedArtistEntry] =
    useState<LeagueEntry | null>(null);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [artistProfile, setArtistProfile] = useState<any | null>(null);
  const [artistLoading, setArtistLoading] = useState(false);
  const [selectedSubscoreEntry, setSelectedSubscoreEntry] =
    useState<LeagueEntry | null>(null);
  const [selectedSubscoreType, setSelectedSubscoreType] = useState<
    'audience' | 'engagement' | 'consistency' | 'presence' | null
  >(null);
  const [isSubscoreModalOpen, setIsSubscoreModalOpen] = useState(false);

  useEffect(() => {
    async function fetchLeagueData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/pulse/league?ts=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch league data');
        }
        const data = await response.json();
        setLeagueData(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load league data'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchLeagueData();
  }, []);

  // Find tiers by code
  const premierTier =
    leagueData?.tiers.find(
      t => t.code === 'TIER1' || t.name.toLowerCase().includes('premier')
    ) || null;
  const watchlistTier =
    leagueData?.tiers.find(
      t => t.code === 'TIER2' || t.name.toLowerCase().includes('watchlist')
    ) || null;

  const currentTier = selectedTier === 'premier' ? premierTier : watchlistTier;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || chatLoading) return;

    // Require sign-in for chat (league rankings are public)
    if (!session?.user?.id) {
      setChatError('Please sign in to chat with Flemoji AI.');
      setViewMode('chat');
      return;
    }

    const userMessageText = message.trim();
    setMessage('');
    setChatLoading(true);
    setStatusMessage(null);
    setChatError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageText,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setViewMode('chat'); // Match timeline behavior

    try {
      const requestBody: ChatRequest = {
        message: userMessageText,
        conversationId: conversationId || undefined,
        chatType: ChatType.OTHER,
        context: {
          userId: session.user.id,
        },
      };

      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let chatResponse: ChatResponse | null = null;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = JSON.parse(line.slice(6));
          if (data.type === 'message') {
            chatResponse = data.data as ChatResponse;
          }
          if (data.type === 'conversation') {
            if (data.data?.conversationId) {
              setConversationId(data.data.conversationId);
            }
          }
          if (data.type === 'status') {
            setStatusMessage(data.data?.message ?? null);
          }
        }
      }

      if (chatResponse) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: chatResponse.message,
          data: chatResponse.data as AIResponse | undefined,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : 'Failed to send message'
      );
    } finally {
      setChatLoading(false);
      setStatusMessage(null);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Spinner size='lg' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Card>
          <CardBody>
            <p className='text-red-500'>Error: {error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col bg-gray-50 dark:bg-slate-900 overflow-hidden'>
      <ScoreComparisonModal
        isOpen={isScoreModalOpen}
        onOpenChange={open => {
          setIsScoreModalOpen(open);
          if (!open) setSelectedScoreEntry(null);
        }}
        entry={selectedScoreEntry}
        currentTier={currentTier}
      />

      <ArtistProfileModal
        isOpen={isArtistModalOpen}
        onOpenChange={open => {
          setIsArtistModalOpen(open);
          if (!open) {
            setSelectedArtistEntry(null);
            setArtistProfile(null);
          }
        }}
        entry={selectedArtistEntry}
        artistProfile={artistProfile}
        artistLoading={artistLoading}
      />

      <SubscoreExplanationModal
        isOpen={isSubscoreModalOpen}
        onOpenChange={open => {
          setIsSubscoreModalOpen(open);
          if (!open) {
            setSelectedSubscoreEntry(null);
            setSelectedSubscoreType(null);
          }
        }}
        entry={selectedSubscoreEntry}
        subscoreType={selectedSubscoreType}
      />

      <HowItWorksModal
        isOpen={isLeagueInfoOpen}
        onClose={() => setIsLeagueInfoOpen(false)}
      />

      {/* Content Area (League or Chat messages) */}
      <div className='flex-1 overflow-hidden relative'>
        <div
          className='absolute inset-0 overflow-y-auto'
          style={{ paddingBottom: '80px' }}
        >
          {/* Header (scrolls with content) */}
          <div className='w-full bg-gradient-to-r from-blue-50/60 via-purple-50/30 to-indigo-50/60 dark:from-blue-950/40 dark:via-purple-950/20 dark:to-indigo-950/40 border-b border-gray-200/50 dark:border-slate-700/50'>
            <div className='w-full px-6 py-4 md:py-5'>
              <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <div className='flex-1 text-left'>
                  <div className='inline-flex items-center gap-2 mb-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-300/30 dark:border-blue-700/30'>
                    <TrophyIcon
                      className='w-4 h-4 text-blue-600 dark:text-blue-400'
                      aria-hidden='true'
                    />
                    <span className='text-[10px] font-bold tracking-wider text-blue-700 dark:text-blue-300 uppercase'>
                      PULSE³ League
                    </span>
                  </div>
                  <h1 className='text-2xl md:text-3xl font-black mb-1.5 leading-tight'>
                    <span className='bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent'>
                      Flemoji PULSE³ League
                    </span>
                  </h1>
                </div>
                <div className='flex items-center justify-start md:justify-end gap-2'>
                  <div className='flex items-center gap-1 bg-white/70 dark:bg-slate-800/70 rounded-full p-1 border border-gray-200/60 dark:border-slate-700/60 shadow-sm'>
                    <button
                      type='button'
                      onClick={() => setViewMode('league')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        viewMode === 'league'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      League
                    </button>
                    <button
                      type='button'
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
          </div>

          {/* League tabs row - sticky under header */}
          {viewMode === 'league' && (
            <div className='sticky top-0 z-30 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur border-b border-gray-200/60 dark:border-slate-700/60'>
              <div className='px-4 sm:px-6 lg:px-8 py-3'>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <Tabs
                      selectedKey={selectedTier}
                      onSelectionChange={key =>
                        setSelectedTier(key as 'premier' | 'watchlist')
                      }
                      variant='light'
                      radius='full'
                      classNames={{
                        tabList:
                          'inline-flex w-auto bg-gray-100/80 dark:bg-slate-800/80 rounded-full p-1 border border-gray-200/70 dark:border-slate-700/70',
                        tab: 'px-3 py-1 text-xs rounded-full data-[selected=true]:bg-white data-[selected=true]:dark:bg-slate-700',
                      }}
                    >
                      <Tab
                        key='premier'
                        title={
                          <div className='flex items-center space-x-1.5'>
                            <TrophyIcon className='w-4 h-4' />
                            <span>Premier</span>
                          </div>
                        }
                      />
                      <Tab
                        key='watchlist'
                        title={
                          <div className='flex items-center space-x-1.5'>
                            <SparklesIcon className='w-4 h-4' />
                            <span>Watchlist</span>
                          </div>
                        }
                      />
                    </Tabs>

                    {currentTier?.run_at && (
                      <div className='mt-2 text-[11px] text-gray-500 dark:text-gray-400'>
                        Last updated:{' '}
                        {new Date(currentTier.run_at).toLocaleString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    size='sm'
                    variant='light'
                    className='h-8 text-xs'
                    startContent={
                      <InformationCircleIcon className='w-4 h-4 text-gray-500 dark:text-gray-400' />
                    }
                    onPress={() => setIsLeagueInfoOpen(true)}
                  >
                    How it works
                  </Button>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'league' && (
            <div className='px-4 sm:px-6 lg:px-8 py-4'>
              <Card className='shadow-sm'>
                <CardBody className='p-0'>
                  <LeagueTable
                    tier={currentTier}
                    onScoreClick={entry => {
                      setSelectedScoreEntry(entry);
                      setIsScoreModalOpen(true);
                    }}
                    onArtistClick={async entry => {
                      setSelectedArtistEntry(entry);
                      setIsArtistModalOpen(true);
                      setArtistProfile(null);
                      setArtistLoading(true);
                      try {
                        if (entry.artist_slug) {
                          const response = await fetch(
                            `/api/artist-profile/${entry.artist_slug}`
                          );
                          if (response.ok) {
                            const data = await response.json();
                            setArtistProfile(data.artistProfile);
                          }
                        }
                      } catch (error) {
                        console.error('Error fetching artist profile:', error);
                      } finally {
                        setArtistLoading(false);
                      }
                    }}
                    onSubscoreClick={(entry, type) => {
                      setSelectedSubscoreEntry(entry);
                      setSelectedSubscoreType(type);
                      setIsSubscoreModalOpen(true);
                    }}
                  />
                </CardBody>
              </Card>
            </div>
          )}

          {viewMode === 'chat' && (
            <TimelineChatMessages
              messages={chatMessages}
              statusMessage={statusMessage}
              loading={chatLoading}
              error={chatError}
              onPlayTrack={undefined}
              onViewArtist={undefined}
              onAction={undefined}
              onClarificationAnswer={undefined}
              fullWidth
            />
          )}
        </div>

        <ChatInput
          message={message}
          onMessageChange={setMessage}
          onSubmit={handleSubmit}
          loading={chatLoading}
          disabled={!session?.user?.id}
          placeholder={
            session?.user?.id
              ? 'Ask about rankings, eligibility, how to climb…'
              : 'Sign in to chat about the League…'
          }
          onInfoClick={() => setViewMode('chat')}
          showInfoButton
        />
      </div>
    </div>
  );
}
