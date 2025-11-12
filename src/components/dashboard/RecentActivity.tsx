'use client';

import { Card, CardBody, Chip } from '@heroui/react';
import {
  PlayIcon,
  HeartIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ActivityItem {
  id: string;
  activityType: 'play' | 'like' | 'download' | 'page_visit';
  track: {
    id: string;
    title: string;
    artist: string;
  };
  timestamp: string;
  source?: string;
  slug?: string;
}

interface RecentActivityProps {
  activity?: {
    plays: Array<{
      type: string;
      track: {
        id: string;
        title: string;
        artist: string;
      };
      timestamp: string;
      source?: string;
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
    downloads: Array<{
      type: string;
      track: {
        id: string;
        title: string;
        artist: string;
      };
      timestamp: string;
    }>;
    pageVisits: Array<{
      type: string;
      track: {
        id: string;
        title: string;
        artist: string;
      };
      timestamp: string;
      slug?: string;
    }>;
  };
  useSSE?: boolean; // Enable SSE for real-time updates
  scope?: 'user' | 'admin';
}

export default function RecentActivity({
  activity,
  useSSE = true,
  scope = 'user',
}: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const displayActivities = useMemo(() => {
    const sortedActivities = [...activities].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const prioritized: ActivityItem[] = [];
    const priorityOrder: ActivityItem['activityType'][] = [
      'play',
      'download',
      'page_visit',
      'like',
    ];

    priorityOrder.forEach(type => {
      const item = sortedActivities.find(
        activity => activity.activityType === type
      );
      if (item && !prioritized.includes(item)) {
        prioritized.push(item);
      }
    });

    sortedActivities.forEach(item => {
      if (!prioritized.includes(item) && prioritized.length < 6) {
        prioritized.push(item);
      }
    });

    return prioritized.slice(0, 6);
  }, [activities]);

  // Initialize activities from props
  useEffect(() => {
    if (activity) {
      const initialActivities: ActivityItem[] = [
        ...(activity.plays || []).map((play, index) => ({
          id: `play-${play.track.id}-${index}`,
          activityType: 'play' as const,
          track: play.track,
          timestamp: play.timestamp,
          source: play.source,
        })),
        ...(activity.likes || []).map((like, index) => ({
          id: `like-${like.track.id}-${index}`,
          activityType: 'like' as const,
          track: like.track,
          timestamp: like.timestamp,
        })),
        ...(activity.downloads || []).map((download, index) => ({
          id: `download-${download.track.id}-${index}`,
          activityType: 'download' as const,
          track: download.track,
          timestamp: download.timestamp,
        })),
        ...(activity.pageVisits || []).map((visit, index) => ({
          id: `page_visit-${visit.track.id}-${index}`,
          activityType: 'page_visit' as const,
          track: visit.track,
          timestamp: visit.timestamp,
          slug: visit.slug,
        })),
      ].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setActivities(initialActivities);
    }
  }, [activity]);

  // Setup SSE connection
  useEffect(() => {
    if (!useSSE) return;

    const endpoint =
      scope === 'admin'
        ? '/api/admin/dashboard-activity/stream'
        : '/api/dashboard/activity/stream';

    const connectSSE = () => {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(endpoint);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = event => {
        try {
          const message = JSON.parse(event.data);

          // Ignore heartbeat and connection messages
          if (message.type === 'heartbeat' || message.type === 'connected') {
            return;
          }

          if (message.type === 'error') {
            console.error('SSE error:', message.data);
            return;
          }

          // Add new activity
          if (message.type && message.data) {
            const newActivity: ActivityItem = {
              id: `${message.type}-${message.data.track.id}-${Date.now()}`,
              activityType: message.type as ActivityItem['activityType'],
              track: message.data.track,
              timestamp: message.data.timestamp,
              source: message.data.source,
              slug: message.data.slug,
            };

            setActivities(prev => {
              // Avoid duplicates
              const exists = prev.some(
                a =>
                  a.activityType === newActivity.activityType &&
                  a.track.id === newActivity.track.id &&
                  Math.abs(
                    new Date(a.timestamp).getTime() -
                      new Date(newActivity.timestamp).getTime()
                  ) < 5000 // Within 5 seconds
              );

              if (exists) return prev;

              // Add new activity and keep only last 20
              return [newActivity, ...prev]
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
                )
                .slice(0, 20);
            });

            // Reset reconnect attempts on successful message
            reconnectAttempts.current = 0;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = error => {
        console.error('SSE connection error:', error);
        eventSource.close();

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, delay);
        } else {
          console.warn('Max reconnection attempts reached. SSE disabled.');
        }
      };
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [useSSE, scope]);

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

  const getSourceColor = (source?: string) => {
    if (!source) return 'default';
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

  const getActivityIcon = (activityType: ActivityItem['activityType']) => {
    switch (activityType) {
      case 'play':
        return (
          <div className='w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
            <PlayIcon className='w-4 h-4 text-green-600 dark:text-green-400' />
          </div>
        );
      case 'like':
        return (
          <div className='w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center'>
            <HeartIcon className='w-4 h-4 text-red-600 dark:text-red-400' />
          </div>
        );
      case 'download':
        return (
          <div className='w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center'>
            <ArrowDownTrayIcon className='w-4 h-4 text-orange-600 dark:text-orange-400' />
          </div>
        );
      case 'page_visit':
        return (
          <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center'>
            <EyeIcon className='w-4 h-4 text-blue-600 dark:text-blue-400' />
          </div>
        );
      default:
        return null;
    }
  };

  const getActivityLabel = (activityType: ActivityItem['activityType']) => {
    switch (activityType) {
      case 'play':
        return 'Played';
      case 'like':
        return 'Liked';
      case 'download':
        return 'Downloaded';
      case 'page_visit':
        return 'Page visit';
      default:
        return 'Activity';
    }
  };

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
          {activities.length === 0 ? (
            <div className='text-center text-gray-500 dark:text-gray-400 py-8'>
              No recent activity
            </div>
          ) : (
            displayActivities.map(item => (
              <div
                key={item.id}
                className='flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
              >
                <div className='flex-shrink-0'>
                  {getActivityIcon(item.activityType)}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                      {item.track.title}
                    </span>
                    {item.activityType === 'play' && item.source && (
                      <Chip
                        size='sm'
                        color={getSourceColor(item.source)}
                        variant='flat'
                      >
                        {item.source}
                      </Chip>
                    )}
                    {item.activityType === 'page_visit' && item.slug && (
                      <Chip size='sm' color='secondary' variant='flat'>
                        Quick Link
                      </Chip>
                    )}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    {getActivityLabel(item.activityType)} • {item.track.artist}{' '}
                    • {formatTimeAgo(item.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {activities.length > 6 && (
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
