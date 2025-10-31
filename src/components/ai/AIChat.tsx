'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Avatar } from '@heroui/react';
import { CopyIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ChatRequest, ChatResponse, AIError, AIProvider } from '@/types/ai';
import ChatQuickActions from './ChatQuickActions';
import ChatTopBar from './ChatTopBar';
import WelcomeHeader from './WelcomeHeader';
import ChatWelcomePlaceholder from './ChatWelcomePlaceholder';
import { ResponseRenderer } from './response-renderers';
import type { AIResponse as StructuredAIResponse } from '@/types/ai-responses';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  error?: boolean;
}

interface AIChatProps {
  context?: {
    userId?: string;
    artistProfile?: string;
    trackInfo?: string;
    playlistInfo?: string;
  };
}

export interface AIChatHandle {
  setMessage: (_message: string) => void;
  submitMessage: (_message: string) => Promise<void>;
}

const AIChat = React.forwardRef<AIChatHandle, AIChatProps>(
  ({ context }, ref) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProvider] = useState<AIProvider | 'auto'>('auto');
    const [selectedProvince, setSelectedProvince] = useState<
      string | undefined
    >();
    const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const performSubmit = async (msg: string) => {
      if (!msg.trim()) return;

      // Add user message to history
      const userMessage: Message = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: msg.trim(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      setLoading(true);

      try {
        const enhancedContext = {
          ...context,
          province: selectedProvince,
          genre: selectedGenre,
        };

        const requestBody: ChatRequest = {
          message: msg.trim(),
          context: enhancedContext,
          provider: selectedProvider === 'auto' ? undefined : selectedProvider,
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

        const responseData = data as ChatResponse;

        // Add assistant message to history
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: responseData.message,
          timestamp: responseData.timestamp,
          data: responseData.data,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage: Message = {
          id: `msg_${Date.now()}_error`,
          role: 'assistant',
          content: err instanceof Error ? err.message : 'An error occurred',
          timestamp: new Date(),
          error: true,
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    };

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
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
    }));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim()) return;

      await performSubmit(message);
      setMessage('');
    };

    const submitQuick = (q: string) => {
      setMessage(q);
    };

    const copyMessage = (content: string, messageId: string) => {
      navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    };

    const formatTime = (date: Date) => {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    };

    return (
      <div className='w-full h-full flex flex-col'>
        {/* Fixed top bar with filters and mini player */}
        <ChatTopBar
          province={selectedProvince}
          genre={selectedGenre}
          onProvinceChange={setSelectedProvince}
          onGenreChange={setSelectedGenre}
        />

        {/* Quick actions - only show when no messages */}
        {messages.length === 0 && (
          <div className='pt-12 pb-3 px-4 lg:px-6'>
            <ChatQuickActions onAction={submitQuick} />
          </div>
        )}

        {/* Welcome message - only show when no messages */}
        {messages.length === 0 && (
          <div className='flex-1 overflow-y-auto px-4 lg:px-6 pb-24'>
            <div className='space-y-6 max-w-3xl mx-auto'>
              <WelcomeHeader onGetStarted={() => {}} />
              <ChatWelcomePlaceholder
                province={selectedProvince}
                genre={selectedGenre}
              />
            </div>
          </div>
        )}

        {/* Messages area with chat bubbles */}
        {messages.length > 0 && (
          <div
            ref={scrollContainerRef}
            className='flex-1 overflow-y-auto pb-24 px-4 lg:px-6'
          >
            <div className='space-y-6 max-w-3xl mx-auto'>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar
                      size='sm'
                      color={msg.error ? 'danger' : 'primary'}
                      name='AI'
                      className='flex-shrink-0'
                    />
                  )}

                  <div
                    className={`group relative max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg'
                        : msg.error
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className='text-sm whitespace-pre-wrap leading-relaxed'>
                      {msg.content}
                    </p>

                    {/* Render structured content for assistant messages */}
                    {msg.role === 'assistant' &&
                      msg.data &&
                      (msg as any).data?.type && (
                        <div className='mt-3'>
                          <ResponseRenderer
                            response={
                              {
                                type: (msg as any).data.type,
                                message: msg.content,
                                timestamp: msg.timestamp,
                                data: (msg as any).data.data,
                              } as StructuredAIResponse
                            }
                          />
                        </div>
                      )}

                    {/* Timestamp */}
                    <div
                      className={`mt-2 text-xs ${
                        msg.role === 'user'
                          ? 'text-blue-100'
                          : msg.error
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </div>

                    {/* Copy button for assistant messages */}
                    {msg.role === 'assistant' && !msg.error && (
                      <button
                        onClick={() => copyMessage(msg.content, msg.id)}
                        className='absolute -bottom-8 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-md hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300'
                        aria-label='Copy message'
                      >
                        {copiedId === msg.id ? (
                          <CheckIcon className='w-4 h-4 text-green-600' />
                        ) : (
                          <CopyIcon className='w-4 h-4' />
                        )}
                      </button>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <Avatar
                      size='sm'
                      color='secondary'
                      name='You'
                      className='flex-shrink-0'
                    />
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className='flex items-start gap-3'>
                  <Avatar size='sm' color='primary' name='AI' />
                  <div className='bg-gray-100 dark:bg-slate-800 rounded-2xl px-4 py-3'>
                    <div className='flex gap-1'>
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' />
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]' />
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]' />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Composer anchored fixed at viewport bottom; respects left sidebar on lg */}
        <div className='fixed bottom-0 right-0 left-0 lg:left-32 z-40 border-t border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-900/80'>
          <form onSubmit={handleSubmit} className='flex gap-3 py-3 px-4'>
            <div className='flex-1 min-h-12 max-h-32 rounded-2xl bg-gray-100 dark:bg-slate-800 px-4 py-3 flex items-center border border-transparent focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all'>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder='Ask for any song, artist, mood, playlist…'
                disabled={loading}
                rows={1}
                className='w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-sm placeholder-gray-500 dark:placeholder-gray-400 max-h-24 overflow-y-auto'
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <Button
              type='submit'
              color='primary'
              isLoading={loading}
              disabled={!message.trim()}
              size='lg'
              radius='lg'
              className='h-12 px-6 font-medium'
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    );
  }
);

AIChat.displayName = 'AIChat';

export default AIChat;
