'use client';

import {
  FireIcon,
  MusicalNoteIcon,
  SparklesIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface ChatQuickActionsProps {
  onAction: (_query: string) => void;
}

const quickActions = [
  {
    id: 'trending',
    label: 'Trending Now',
    icon: FireIcon,
    message: 'Show me the trending music right now',
  },
  {
    id: 'genres',
    label: 'Browse Genres',
    icon: MusicalNoteIcon,
    message: 'What music genres are available?',
  },
  {
    id: 'provinces',
    label: 'Provincial Music',
    icon: GlobeAltIcon,
    message: 'Show me music from different provinces',
  },
  {
    id: 'discover',
    label: 'Discover New Music',
    icon: SparklesIcon,
    message: 'Help me discover new music based on my preferences',
  },
];

export default function ChatQuickActions({ onAction }: ChatQuickActionsProps) {
  return (
    <div className='mb-6'>
      <div className='flex flex-wrap gap-2 justify-center'>
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.message)}
              className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200 border border-transparent hover:border-gray-300 dark:hover:border-slate-600'
            >
              <Icon className='w-4 h-4' />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
