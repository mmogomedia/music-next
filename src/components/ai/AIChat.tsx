'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useSession } from 'next-auth/react';
import { ChatRequest, ChatResponse, AIError, AIProvider } from '@/types/ai';
import ChatTopBar from './ChatTopBar';
import WelcomeHeader from './WelcomeHeader';
import ChatWelcomePlaceholder from './ChatWelcomePlaceholder';
import ChatInfoBanner from './ChatInfoBanner';
import { ResponseRenderer } from './response-renderers';
import type { AIResponse as StructuredAIResponse } from '@/types/ai-responses';
import type { QuickLinkChatPayload } from '@/types/quick-links';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/lib/utils/logger';
import MoreMusicSection from './MoreMusicSection';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import {
  ClipboardIcon,
  CheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  timestamp: Date;
}

interface AIChatProps {
  conversationId?: string;
  onConversationIdChange?: (_id: string) => void;
  context?: {
    userId?: string;
    artistProfile?: string;
    trackInfo?: string;
    playlistInfo?: string;
  };
  initialQuickLink?: QuickLinkChatPayload | null;
}

export interface AIChatHandle {
  setMessage: (_message: string) => void;
  submitMessage: (_message: string) => Promise<void>;
  loadConversation: (_conversationId: string) => Promise<void>;
  getConversationId: () => string | undefined;
}

