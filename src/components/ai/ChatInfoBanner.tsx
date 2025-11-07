'use client';

import React, { useEffect, useState } from 'react';
import {
  InformationCircleIcon,
  XMarkIcon,
  MusicalNoteIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface ChatInfoBannerProps {
  isExpanded: boolean;
  isMinimized: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function ChatInfoBanner({
  isExpanded,
  isMinimized,
  onToggle,
  onClose,
  }: ChatInfoBannerProps) {
    const [mounted, setMounted] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) return null;

  const isVisible = isMinimized || isExpanded;

  if (!isVisible) {
    return null;
  }

  const features = [
    {
      icon: MusicalNoteIcon,
      text: 'Discover and stream songs',
    },
    {
      icon: UserGroupIcon,
      text: 'Get information about artists',
    },
    {
      icon: SparklesIcon,
      text: 'Find playlists by mood or genre',
    },
  ];

  const iconBadge = (
    <div className='flex-shrink-0 rounded-xl bg-white/80 dark:bg-blue-950/40 p-2 shadow-sm border border-blue-200/60 dark:border-blue-800/40'>
      <InformationCircleIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
    </div>
  );

  if (isMobileView) {
    return (
      <div className='px-3 py-2'>
        <div className='rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100/60 dark:border-blue-900/40 shadow-sm p-3'>
          <div className='flex items-start gap-2'>
            {iconBadge}
            <div className='flex-1 min-w-0'>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight'>
                Flemoji AI Chat
              </h3>
              <p className='text-xs text-gray-600 dark:text-gray-400 mt-0.5'>
                Ask for songs, artists, or playlists.
              </p>
              {!isExpanded && (
                <div className='mt-1.5 px-2 py-1 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg'>
                  <p className='text-[11px] text-blue-600 dark:text-blue-300 italic'>
                    Example: &quot;Play amapiano hits&quot;
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className='flex-shrink-0 p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors'
              aria-label='Close banner'
            >
              <XMarkIcon className='w-4 h-4 text-gray-600 dark:text-gray-400' />
            </button>
          </div>

          {isExpanded && (
            <div className='mt-3 space-y-1.5'>
              <p className='text-[11px] text-gray-600 dark:text-gray-400'>I can help you:</p>
              <ul className='space-y-1.5'>
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <li key={idx} className='flex items-center gap-2'>
                      <Icon className='w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0' />
                      <span className='text-[11px] text-gray-600 dark:text-gray-400'>
                        {feature.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className='mt-3 flex flex-wrap gap-2'>
            <button
              onClick={onToggle}
              className='px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors'
            >
              {isExpanded ? 'Hide details' : 'Show details'}
            </button>
            <button
              onClick={onClose}
              className='px-3 py-1.5 text-xs text-gray-500 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='px-4 py-2'>
      <div
        className={`rounded-t-2xl rounded-b-none px-4 bg-blue-50/60 dark:bg-blue-950/20 ${
          isExpanded ? 'py-3.5' : 'py-2.5'
        } transition-all duration-300 ease-out`}
      >
        {isExpanded ? (
          <div className='flex flex-col gap-3'>
            <div className='flex items-start gap-3'>
              {iconBadge}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between gap-2 mb-2'>
                  <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight'>
                    Chat with Flemoji AI
                  </h3>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={onToggle}
                      className='flex-shrink-0 p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors'
                      aria-label='Minimize banner'
                    >
                      <XMarkIcon className='w-4 h-4 text-gray-600 dark:text-gray-400 rotate-45' />
                    </button>
                    <button
                      onClick={onClose}
                      className='flex-shrink-0 p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors'
                      aria-label='Close banner'
                    >
                      <XMarkIcon className='w-4 h-4 text-gray-600 dark:text-gray-400' />
                    </button>
                  </div>
                </div>
                <p className='text-xs text-gray-700 dark:text-gray-300'>
                  Ask me anything about music! I can help you:
                </p>
                <ul className='space-y-2 mt-2'>
                  {features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <li key={idx} className='flex items-center gap-2'>
                        <Icon className='w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0' />
                        <span className='text-xs text-gray-600 dark:text-gray-400'>
                          {feature.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
            <div className='flex items-start gap-3'>
              {iconBadge}
              <div className='flex-1 min-w-0'>
                <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight'>
                  Chat with Flemoji AI
                </h3>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-0.5'>
                  Chat with AI to discover music, artists, and playlists
                </p>
                <div className='mt-1.5 px-2 py-1 bg-white/80 dark:bg-slate-800/60 rounded-md border border-blue-200/50 dark:border-blue-800/50'>
                  <p className='text-xs text-gray-700 dark:text-gray-300 italic'>
                    Example: &quot;Play songs by Caeser&quot; or &quot;Show me amapiano tracks&quot;
                  </p>
                </div>
              </div>
            </div>
            <div className='flex flex-wrap gap-2 sm:flex-nowrap sm:items-center'>
              <button
                onClick={onToggle}
                className='px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors'
                aria-label='Expand banner'
              >
                Learn more
              </button>
              <button
                onClick={onClose}
                className='p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors'
                aria-label='Close banner'
              >
                <XMarkIcon className='w-4 h-4 text-gray-600 dark:text-gray-400' />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
