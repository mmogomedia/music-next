'use client';

import type { TextResponse } from '@/types/ai-responses';

interface TextRendererProps {
  response: TextResponse;
}

/**
 * Renders simple text responses from AI
 */
export function TextRenderer({ response }: TextRendererProps) {
  return (
    <div className='rounded-lg bg-gray-50 dark:bg-slate-800 p-4'>
      <p className='text-gray-900 dark:text-white whitespace-pre-wrap'>
        {response.message}
      </p>
    </div>
  );
}
