'use client';

import { Card, CardBody, Chip } from '@heroui/react';
import { PlayIcon, HeartIcon, ClockIcon } from '@heroicons/react/24/outline';

interface RecentActivityProps {
  activity: {
    plays: Array<{
      type: string;
      track: {
        id: string;
        title: string;
        artist: string;
      };
      timestamp: string;
      source: string;
    }>;
    likes: Array<{
      type: string;
      track: {
        id: string;
        title: string;
        artist: string;
      };
      timestamp: string;
    }>;
  };
}

export default function RecentActivity({ activity }: RecentActivityProps) {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'playlist':
        return 'primary';
      case 'landing':
        return 'secondary';
      case 'search':
        return 'success';
      case 'direct':
        return 'warning';
      case 'share':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Combine and sort all activities
  const allActivities = [
    ...activity.plays.map(play => ({ ...play, activityType: 'play' as const })),
    ...activity.likes.map(like => ({ ...like, activityType: 'like' as const })),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card className='border border-gray-200 dark:border-slate-700'>
      <CardBody className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
            Recent Activity
          </h3>
          <ClockIcon className='w-5 h-5 text-gray-400' />
        </div>

        <div className='space-y-3'>
          {allActivities.length === 0 ? (
            <div className='text-center text-gray-500 dark:text-gray-400 py-8'>
              No recent activity
            </div>
          ) : (
            allActivities.slice(0, 10).map((item, index) => (
              <div
                key={`${item.activityType}-${item.track.id}-${index}`}
                className='flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
              >
                <div className='flex-shrink-0'>
                  {item.activityType === 'play' ? (
                    <div className='w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                      <PlayIcon className='w-4 h-4 text-green-600 dark:text-green-400' />
                    </div>
                  ) : (
                    <div className='w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center'>
                      <HeartIcon className='w-4 h-4 text-red-600 dark:text-red-400' />
                    </div>
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                      {item.track.title}
                    </span>
                    {item.activityType === 'play' && (
                      <Chip
                        size='sm'
                        color={getSourceColor(item.source)}
                        variant='flat'
                      >
                        {item.source}
                      </Chip>
                    )}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    {item.track.artist} • {formatTimeAgo(item.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {allActivities.length > 10 && (
          <div className='mt-4 text-center'>
            <button className='text-sm text-blue-600 dark:text-blue-400 hover:underline'>
              View all activity
            </button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
