'use client';

import FlemojiModal, { ModalContent } from '@/components/shared/FlemojiModal';
import { Progress } from '@heroui/react';
import {
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface TikTokData {
  followerCount: number;
  videoCount: number;
  videosAnalyzed: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  avgEngagementRate: number;
  avgPerformanceRatio: number;
  videosPerDay: number;
}

interface ScoreBreakdown {
  followerScore: number;
  engagementScore: number;
  consistencyScore: number;
  platformDiversityScore: number;
  totalScore: number;
}

interface ScoreCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiktokData: TikTokData | null;
  scoreBreakdown: ScoreBreakdown | null;
}

export default function ScoreCalculationModal({
  isOpen,
  onClose,
  tiktokData,
  scoreBreakdown,
}: ScoreCalculationModalProps) {
  if (!tiktokData || !scoreBreakdown) {
    return null;
  }

  return (
    <FlemojiModal
      isOpen={isOpen}
      onClose={onClose}
      size='2xl'
      scrollBehavior='outside'
      classNames={{
        base: 'bg-white dark:bg-slate-900 rounded-lg',
        wrapper: 'items-center p-4',
        backdrop: 'overflow-hidden',
      }}
    >
      <ModalContent className='max-h-[75vh] flex flex-col overflow-hidden'>
        {/* Fixed Header */}
        <div className='flex-shrink-0 px-6 py-5 bg-gradient-to-r from-blue-50/70 via-purple-50/40 to-indigo-50/70 dark:from-blue-950/40 dark:via-purple-950/25 dark:to-indigo-950/40 border-b border-gray-200/60 dark:border-slate-800/60'>
          <div className='inline-flex items-center gap-2 mb-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-300/30 dark:border-blue-700/30 rounded-md'>
            <SparklesIcon className='w-4 h-4 text-blue-600 dark:text-blue-400' />
            <span className='text-[10px] font-bold tracking-wider text-blue-700 dark:text-blue-300 uppercase'>
              PULSE³ Score Calculation
            </span>
          </div>
          <h2 className='text-xl md:text-2xl font-black leading-tight'>
            <span className='bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent'>
              Your Eligibility Score
            </span>
          </h2>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            Here&apos;s how we calculated your score from your TikTok data
          </p>
        </div>

        {/* Scrollable Body */}
        <div className='flex-1 overflow-y-auto px-6 py-5'>
          <div className='space-y-6'>
            {/* Total Score Display */}
            <div className='text-center py-6 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-indigo-50/50 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-indigo-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/30'>
              <div className='text-5xl font-black mb-2'>
                <span className='bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent'>
                  {scoreBreakdown.totalScore.toFixed(1)}
                </span>
              </div>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Eligibility Score (out of 100)
              </p>
            </div>

            {/* TikTok Data Summary */}
            <div className='rounded-xl border border-gray-200/70 dark:border-slate-700/70 overflow-hidden bg-white dark:bg-slate-900'>
              <div className='px-4 py-3 bg-gray-50/80 dark:bg-slate-800/40 border-b border-gray-200/70 dark:border-slate-700/70'>
                <h3 className='text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                  <InformationCircleIcon className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                  TikTok Data Used
                </h3>
              </div>
              <div className='p-4 space-y-3'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <p className='text-gray-500 dark:text-gray-400 text-xs mb-1'>
                      Followers
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-white'>
                      {tiktokData.followerCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-500 dark:text-gray-400 text-xs mb-1'>
                      Total Videos
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-white'>
                      {tiktokData.videoCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-500 dark:text-gray-400 text-xs mb-1'>
                      Videos Analyzed
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-white'>
                      {tiktokData.videosAnalyzed}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-500 dark:text-gray-400 text-xs mb-1'>
                      Total Engagement
                    </p>
                    <p className='font-semibold text-gray-900 dark:text-white'>
                      {(
                        tiktokData.totalLikes +
                        tiktokData.totalComments +
                        tiktokData.totalShares
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className='space-y-4'>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                Score Breakdown
              </h3>

              {/* Follower Score */}
              <div className='rounded-lg border border-gray-200/70 dark:border-slate-700/70 p-4 bg-white dark:bg-slate-900'>
                <div className='flex items-center justify-between mb-2'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                      Audience Score
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      30% weight • Based on follower count
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-lg font-bold text-gray-900 dark:text-white'>
                      {scoreBreakdown.followerScore.toFixed(1)}
                    </p>
                  </div>
                </div>
                <Progress
                  value={scoreBreakdown.followerScore}
                  className='mt-2'
                  color='primary'
                  size='sm'
                />
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
                  {tiktokData.followerCount.toLocaleString()} followers →{' '}
                  {scoreBreakdown.followerScore.toFixed(1)} points (logarithmic
                  scale)
                </p>
              </div>

              {/* Engagement Score */}
              <div className='rounded-lg border border-gray-200/70 dark:border-slate-700/70 p-4 bg-white dark:bg-slate-900'>
                <div className='flex items-center justify-between mb-2'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                      Engagement Score
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      40% weight • Based on engagement rate & performance
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-lg font-bold text-gray-900 dark:text-white'>
                      {scoreBreakdown.engagementScore.toFixed(1)}
                    </p>
                  </div>
                </div>
                <Progress
                  value={scoreBreakdown.engagementScore}
                  className='mt-2'
                  color='primary'
                  size='sm'
                />
                <div className='text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1'>
                  <p>
                    Avg engagement rate:{' '}
                    {(tiktokData.avgEngagementRate * 100).toFixed(2)}%
                  </p>
                  <p>
                    Avg performance:{' '}
                    {(tiktokData.avgPerformanceRatio * 100).toFixed(1)}% of
                    followers
                  </p>
                </div>
              </div>

              {/* Consistency Score */}
              <div className='rounded-lg border border-gray-200/70 dark:border-slate-700/70 p-4 bg-white dark:bg-slate-900'>
                <div className='flex items-center justify-between mb-2'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                      Consistency Score
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      20% weight • Based on posting frequency
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-lg font-bold text-gray-900 dark:text-white'>
                      {scoreBreakdown.consistencyScore.toFixed(1)}
                    </p>
                  </div>
                </div>
                <Progress
                  value={scoreBreakdown.consistencyScore}
                  className='mt-2'
                  color='primary'
                  size='sm'
                />
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
                  {tiktokData.videosPerDay.toFixed(2)} videos per day →{' '}
                  {scoreBreakdown.consistencyScore.toFixed(1)} points
                </p>
              </div>

              {/* Platform Diversity Score */}
              <div className='rounded-lg border border-gray-200/70 dark:border-slate-700/70 p-4 bg-white dark:bg-slate-900'>
                <div className='flex items-center justify-between mb-2'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                      Presence Score
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      10% weight • Based on connected platforms
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-lg font-bold text-gray-900 dark:text-white'>
                      {scoreBreakdown.platformDiversityScore.toFixed(1)}
                    </p>
                  </div>
                </div>
                <Progress
                  value={scoreBreakdown.platformDiversityScore}
                  className='mt-2'
                  color='primary'
                  size='sm'
                />
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
                  TikTok connected →{' '}
                  {scoreBreakdown.platformDiversityScore.toFixed(1)} points
                </p>
              </div>
            </div>

            {/* Final Calculation */}
            <div className='rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-950/20 p-4'>
              <p className='text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                Final Calculation:
              </p>
              <p className='text-xs text-gray-600 dark:text-gray-400 leading-relaxed'>
                ({scoreBreakdown.followerScore.toFixed(1)} × 30%) + (
                {scoreBreakdown.engagementScore.toFixed(1)} × 40%) + (
                {scoreBreakdown.consistencyScore.toFixed(1)} × 20%) + (
                {scoreBreakdown.platformDiversityScore.toFixed(1)} × 10%) ={' '}
                <span className='font-bold text-blue-600 dark:text-blue-400'>
                  {scoreBreakdown.totalScore.toFixed(1)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </ModalContent>
    </FlemojiModal>
  );
}
