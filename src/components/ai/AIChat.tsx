'use client';

import React, { useState, useRef } from 'react';
import { Button, Avatar } from '@heroui/react';
import { ChatRequest, ChatResponse, AIError, AIProvider } from '@/types/ai';
import ChatQuickActions from './ChatQuickActions';
import ChatTopBar from './ChatTopBar';
import WelcomeHeader from './WelcomeHeader';
import ChatWelcomePlaceholder from './ChatWelcomePlaceholder';

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
    const [response, setResponse] = useState<ChatResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedProvider] = useState<AIProvider | 'auto'>('auto');
    const [selectedProvince, setSelectedProvince] = useState<
      string | undefined
    >();
    const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const performSubmit = async (msg: string) => {
      if (!msg.trim()) return;

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

        setResponse(data as ChatResponse);
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
          <ChatQuickActions onAction={submitQuick} />
        </div>

        {/* Scrollable messages area (no raised cards) */}
        <div className='relative flex flex-col' style={{ minHeight: '60vh' }}>
          <div className='flex-1 overflow-y-auto pb-20 space-y-4 px-4 lg:px-6'>
            {response ? (
              <div className='flex items-start gap-3'>
                <Avatar size='sm' color='primary' name='AI' />
                <div className='flex-1 rounded-2xl bg-blue-50/60 dark:bg-blue-900/10 p-4'>
                  <p className='text-sm whitespace-pre-wrap'>
                    {response.message}
                  </p>
                </div>
              </div>
            ) : (
              <DemoArea />
            )}

            {error && (
              <div className='rounded-xl bg-red-50 text-red-900 p-3 text-sm'>
                {error}
              </div>
            )}
          </div>

          {/* Composer anchored fixed at viewport bottom; respects left sidebar on lg */}
          <div className='fixed bottom-0 right-0 left-0 lg:left-64 z-40 border-t border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur'>
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
