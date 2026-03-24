'use client';

import {
  ShareIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import FCard from '@/components/ui/FCard';
import FButton from '@/components/ui/FButton';

interface ProfileURLProps {
  slug: string;
  artistName: string;
}

export default function ProfileURL({ slug, artistName }: ProfileURLProps) {
  const getUrl = () =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/artist/${slug}`
      : `https://flemoji.com/artist/${slug}`;

  const handleShare = () => {
    const url = getUrl();
    if (navigator.share) {
      navigator.share({
        title: `${artistName} - Artist Profile`,
        text: `Check out ${artistName}'s music on Flemoji`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Profile URL copied to clipboard!');
    }
  };

  const handleView = () => {
    window.open(getUrl(), '_blank');
  };

  return (
    <FCard variant='default' padding='sm'>
      <div className='flex items-center gap-2 mb-3'>
        <ShareIcon className='w-4 h-4 text-gray-400 dark:text-gray-500' />
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
        <FButton
          size='md'
          variant='primary'
          className='w-1/2'
          startContent={<ShareIcon className='w-4 h-4' />}
          onPress={handleShare}
        >
          Share
        </FButton>
        <FButton
          size='md'
          variant='outline'
          className='w-1/2'
          startContent={<ArrowTopRightOnSquareIcon className='w-4 h-4' />}
          onPress={handleView}
        >
          View
        </FButton>
      </div>
    </FCard>
  );
}
