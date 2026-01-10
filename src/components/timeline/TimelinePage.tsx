'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  InformationCircleIcon,
  EllipsisHorizontalIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { ChatRequest, ChatResponse } from '@/types/ai';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/components/ui/Toast';
import TimelineFeed from './TimelineFeed';
import TimelineSidebar from './TimelineSidebar';
import ChatSidebar from './ChatSidebar';
import MiniPlayer from '@/components/music/MiniPlayer';
import type { AIResponse } from '@/types/ai-responses';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { SourceType } from '@/types/stats';
import { ChatType } from '@prisma/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: AIResponse;
  timestamp: Date;
}

type ViewMode = 'timeline' | 'chat';

export default function TimelinePage() {
  const { data: session } = useSession();
  const { playTrack: contextPlayTrack } = useMusicPlayer();
  const { error: showErrorToast } = useToast();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading || !session?.user?.id) return;

    const userMessageText = message.trim();
    setMessage('');
    setLoading(true);
    setStatusMessage(null);
    setError(null); // Clear any previous errors

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageText,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    // Auto-switch to chat view when user sends a message
    setViewMode('chat');

    try {
      const requestBody: ChatRequest = {
        message: userMessageText,
        conversationId: conversationId || undefined,
        chatType: ChatType.TIMELINE,
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
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'connected':
                  break;
                case 'analyzing_intent':
                  setStatusMessage(
                    data.message ||
                      "Hmm, let me figure out what you're after... 🤔"
                  );
                  break;
                case 'routing_decision':
                  setStatusMessage(
                    data.method === 'keyword'
                      ? 'Got it! Getting things ready for you... ⚡'
                      : 'Just a sec, thinking... 💭'
                  );
                  break;
                case 'llm_classifying':
                  setStatusMessage(
                    data.message || 'Just a sec, thinking... 💭'
                  );
                  break;
                case 'agent_processing':
                  setStatusMessage(data.message || 'Working my magic... ✨');
                  break;
                case 'calling_tool':
                  setStatusMessage(
                    data.message || 'On it! Looking that up... 🔎'
                  );
                  break;
                case 'tool_result':
                  if (data.resultCount !== undefined && data.resultCount > 0) {
                    setStatusMessage(
                      data.message ||
                        `Found ${data.resultCount} awesome result${data.resultCount !== 1 ? 's' : ''}! 🎉`
                    );
                  }
                  break;
                case 'processing_results':
                  setStatusMessage(
                    data.message ||
                      'Almost there! Putting it all together... 🎨'
                  );
                  break;
                case 'finalizing':
                  setStatusMessage(
                    data.message || 'Almost ready... hang tight! 🎯'
                  );
                  break;
                case 'complete':
                  chatResponse = data.data as ChatResponse;
                  setStatusMessage(null);
                  break;
                case 'error':
                  throw new Error(data.error?.message || 'An error occurred');
                case 'heartbeat':
                  break;
              }
            } catch (parseError) {
              logger.warn('Failed to parse SSE event:', parseError);
            }
          }
        }
      }

      if (!chatResponse) {
        throw new Error('No response received from AI service');
      }

      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: chatResponse.message,
        data: chatResponse.data as AIResponse | undefined,
        timestamp: new Date(chatResponse.timestamp),
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setError(null); // Clear any previous errors on successful response

      // Update conversation ID if new
      if (!conversationId && chatResponse.conversationId) {
        setConversationId(chatResponse.conversationId);
      }
    } catch (error) {
      logger.error('Error submitting chat message:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to send message. Please try again.';
      setError(errorMessage);
      showErrorToast(errorMessage, 5000);
      setStatusMessage(null);
      // Remove the user message on error
      setChatMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const handleAction = async (action: any) => {
    logger.debug('AI action triggered:', action);
    // Handle different action types
    switch (action.type) {
      case 'play_track':
        // Track playing is handled by the music player context
        break;
      case 'play_playlist':
        // Playlist playing is handled by the music player context
        break;
      case 'view_artist':
        // Artist navigation is handled by router
        break;
      default:
        logger.warn('Unknown action type:', action.type);
    }
  };

  const handleClarificationAnswer = async (
    answers: Record<string, string | string[]>
  ) => {
    logger.debug('Clarification answers:', answers);
    // Resubmit the original message with clarification answers
    // This would typically be handled by the AI chat system
    // For now, we'll just log it
    if (chatMessages.length > 0) {
      const lastUserMessage = chatMessages
        .slice()
        .reverse()
        .find(msg => msg.role === 'user');
      if (lastUserMessage) {
        // Could resubmit with clarification context
        logger.info('Would resubmit with clarification answers');
      }
    }
  };

  const handlePlayTrack = useCallback(
    async (trackId: string) => {
      try {
        // Fetch track data
        const response = await fetch(`/api/tracks/${trackId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch track');
        }
        const data = await response.json();
        const track = data.track;

        if (track && contextPlayTrack) {
          contextPlayTrack(track, 'timeline' as SourceType);
        } else {
          logger.warn('Track not found or playTrack not available:', trackId);
        }
      } catch (error) {
        logger.error('Error playing track:', error);
      }
    },
    [contextPlayTrack]
  );

  // Load conversation messages when conversationId changes
  useEffect(() => {
    if (!conversationId || !session?.user?.id) return;

    const loadConversation = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const res = await fetch(`/api/ai/conversations/${conversationId}`);
        if (!res.ok) {
          throw new Error('Failed to load conversation');
        }

        const data = await res.json();
        const loadedMessages = data.messages || [];

        // Convert loaded messages to ChatMessage format
        const formattedMessages: ChatMessage[] = loadedMessages.map(
          (msg: any, idx: number) => ({
            id: `${msg.role}-${idx}-${Date.now()}`,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            data: msg.data,
            timestamp: new Date(msg.timestamp || msg.createdAt),
          })
        );

        setChatMessages(formattedMessages);
        setError(null); // Clear any previous errors on successful load
      } catch (error) {
        logger.error('Error loading conversation:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to load conversation. Please try again.';
        setError(errorMessage);
        showErrorToast(errorMessage, 5000);
        setChatMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, session?.user?.id]);

  if (isMobile === null) {
    return null;
  }

  return (
    <div className='h-screen bg-gray-50 dark:bg-slate-900 flex overflow-hidden w-full'>
      {/* Left Section: Chat Sidebar + Timeline Feed with Header */}
      <div className='flex-1 flex flex-col overflow-hidden min-w-0'>
        {/* Header - Spans chat sidebar + timeline feed */}
        <header className='flex-shrink-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 shadow-sm'>
          <div className='w-full px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between h-16 gap-4'>
              {/* Logo */}
              <Link href='/' className='flex items-center group flex-shrink-0'>
                <Image
                  src='/main_logo.png'
                  alt='Flemoji'
                  width={140}
                  height={40}
                  priority
                  className='h-8 w-auto'
                />
              </Link>

              {/* Spacer */}
              <div className='flex-1'></div>

              {/* Mini Player and User Menu - Right */}
              <div className='flex items-center gap-3 flex-shrink-0'>
                <MiniPlayer />
                {session?.user ? (
                  <Link
                    href='/dashboard'
                    className='p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors'
                  >
                    <UserCircleIcon className='w-7 h-7' />
                  </Link>
                ) : (
                  <Link
                    href='/login'
                    className='px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl'
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area Content */}
        <div className='flex-1 flex overflow-hidden min-h-0'>
          {/* Chat Sidebar - Left (Fixed, doesn't scroll) */}
          <div
            className={`${
              isMobile ? 'hidden' : 'w-64'
            } flex-shrink-0 h-full border-r border-gray-200/30 dark:border-slate-700/30 flex flex-col`}
          >
            <ChatSidebar
              onConversationSelect={selectedConversationId => {
                if (selectedConversationId === 'new') {
                  setConversationId(null);
                  setChatMessages([]);
                  setViewMode('chat');
                } else {
                  // Clear messages first, then load new conversation
                  setChatMessages([]);
                  setConversationId(selectedConversationId);
                  setViewMode('chat');
                }
              }}
              activeConversationId={conversationId}
              onConversationsUpdate={() => {
                // Conversation list was updated, no action needed
                // This callback is used by ChatSidebar to notify parent
              }}
            />
          </div>

          {/* Timeline Feed - Center with Independent Scroll */}
          <div className='flex-1 flex flex-col overflow-hidden relative'>
            {/* Scrollable Timeline Content */}
            <div
              className='flex-1 timeline-scroll'
              style={{ paddingBottom: '80px' }}
            >
              <TimelineFeed
                chatMessages={chatMessages}
                statusMessage={statusMessage}
                chatLoading={loading}
                chatError={error}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onPlayTrack={handlePlayTrack}
                onViewArtist={undefined}
                onAction={handleAction}
                onClarificationAnswer={handleClarificationAnswer}
              />
            </div>

            {/* Chat Input - Fixed at bottom of center section only */}
            <div className='absolute bottom-0 left-0 right-0 z-40 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur border-t border-gray-200/50 dark:border-slate-700/50'>
              <form onSubmit={handleSubmit} className='py-3'>
                <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
                  <div className='h-12 rounded-full bg-gray-100 dark:bg-slate-800 px-4 flex items-center gap-2'>
                    <button
                      type='button'
                      className='flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors'
                      aria-label='Information'
                    >
                      <InformationCircleIcon className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                    </button>
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder='Ask for any song, artist, mood, playlist…'
                      disabled={loading}
                      className='flex-1 h-8 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-sm placeholder:text-xs md:placeholder:text-sm placeholder-gray-400 dark:placeholder-gray-500'
                      rows={1}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <button
                      type='submit'
                      disabled={!message.trim() || loading}
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                        !message.trim() || loading
                          ? 'bg-blue-200 dark:bg-blue-900/40 text-blue-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white hover:opacity-90 shadow-lg'
                      }`}
                      aria-label='Send message'
                    >
                      {loading ? (
                        <svg
                          className='w-4 h-4 animate-spin text-white/80'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                            fill='none'
                          />
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
                          />
                        </svg>
                      ) : (
                        <svg
                          className='w-4 h-4'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <line x1='22' y1='2' x2='11' y2='13' />
                          <polygon points='22 2 15 22 11 13 2 9 22 2' />
                        </svg>
                      )}
                    </button>
                    <button
                      type='button'
                      className='flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors'
                      aria-label='More options'
                    >
                      <EllipsisHorizontalIcon className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Right Side (Desktop Only) - Full Height from Top */}
      {!isMobile && (
        <div className='w-80 xl:w-96 flex-shrink-0 overflow-y-auto scrollbar-subtle bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700'>
          <TimelineSidebar />
        </div>
      )}
    </div>
  );
}