const AIChat = React.forwardRef<AIChatHandle, AIChatProps>(
  (
    {
      context,
      conversationId: propConversationId,
      onConversationIdChange,
      initialQuickLink,
    },
    ref
  ) => {
    const { data: session } = useSession();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedProvider] = useState<AIProvider | 'auto'>('auto');
    const [selectedProvince, setSelectedProvince] = useState<
      string | undefined
    >();
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [isInfoBannerVisible, setIsInfoBannerVisible] = useState(true); // Start minimized (visible)
    const [isInfoBannerExpanded, setIsInfoBannerExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isSubmittingRef = useRef(false);
    const loadedConversationIdRef = useRef<string | undefined>(undefined);
    const { playTrack } = useMusicPlayer();
    const [quickLinkResponse, setQuickLinkResponse] =
      useState<StructuredAIResponse | null>(null);

    // Detect mobile for responsive layout
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
      if (!initialQuickLink) {
        setQuickLinkResponse(null);
        return;
      }

      const timestamp = new Date();
      const quickLinkMeta = initialQuickLink.quickLink;

      if (quickLinkMeta.type === 'TRACK' && initialQuickLink.track) {
        setQuickLinkResponse({
          type: 'quick_link_track',
          message: '',
          timestamp,
          data: {
            quickLink: quickLinkMeta,
            track: initialQuickLink.track,
          },
        } as StructuredAIResponse);
        return;
      }

      if (quickLinkMeta.type === 'ALBUM' && initialQuickLink.album) {
        setQuickLinkResponse({
          type: 'quick_link_album',
          message: '',
          timestamp,
          data: {
            quickLink: quickLinkMeta,
            album: initialQuickLink.album,
          },
        } as StructuredAIResponse);
        return;
      }

      if (quickLinkMeta.type === 'ARTIST' && initialQuickLink.artist) {
        setQuickLinkResponse({
          type: 'quick_link_artist',
          message: '',
          timestamp,
          data: {
            quickLink: quickLinkMeta,
            artist: initialQuickLink.artist,
          },
        } as StructuredAIResponse);
        return;
      }

      setQuickLinkResponse(null);
    }, [initialQuickLink]);

    const performSubmit = useCallback(
      async (msg: string) => {
        if (!msg.trim()) return;

        // Add user message to conversation
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: msg.trim(),
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        setError(null);
        isSubmittingRef.current = true;

        try {
          const enhancedContext = {
            ...context,
            province: selectedProvince,
          };

          const requestBody: ChatRequest = {
            message: msg.trim(),
            conversationId: propConversationId,
            context: enhancedContext,
            provider:
              selectedProvider === 'auto' ? undefined : selectedProvider,
          };

          const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await res.json();

          if (!res.ok) {
            const errorData = data as AIError;
            throw new Error(errorData.error || 'Failed to get AI response');
          }

          const chatResponse = data as ChatResponse;

          // Add AI response to conversation BEFORE updating conversation ID
          // This ensures messages are set before any loadConversation triggers
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: chatResponse.message,
            data: chatResponse.data,
            timestamp: new Date(chatResponse.timestamp),
          };

          // Add AI response to conversation
          setMessages(prev => {
            const updated = [...prev, aiMessage];
            // Mark this conversation as loaded BEFORE updating conversation ID
            // This ensures the ref is set before any loadConversation triggers
            if (!propConversationId && chatResponse.conversationId) {
              loadedConversationIdRef.current = chatResponse.conversationId;
            }
            return updated;
          });

          // Update conversation ID from response if it's new (after setting messages)
          if (!propConversationId && chatResponse.conversationId) {
            // Keep isSubmittingRef true to prevent loadConversation during the callback
            // Update conversation ID after a small delay to let state settle
            setTimeout(() => {
              onConversationIdChange?.(chatResponse.conversationId!);
              // Reset submitting flag after a delay to ensure useEffect has had a chance to check
              setTimeout(() => {
                isSubmittingRef.current = false;
              }, 200);
            }, 50);
          } else {
            // Update the ref if we're continuing an existing conversation
            if (propConversationId) {
              loadedConversationIdRef.current = propConversationId;
            }
            isSubmittingRef.current = false;
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          isSubmittingRef.current = false;
        } finally {
          setLoading(false);
        }
      },
      [
        context,
        propConversationId,
        selectedProvince,
        selectedProvider,
        onConversationIdChange,
      ]
    );

    const loadConversation = useCallback(
      async (convId: string) => {
        // Only load conversations if user is authenticated
        if (!session?.user?.id) {
          return;
        }

        try {
          setLoading(true);
          setError(null);

          // Fetch messages for this conversation
          const res = await fetch(`/api/ai/conversations/${convId}`);
          if (!res.ok) {
            throw new Error('Failed to load conversation');
          }

          const data = await res.json();
          const loadedMessages = data.messages || [];

          // Convert loaded messages to local Message format
          const formattedMessages: Message[] = loadedMessages.map(
            (msg: any, idx: number) => ({
              id: `${msg.role}-${idx}`,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              data: msg.data,
              timestamp: new Date(msg.createdAt || msg.timestamp),
            })
          );

          setMessages(formattedMessages);
          loadedConversationIdRef.current = convId;
          onConversationIdChange?.(convId);
        } catch (err) {
          logger.error('Error loading conversation:', err);
          setError(
            err instanceof Error ? err.message : 'Failed to load conversation'
          );
        } finally {
          setLoading(false);
        }
      },
      [onConversationIdChange, session?.user?.id]
    );

    // Expose methods via ref
    React.useImperativeHandle(ref, () => {
      return {
        setMessage: (msg: string) => {
          setMessage(msg);
          // Focus the textarea after setting message
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 100);
        },
        submitMessage: async (msg: string) => {
          setMessage(msg);
          await performSubmit(msg);
        },
        loadConversation: async (convId: string) => {
          await loadConversation(convId);
        },
        getConversationId: () => propConversationId,
      };
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim()) return;

      await performSubmit(message);
      setMessage('');
    };

    // Load conversation messages when propConversationId changes (only if authenticated)
    // Skip loading if we're currently submitting a message to avoid race conditions
    useEffect(() => {
      // Don't load if we're in the middle of submitting - messages are already set
      if (isSubmittingRef.current) {
        return;
      }

      if (propConversationId && session?.user?.id) {
        // Check if we've already loaded this conversation (using ref for synchronous check)
        // This prevents clearing messages when a new conversation ID is set after first message
        const alreadyLoadedThisConversation =
          loadedConversationIdRef.current === propConversationId;

        // Only load if:
        // 1. We haven't loaded this conversation yet, AND
        // 2. We don't have any messages (meaning this is a fresh load, not a response)
        if (!alreadyLoadedThisConversation && messages.length === 0) {
          loadConversation(propConversationId);
        } else if (!alreadyLoadedThisConversation && messages.length > 0) {
          // Different conversation but we have messages - load to get the correct messages
          loadConversation(propConversationId);
        }
      } else if (propConversationId && !session?.user?.id) {
        // User not authenticated - clear messages since we can't load conversation
        setMessages([]);
        setError(null);
        loadedConversationIdRef.current = undefined;
      } else if (!propConversationId) {
        // No conversation ID - reset the loaded ref
        loadedConversationIdRef.current = undefined;
      }
    }, [
      propConversationId,
      loadConversation,
      session?.user?.id,
      messages.length,
    ]);

    // Auto-scroll to bottom when new messages arrive (but not when there are no messages)
    useEffect(() => {
      if (messages.length > 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages, loading]);

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [message]);

    const handleCopyMessage = async (msgId: string, content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        setCopiedMessageId(msgId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch (err) {
        // Clipboard not available
      }
    };

    const demoArea = useMemo(
      () => (
        <div className='space-y-6'>
          <WelcomeHeader onGetStarted={() => {}} />
          <ChatWelcomePlaceholder province={selectedProvince} />
          {quickLinkResponse && (
            <ResponseRenderer response={quickLinkResponse} />
          )}
        </div>
      ),
      [quickLinkResponse, selectedProvince]
    );

    return (
      <div className='w-full h-full flex flex-col'>
        {/* Fixed top bar with filters and mini player */}
        <ChatTopBar
          province={selectedProvince}
          onProvinceChange={setSelectedProvince}
        />

        {/* Scrollable messages area - takes remaining space */}
        {/* Mobile: top-14 (nav header ~56px) + filter bar button row (~48px) = ~104px total */}
        {/* Desktop: pt-24 for ChatTopBar */}
        <div
          className='flex-1 overflow-y-auto pb-6 space-y-4 px-4 lg:px-6'
          style={{ paddingTop: isMobile ? '72px' : '0px' }}
        >
          {/* Landing view - always visible as intro */}
          {demoArea}

          {/* Conversation messages */}
          {messages
            .filter(msg => msg.role === 'user')
            .map(userMsg => {
              // Find the corresponding assistant response (next message after user)
              const userMsgIndex = messages.findIndex(m => m.id === userMsg.id);
              const assistantMsg =
                userMsgIndex >= 0 &&
                messages[userMsgIndex + 1]?.role === 'assistant'
                  ? messages[userMsgIndex + 1]
                  : null;

              return (
                <React.Fragment key={userMsg.id}>
                  {/* User Message - Simplified, Left-justified */}
                  <div className='mb-4 mt-12'>
                    {/* Divider */}
                    <div className='mb-6 border-t border-gray-200 dark:border-slate-700' />
                    <div className='group relative inline-block max-w-[70%]'>
                      <div className='mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300'>
                        You
                      </div>
                      <div className='relative px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 border border-blue-200 dark:border-blue-800/50'>
                        <p className='text-sm whitespace-pre-wrap leading-relaxed'>
                          {userMsg.content}
                        </p>
                        {/* Copy button - visible on hover */}
                        <button
                          onClick={() =>
                            handleCopyMessage(userMsg.id, userMsg.content)
                          }
                          className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded'
                          aria-label='Copy message'
                        >
                          {copiedMessageId === userMsg.id ? (
                            <CheckIcon className='w-3.5 h-3.5 text-green-600 dark:text-green-400' />
                          ) : (
                            <ClipboardIcon className='w-3.5 h-3.5 text-gray-500 dark:text-gray-400' />
                          )}
                        </button>
                      </div>
                      {/* Timestamp */}
                      <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                        {formatDistanceToNow(userMsg.timestamp, {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Results - Full Width Below User Message */}
                  {assistantMsg?.data?.type && (
                    <div className='mb-6 w-full'>
                      <ResponseRenderer
                        response={
                          {
                            type: assistantMsg.data.type,
                            message: assistantMsg.content,
                            timestamp: assistantMsg.timestamp,
                            data: assistantMsg.data.data,
                            actions: assistantMsg.data.actions,
                          } as StructuredAIResponse
                        }
                        onPlayTrack={(_trackId: string, track: any) => {
                          playTrack(track);
                        }}
                        onAction={(action: any) => {
                          // Handle actions from response renderers
                          switch (action.type) {
                            case 'search_genre':
                              // Search for top 10 songs in the selected genre
                              performSubmit(
                                `Show me the top 10 ${action.data.genre} songs`
                              );
                              break;
                            case 'play_track':
                              if (action.data.trackId) {
                                // Find track in response data
                                const responseData = assistantMsg.data.data;
                                if (responseData?.tracks) {
                                  const track = responseData.tracks.find(
                                    (t: any) => t.id === action.data.trackId
                                  );
                                  if (track) {
                                    playTrack(track);
                                  }
                                }
                              }
                              break;
                            case 'play_playlist':
                              // TODO: Implement playlist playback
                              break;
                            case 'view_artist':
                              // TODO: Navigate to artist page
                              break;
                            case 'share_track':
                              // Share functionality is handled in renderers
                              break;
                            default:
                              // Unhandled action type
                              break;
                          }
                        }}
                      />

                      {/* Featured Tracks from "other" field - Show for all track results */}
                      {assistantMsg.data?.type === 'track_list' &&
                        assistantMsg.data?.data &&
                        assistantMsg.data.data.other &&
                        Array.isArray(assistantMsg.data.data.other) &&
                        assistantMsg.data.data.other.length > 0 && (
                          <MoreMusicSection
                            tracks={assistantMsg.data.data.other}
                            onTrackPlay={playTrack}
                          />
                        )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}

          {loading && (
            <div className='flex items-center justify-center py-4'>
              <div className='flex gap-1.5'>
                <div className='w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce' />
                <div
                  className='w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce'
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className='w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce'
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className='rounded-xl bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400 p-3 text-sm'>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer anchored fixed at bottom of container */}
        <div className='sticky bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-gray-200 dark:border-slate-700'>
          {/* Information Banner */}
          {isInfoBannerVisible && (
            <ChatInfoBanner
              isExpanded={isInfoBannerExpanded}
              isMinimized={!isInfoBannerExpanded}
              onToggle={() => setIsInfoBannerExpanded(!isInfoBannerExpanded)}
              onClose={() => {
                setIsInfoBannerVisible(false);
                setIsInfoBannerExpanded(false);
              }}
            />
          )}

          {/* Input Form */}
          <div className='border-t border-gray-200 dark:border-slate-700'>
            <form onSubmit={handleSubmit} className='flex gap-3 py-3 px-4'>
              <div className='flex-1 h-12 rounded-full bg-gray-100 dark:bg-slate-800 px-4 flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => {
                    if (!isInfoBannerVisible) {
                      setIsInfoBannerVisible(true);
                      setIsInfoBannerExpanded(false);
                    } else {
                      setIsInfoBannerExpanded(!isInfoBannerExpanded);
                    }
                  }}
                  className='flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors'
                  aria-label='Toggle information'
                >
                  <InformationCircleIcon
                    className={`w-5 h-5 transition-colors ${
                      isInfoBannerVisible
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                </button>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder='Ask for any song, artist, mood, playlist…'
                  disabled={loading}
                  className='flex-1 h-8 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-sm placeholder:text-xs md:placeholder:text-sm placeholder-gray-400 dark:placeholder-gray-500'
                />
              </div>
              <button
                type='submit'
                disabled={!message.trim() || loading}
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                  !message.trim() || loading
                    ? 'bg-blue-200 dark:bg-blue-900/40 text-blue-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white hover:opacity-90 shadow-lg'
                }`}
                aria-label='Send message'
              >
                {loading ? (
                  <svg
                    className='w-5 h-5 animate-spin text-white/80'
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
                    className='w-5 h-5'
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
            </form>
          </div>
        </div>
      </div>
    );
  }
);

AIChat.displayName = 'AIChat';

export default AIChat;
