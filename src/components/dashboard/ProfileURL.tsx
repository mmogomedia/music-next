'use client';

import { Button } from '@heroui/react';
import {
  ShareIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface ProfileURLProps {
  slug: string;
  artistName: string;
}

export default function ProfileURL({ slug, artistName }: ProfileURLProps) {
  const handleShare = () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/artist/${slug}`
        : `https://flemoji.com/artist/${slug}`;

    if (navigator.share) {
      navigator.share({
        title: `${artistName} - Artist Profile`,
        text: `Check out ${artistName}'s music on Flemoji`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Profile URL copied to clipboard!');
    }
  };

  const handleView = () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/artist/${slug}`
        : `https://flemoji.com/artist/${slug}`;
    window.open(url, '_blank');
  };

  return (
    <div className='bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700'>
      <div className='flex items-center gap-2 mb-3'>
        <div className='w-5 h-5 bg-slate-600 dark:bg-slate-500 rounded-md flex items-center justify-center'>
          <ShareIcon className='w-3 h-3 text-white' />
        </div>
        <h4 className='font-medium text-slate-900 dark:text-white text-sm'>
          Your Profile
        </h4>
      </div>
      <div className='bg-slate-100 dark:bg-slate-700 rounded-lg p-2 mb-3'>
        <code className='text-xs text-slate-600 dark:text-slate-300 break-all leading-relaxed'>
          {typeof window !== 'undefined'
            ? `${window.location.origin}/artist/${slug}`
            : `https://flemoji.com/artist/${slug}`}
        </code>
      </div>
      <div className='flex gap-1.5'>
        <Button
          size='md'
          color='primary'
          variant='solid'
          className='w-1/2'
          startContent={<ShareIcon className='w-4 h-4' />}
          onPress={handleShare}
        >
          Share
        </Button>
        <Button
          size='md'
          variant='bordered'
          color='default'
          className='w-1/2'
          startContent={<ArrowTopRightOnSquareIcon className='w-4 h-4' />}
          onPress={handleView}
        >
          View
        </Button>
      </div>
    </div>
  );
}
