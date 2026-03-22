'use client';

import { useState } from 'react';
import { Card, CardBody, Button, Chip, Progress } from '@heroui/react';
import {
  SparklesIcon,
  ChartBarIcon,
  InformationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import PulseNotTrackedModal from './PulseNotTrackedModal';
import PulseInfoModal from './PulseInfoModal';
import PulseCalculateModal from './PulseCalculateModal';

interface EligibilityScoreComponents {
  followerScore: number;
  engagementScore: number;
  consistencyScore: number;
  platformDiversityScore: number;
}

interface PulseData {
  eligibilityScore: number | null;
  eligibilityComponents: EligibilityScoreComponents | null;
  momentumScore: number | null;
  position: number | null; // 1-100 if actively tracked
  isActivelyMonitored: boolean;
  hasConnection: boolean; // Has TikTok/Spotify connected
}

interface PulseCardProps {
  pulseData: PulseData | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function PulseCard({
  pulseData,
  loading,
  onRefresh,
}: PulseCardProps) {
  const router = useRouter();
  const [showNotTrackedModal, setShowNotTrackedModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);

  // No connection - show connect prompt
  if (!pulseData?.hasConnection) {
    return (
      <>
        <Card className='border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-md transition-shadow shadow-none h-full'>
          <CardBody className='p-4'>
            <div className='flex items-start gap-3'>
              <div className='w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0'>
                <SparklesIcon className='w-6 h-6 text-white' />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1.5'>
                  <h3 className='text-base font-bold text-gray-900 dark:text-white'>
                    PULSE³
                  </h3>
                  <Chip
                    size='sm'
                    variant='flat'
                    color='primary'
                    className='h-5 text-xs'
                  >
                    New
                  </Chip>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed'>
                  Connect your social platforms and streaming profiles to track
                  momentum and see your ranking on the Top 100 chart.
                </p>
                <div className='flex gap-2'>
                  <Button
                    color='primary'
                    size='sm'
                    className='h-8 text-xs'
                    onPress={() => router.push('/pulse/connect')}
                    endContent={<ArrowRightIcon className='w-3.5 h-3.5' />}
                  >
                    Connect
                  </Button>
                  <Button
                    size='sm'
                    variant='light'
                    className='h-8 text-xs'
                    onPress={() => setShowInfoModal(true)}
                  >
                    What is PULSE³?
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
        {showNotTrackedModal && (
          <PulseNotTrackedModal
            isOpen={showNotTrackedModal}
            onClose={() => setShowNotTrackedModal(false)}
          />
        )}
        {showInfoModal && (
          <PulseInfoModal
            isOpen={showInfoModal}
            onClose={() => setShowInfoModal(false)}
          />
        )}
      </>
    );
  }

  // Loading state
  if (loading || !pulseData) {
    return (
      <Card className='border border-gray-200 dark:border-slate-700 shadow-none h-full'>
        <CardBody className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse' />
            <div className='flex-1 space-y-2'>
              <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3 animate-pulse' />
              <div className='h-2 bg-gray-200 dark:bg-slate-700 rounded w-2/3 animate-pulse' />
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Has connection but no eligibility score yet (needs calculation)
  if (pulseData.hasConnection && pulseData.eligibilityScore === null) {
    return (
      <>
        <Card className='border border-gray-200 dark:border-slate-700 shadow-none h-full'>
          <CardBody className='p-4'>
            <div className='flex items-start gap-3'>
              <div className='w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0'>
                <SparklesIcon className='w-6 h-6 text-white' />
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='text-base font-bold text-gray-900 dark:text-white mb-1.5'>
                  PULSE³
                </h3>
                <p className='text-xs text-gray-600 dark:text-gray-400 mb-3'>
                  Your scores haven&apos;t been calculated yet. Click below to
                  calculate your eligibility and momentum scores.
                </p>
                <Button
                  color='primary'
                  size='sm'
                  className='h-8 text-xs'
                  onPress={() => setShowCalculateModal(true)}
                >
                  Calculate Scores
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
        <PulseCalculateModal
          isOpen={showCalculateModal}
          onClose={() => {
            setShowCalculateModal(false);
          }}
          onCalculate={async () => {
            const response = await fetch('/api/pulse/calculate', {
              method: 'POST',
            });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to calculate scores');
            }
            const result = await response.json();
            // Refresh data after successful calculation
            if (onRefresh) {
              onRefresh();
            } else {
              router.refresh();
            }
            return result;
          }}
          hasExistingScore={false}
          components={null}
        />
      </>
    );
  }

  const eligibilityScore = pulseData.eligibilityScore ?? 0;
  const momentumScore = pulseData.momentumScore;
  const isMonitored = pulseData.isActivelyMonitored;
  const position = pulseData.position;

  return (
    <>
      <Card className='border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow h-full w-full flex flex-col shadow-none'>
        <CardBody className='p-4 flex-1 flex flex-col'>
          <div className='flex items-start justify-between mb-3'>
            <div className='flex items-center gap-2.5'>
              <div className='w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0'>
                <SparklesIcon className='w-6 h-6 text-white' />
              </div>
              <div>
                <h3 className='text-base font-bold text-gray-900 dark:text-white'>
                  PULSE³
                </h3>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Momentum intelligence
                </p>
              </div>
            </div>
            {isMonitored && (
              <Chip
                size='sm'
                color='success'
                variant='flat'
                className='h-5 text-xs'
              >
                Monitored
              </Chip>
            )}
          </div>

          <div className='grid grid-cols-2 gap-3'>
            {/* Eligibility Score */}
            <div className='bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3'>
              <div className='flex items-center justify-between mb-1.5'>
                <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                  Eligibility
                </span>
                <div className='flex items-center gap-1.5'>
                  <Button
                    size='sm'
                    variant='light'
                    className='h-6 text-[10px] min-w-0 px-2'
                    onPress={() => setShowCalculateModal(true)}
                  >
                    Recalculate
                  </Button>
                  <InformationCircleIcon className='w-3.5 h-3.5 text-gray-400' />
                </div>
              </div>
              <div className='flex items-baseline gap-1.5 mb-1.5'>
                <span className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {Math.round(eligibilityScore)}
                </span>
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  / 100
                </span>
              </div>
              <Progress
                value={eligibilityScore}
                maxValue={100}
                size='sm'
                color='primary'
                aria-label='Eligibility score'
                className='h-1.5'
              />
            </div>

            {/* Momentum Score & Position */}
            {isMonitored && momentumScore !== null ? (
              <div className='bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3'>
                <div className='flex items-center justify-between mb-1.5'>
                  <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                    Momentum
                  </span>
                  <ChartBarIcon className='w-3.5 h-3.5 text-gray-400' />
                </div>
                <div className='flex items-baseline gap-1.5 mb-1.5'>
                  <span className='text-2xl font-bold text-gray-900 dark:text-white'>
                    {Math.round(momentumScore)}
                  </span>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    / 100
                  </span>
                </div>
                <Progress
                  value={momentumScore}
                  maxValue={100}
                  size='sm'
                  color='success'
                  aria-label='Momentum score'
                  className='h-1.5 mb-2'
                />
                {position && (
                  <div className='pt-2 border-t border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        Position
                      </span>
                      <span className='text-base font-bold text-blue-600 dark:text-blue-400'>
                        #{position}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 text-center'>
                <p className='text-xs text-gray-600 dark:text-gray-400 mb-2'>
                  Not monitored
                </p>
                <Button
                  size='sm'
                  variant='light'
                  className='h-7 text-xs'
                  onPress={() => setShowNotTrackedModal(true)}
                  endContent={<InformationCircleIcon className='w-3.5 h-3.5' />}
                >
                  Why?
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-slate-700'>
            <Button
              size='sm'
              variant='light'
              className='h-7 text-xs'
              onPress={() => router.push('/pulse/connect')}
              endContent={<ArrowRightIcon className='w-3.5 h-3.5' />}
            >
              Manage
            </Button>
            <Button
              size='sm'
              variant='light'
              className='h-7 text-xs'
              onPress={() => setShowInfoModal(true)}
            >
              What is PULSE³?
            </Button>
          </div>
        </CardBody>
      </Card>
      {showNotTrackedModal && (
        <PulseNotTrackedModal
          isOpen={showNotTrackedModal}
          onClose={() => setShowNotTrackedModal(false)}
          eligibilityScore={eligibilityScore}
        />
      )}
      {showInfoModal && (
        <PulseInfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
      )}
      <PulseCalculateModal
        isOpen={showCalculateModal}
        onClose={() => {
          setShowCalculateModal(false);
        }}
        onCalculate={async () => {
          const response = await fetch('/api/pulse/calculate', {
            method: 'POST',
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to calculate scores');
          }
          const result = await response.json();
          // Refresh data after successful calculation
          if (onRefresh) {
            onRefresh();
          } else {
            router.refresh();
          }
          return result;
        }}
        hasExistingScore={pulseData.eligibilityScore !== null}
        currentScore={pulseData.eligibilityScore ?? undefined}
        components={pulseData.eligibilityComponents ?? undefined}
      />
    </>
  );
}
