'use client';

import dynamic from 'next/dynamic';

const toolMap = {
  'split-sheet': dynamic(() => import('./split-sheet/SplitSheetTool'), {
    loading: () => <ToolSkeleton />,
  }),
  'revenue-predictor': dynamic(
    () => import('./revenue-predictor/RevenuePredictorTool'),
    {
      loading: () => <ToolSkeleton />,
    }
  ),
};

function ToolSkeleton() {
  return (
    <div className='animate-pulse space-y-4 p-6 rounded-2xl bg-gray-50 dark:bg-slate-800'>
      <div className='h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg' />
      <div className='h-4 w-full bg-gray-200 dark:bg-slate-700 rounded' />
      <div className='h-4 w-3/4 bg-gray-200 dark:bg-slate-700 rounded' />
      <div className='h-40 w-full bg-gray-200 dark:bg-slate-700 rounded-xl' />
    </div>
  );
}

/**
 * Slugs this renderer can actually mount.
 *
 * Registering a tool takes two edits — the registry entry AND an entry in
 * `toolMap` above. Only the registry feeds `generateStaticParams` and
 * sitemap.ts, so a tool added to one but not the other gets submitted to
 * Google as a 200 page with an empty body (a soft 404). The drift guard in
 * `__tests__/tool-renderer-registry.test.ts` fails the build if they diverge.
 */
export const RENDERABLE_TOOL_SLUGS = Object.keys(toolMap);

interface ToolRendererProps {
  slug: string;
}

export function ToolRenderer({ slug }: ToolRendererProps) {
  const Component = toolMap[slug as keyof typeof toolMap];
  if (!Component) return null;
  return (
    <div className='h-full'>
      <Component />
    </div>
  );
}
