'use client';

import type { TextResponse } from '@/types/ai-responses';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Fragment, type ReactNode } from 'react';

interface TextRendererProps {
  response: TextResponse;
}

/**
 * Parses markdown-like text and returns React elements
 * Supports: **bold** and bullet points
 */
function parseMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n');
  const elements: ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Handle bullet points
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const content = trimmed.substring(1).trim();
      // Parse bold text within bullet content
      const parts = parseBoldText(content);
      elements.push(
        <div key={lineIndex} className='ml-4 mb-1'>
          • {parts}
        </div>
      );
    } else if (trimmed) {
      // Regular line with potential bold text
      const parts = parseBoldText(trimmed);
      elements.push(
        <Fragment key={lineIndex}>
          {parts}
          {lineIndex < lines.length - 1 && <br />}
        </Fragment>
      );
    } else {
      // Empty line
      elements.push(<br key={lineIndex} />);
    }
  });

  return elements;
}

/**
 * Parses **bold** text and returns React elements
 */
function parseBoldText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add bold text
    parts.push(
      <strong key={key++} className='font-semibold'>
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no matches, return the original text
  return parts.length > 0 ? parts : [text];
}

/**
 * Renders simple text responses from AI
 * Matches the flat design style of other response renderers
 * Uses neutral gray to distinguish from user chat bubbles (which are blue)
 */
export function TextRenderer({ response }: TextRendererProps) {
  const content = parseMarkdown(response.message);

  // Use neutral gray background - clearly different from blue user chat bubbles
  return (
    <div className='rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4'>
      <div className='flex gap-3'>
        <div className='flex-shrink-0 mt-0.5'>
          <InformationCircleIcon className='w-5 h-5 text-gray-500 dark:text-gray-400' />
        </div>
        <div className='flex-1 min-w-0'>
          <div className='text-gray-600 dark:text-gray-300 leading-relaxed break-words overflow-wrap-anywhere'>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
