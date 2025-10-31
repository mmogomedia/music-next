'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Avatar } from '@heroui/react';
import { ChatRequest, ChatResponse, AIError, AIProvider } from '@/types/ai';
import ChatQuickActions from './ChatQuickActions';
import ChatTopBar from './ChatTopBar';
import WelcomeHeader from './WelcomeHeader';
import ChatWelcomePlaceholder from './ChatWelcomePlaceholder';
import { ResponseRenderer } from './response-renderers';
import type { AIResponse as StructuredAIResponse } from '@/types/ai-responses';
import { formatDistanceToNow } from 'date-fns';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  timestamp: Date;
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
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedProvider] = useState<AIProvider | 'auto'>('auto');
    const [selectedProvince, setSelectedProvince] = useState<
      string | undefined
    >();
    const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const performSubmit = async (msg: string) => {
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

        const chatResponse = data as ChatResponse;

        // Add AI response to conversation
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: chatResponse.message,
          data: chatResponse.data,
          timestamp: new Date(chatResponse.timestamp),
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
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

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    const DemoArea = () => (
      <div className='space-y-6'>
        <WelcomeHeader onGetStarted={() => {}} />
        <ChatWelcomePlaceholder
          province={selectedProvince}
          genre={selectedGenre}
        />
      </div>
    );

    return (
      <div className='w-full'>
        {/* Fixed top bar with filters and mini player */}
        <ChatTopBar
          province={selectedProvince}
          genre={selectedGenre}
          onProvinceChange={setSelectedProvince}
          onGenreChange={setSelectedGenre}
        />

        {/* Content spacing below fixed header */}
        <div className='pt-12 pb-3 px-4 lg:px-6'>
          {messages.length === 0 && <ChatQuickActions onAction={submitQuick} />}
        </div>

        {/* Scrollable messages area */}
        <div className='relative flex flex-col' style={{ minHeight: '60vh' }}>
          <div className='flex-1 overflow-y-auto pb-20 space-y-4 px-4 lg:px-6'>
            {messages.length === 0 ? (
              <DemoArea />
            ) : (
              <>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`group relative flex items-start gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar size='sm' color='primary' name='AI' />
                    )}
                    <div
                      className={`relative flex-1 max-w-[85%] lg:max-w-[75%] rounded-2xl p-4 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50/60 dark:bg-blue-900/10 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <p className='text-sm whitespace-pre-wrap leading-relaxed'>
                        {msg.content}
                      </p>
                      {/* Render structured content for AI messages */}
                      {msg.role === 'assistant' &&
                        msg.data &&
                        msg.data?.type && (
                          <div className='mt-3'>
                            <ResponseRenderer
                              response={
                                {
                                  type: msg.data.type,
                                  message: msg.content,
                                  timestamp: msg.timestamp,
                                  data: msg.data.data,
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
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatDistanceToNow(msg.timestamp, {
                          addSuffix: true,
                        })}
                      </div>
                      {/* Copy button - visible on hover */}
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg'
                        aria-label='Copy message'
                      >
                        {copiedMessageId === msg.id ? (
                          <CheckIcon className='w-4 h-4 text-green-500' />
                        ) : (
                          <ClipboardIcon
                            className={`w-4 h-4 ${
                              msg.role === 'user'
                                ? 'text-blue-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          />
                        )}
                      </button>
                    </div>
                    {msg.role === 'user' && (
                      <Avatar size='sm' color='default' name='You' />
                    )}
                  </div>
                ))}
                {loading && (
                  <div className='flex items-start gap-3'>
                    <Avatar size='sm' color='primary' name='AI' />
                    <div className='flex-1 rounded-2xl bg-blue-50/60 dark:bg-blue-900/10 p-4'>
                      <div className='flex gap-1'>
                        <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' />
                        <div
                          className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                          style={{ animationDelay: '0.1s' }}
                        />
                        <div
                          className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                          style={{ animationDelay: '0.2s' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className='rounded-xl bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400 p-3 text-sm'>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer anchored fixed at viewport bottom; respects left sidebar on lg */}
          <div className='fixed bottom-0 right-0 left-0 lg:left-32 z-40 border-t border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur'>
            <form onSubmit={handleSubmit} className='flex gap-3 py-3 px-4'>
              <div className='flex-1 h-12 rounded-full bg-gray-100 dark:bg-slate-800 px-4 flex items-center'>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder='Ask for any song, artist, mood, playlist…'
                  disabled={loading}
                  className='w-full h-8 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-sm placeholder-gray-400 dark:placeholder-gray-500'
                />
              </div>
              <Button
                type='submit'
                color='primary'
                isLoading={loading}
                disabled={!message.trim()}
                size='md'
                radius='full'
                className='h-12 px-5'
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }
);

AIChat.displayName = 'AIChat';

export default AIChat;
