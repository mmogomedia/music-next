'use client';

import { useRef, FormEvent, KeyboardEvent } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface ChatInputProps {
  message: string;
  onMessageChange: (_value: string) => void;
  onSubmit: (_e: FormEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onInfoClick?: () => void;
  showInfoButton?: boolean;
  className?: string;
  containerClassName?: string;
}

export default function ChatInput({
  message,
  onMessageChange,
  onSubmit,
  loading = false,
  disabled = false,
  placeholder = 'Ask for any song, artist, mood, playlist…',
  onInfoClick,
  showInfoButton = true,
  className = '',
  containerClassName = '',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-40 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur border-t border-gray-200/50 dark:border-slate-700/50 ${containerClassName}`}
    >
      <form onSubmit={onSubmit} className='py-3'>
        <div className='w-full px-4 sm:px-6 lg:px-8'>
          <div className='h-12 rounded-full bg-gray-100 dark:bg-slate-800 px-4 flex items-center gap-2'>
            {showInfoButton && (
              <button
                type='button'
                className='flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors'
                aria-label='Information'
                onClick={onInfoClick}
              >
                <InformationCircleIcon className='w-5 h-5 text-gray-400 dark:text-gray-500' />
              </button>
            )}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => onMessageChange(e.target.value)}
              placeholder={placeholder}
              disabled={loading || disabled}
              className={`flex-1 h-8 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-sm placeholder:text-xs md:placeholder:text-sm placeholder-gray-400 dark:placeholder-gray-500 ${className}`}
              rows={1}
              onKeyDown={handleKeyDown}
            />
            <button
              type='submit'
              disabled={!message.trim() || loading || disabled}
              className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                !message.trim() || loading || disabled
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
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 12h14m-7-7l7 7-7 7'
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
