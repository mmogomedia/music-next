'use client';

import type { TextResponse } from '@/types/ai-responses';
import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SuggestedActions } from './suggested-actions';

interface TextRendererProps {
  response: TextResponse;
  onAction?: (_action: any) => void;
}

function parseMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n');
  const elements: ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const content = trimmed.substring(1).trim();
      elements.push(
        <div key={lineIndex} className='flex items-start gap-2 mb-1'>
          <span className='mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-purple-500 flex-shrink-0' />
          <span>{parseInline(content)}</span>
        </div>
      );
    } else if (trimmed.startsWith('###')) {
      elements.push(
        <p
          key={lineIndex}
          className='text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide mt-3 mb-1'
        >
          {parseInline(trimmed.replace(/^###\s*/, ''))}
        </p>
      );
    } else if (trimmed.startsWith('##')) {
      elements.push(
        <p
          key={lineIndex}
          className='text-sm font-bold text-gray-800 dark:text-gray-100 mt-3 mb-1.5'
        >
          {parseInline(trimmed.replace(/^##\s*/, ''))}
        </p>
      );
    } else if (trimmed) {
      elements.push(
        <Fragment key={lineIndex}>
          {parseInline(trimmed)}
          {lineIndex < lines.length - 1 && <br />}
        </Fragment>
      );
    } else {
      elements.push(<br key={lineIndex} />);
    }
  });

  return elements;
}

function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex)
      parts.push(text.substring(lastIndex, match.index));

    if (match[1] !== undefined) {
      const label = match[1];
      const href = match[2];
      const isInternal = href.startsWith('/');
      parts.push(
        isInternal ? (
          <Link
            key={key++}
            href={href}
            className='text-purple-600 dark:text-purple-400 underline underline-offset-2 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium'
          >
            {label}
          </Link>
        ) : (
          <a
            key={key++}
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            className='text-purple-600 dark:text-purple-400 underline underline-offset-2 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium'
          >
            {label}
          </a>
        )
      );
    } else {
      parts.push(
        <strong
          key={key++}
          className='font-semibold text-gray-900 dark:text-white'
        >
          {match[3]}
        </strong>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts.length > 0 ? parts : [text];
}

const DEFAULT_SUGGESTIONS = [
  { label: 'Play trending music', message: 'Show me trending music right now' },
  { label: 'Show top 10', message: 'Show me the top 10 playlist' },
  { label: 'Love songs', message: 'Show me songs about love' },
  { label: 'Browse genres', message: 'What music genres are available?' },
];

export function TextRenderer({ response, onAction }: TextRendererProps) {
  const content = parseMarkdown(response.message);

  const suggestions = (() => {
    if (!response.actions || response.actions.length === 0)
      return DEFAULT_SUGGESTIONS;
    const filtered = response.actions
      .filter((a: any) => a.type === 'send_message')
      .map((a: any) => ({
        label: a.label as string,
        message: (a.data?.message ?? a.label) as string,
        icon: a.icon as string | undefined,
      }));
    return filtered.length > 0 ? filtered : DEFAULT_SUGGESTIONS;
  })();

  return (
    <div className='rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700/60 overflow-hidden shadow-sm'>
      <div className='flex gap-3 p-4'>
        {/* Flemoji avatar */}
        <div className='flex-shrink-0 mt-0.5'>
          <div className='w-7 h-7 rounded-lg overflow-hidden'>
            <Image
              src='/logo_symbol.png'
              alt='Flemoji AI'
              width={28}
              height={28}
              className='w-full h-full object-cover'
            />
          </div>
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2'>
            Flemoji AI
          </p>
          <div className='text-sm text-gray-700 dark:text-gray-200 leading-relaxed break-words'>
            {content}
          </div>
          <SuggestedActions suggestions={suggestions} onAction={onAction} />
        </div>
      </div>
    </div>
  );
}
