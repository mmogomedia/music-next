'use client';

import { useState } from 'react';
import { Card, CardBody, Button, Progress, Spinner } from '@heroui/react';
import {
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import ArtistNavigation from '@/components/dashboard/artist/ArtistNavigation';
import PulseInfoModal from '@/components/dashboard/pulse/PulseInfoModal';
import PulseNotTrackedModal from '@/components/dashboard/pulse/PulseNotTrackedModal';
import { usePulseData } from '@/hooks/usePulseData';

export default function PulseDashboard() {
  const router = useRouter();
  const { pulseData, loading, error } = usePulseData();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNotTrackedModal, setShowNotTrackedModal] = useState(false);

  // Get position change (mock for now)
  const positionChange = null; // TODO: Get from API

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-3 px-4 sm:px-5 lg:px-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
              <SparklesIcon className='w-6 h-6 text-white' />
            </div>
            <div>
              <h1 className='text-lg font-bold text-gray-900 dark:text-white'>
                PULSE³ Dashboard
              </h1>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Your momentum and discovery profile
              </p>
            </div>
          </div>
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
    </header>
  );

  // No connection state
  if (!pulseData?.hasConnection && !loading) {
    return (
      <UnifiedLayout
        sidebar={
          <ArtistNavigation
            activeTab='pulse'
            getTabHref={tab => {
              if (tab === 'pulse') return '/pulse';
              return `/dashboard?tab=${tab}`;
            }}
          />
        }
        header={header}
      >
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <Card className='border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20'>
            <CardBody className='p-8 text-center'>
              <div className='w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                <SparklesIcon className='w-8 h-8 text-white' />
              </div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                Connect to PULSE³
              </h2>
              <p className='text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto'>
                Connect your social platforms and streaming profiles to start
                tracking your momentum and see your ranking on the Top 100
                chart.
              </p>
              <Button
                color='primary'
                size='lg'
                onPress={() => router.push('/pulse/connect')}
              >
                Get Started
              </Button>
            </CardBody>
          </Card>
        </div>
      </UnifiedLayout>
    );
  }

  const eligibilityScore = pulseData?.eligibilityScore ?? 0;
  const momentumScore = pulseData?.momentumScore;
  const isMonitored = pulseData?.isActivelyMonitored ?? false;
  const position = pulseData?.position;

  return (
    <>
      <UnifiedLayout
        sidebar={
          <ArtistNavigation
            activeTab='pulse'
            getTabHref={tab => {
              if (tab === 'pulse') return '/pulse';
              return `/dashboard?tab=${tab}`;
            }}
          />
        }
        header={header}
      >
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {loading ? (
            <div className='flex justify-center items-center h-64'>
              <Spinner size='lg' color='primary' />
            </div>
          ) : error ? (
            <Card>
              <CardBody className='p-8 text-center'>
                <p className='text-red-600 dark:text-red-400'>{error}</p>
              </CardBody>
            </Card>
          ) : (
            <div className='space-y-6'>
              {/* Main Stats Grid */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                {/* Eligibility Score */}
                <Card>
                  <CardBody className='p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                        Eligibility Score
                      </span>
                      <InformationCircleIcon className='w-4 h-4 text-gray-400' />
                    </div>
                    <div className='flex items-baseline gap-2 mb-2'>
                      <span className='text-3xl font-bold text-gray-900 dark:text-white'>
                        {pulseData?.eligibilityScore !== null
                          ? Math.round(eligibilityScore)
                          : '—'}
                      </span>
                      <span className='text-sm text-gray-500 dark:text-gray-400'>
                        / 100
                      </span>
                    </div>
                    {pulseData?.eligibilityScore !== null && (
                      <Progress
                        value={eligibilityScore}
                        maxValue={100}
                        size='sm'
                        color='primary'
                        className='h-2'
                      />
                    )}
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
                      Determines if you qualify for active monitoring
                    </p>
                  </CardBody>
                </Card>

                {/* Momentum Score */}
                {isMonitored && momentumScore !== null ? (
                  <Card>
                    <CardBody className='p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                          Momentum Score
                        </span>
                        <ChartBarIcon className='w-4 h-4 text-gray-400' />
                      </div>
                      <div className='flex items-baseline gap-2 mb-2'>
                        <span className='text-3xl font-bold text-gray-900 dark:text-white'>
                          {momentumScore != null
                            ? Math.round(momentumScore)
                            : '—'}
                        </span>
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                          / 100
                        </span>
                      </div>
                      <Progress
                        value={momentumScore}
                        maxValue={100}
                        size='sm'
                        color='success'
                        className='h-2'
                      />
                      <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
                        Your current momentum level
                      </p>
                    </CardBody>
                  </Card>
                ) : (
                  <Card>
                    <CardBody className='p-4 flex flex-col items-center justify-center text-center'>
                      <ExclamationTriangleIcon className='w-8 h-8 text-gray-400 mb-2' />
                      <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                        Not Monitored
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        You&apos;re not in the top 100
                      </p>
                    </CardBody>
                  </Card>
                )}

                {/* Position */}
                {isMonitored && position ? (
                  <Card>
                    <CardBody className='p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                          Chart Position
                        </span>
                        {positionChange !== null && positionChange > 0 ? (
                          <div className='flex items-center gap-1 text-green-600 dark:text-green-400'>
                            <ArrowUpIcon className='w-4 h-4' />
                            <span className='text-xs font-medium'>
                              {positionChange}
                            </span>
                          </div>
                        ) : positionChange !== null && positionChange < 0 ? (
                          <div className='flex items-center gap-1 text-red-600 dark:text-red-400'>
                            <ArrowDownIcon className='w-4 h-4' />
                            <span className='text-xs font-medium'>
                              {Math.abs(positionChange)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <div className='flex items-baseline gap-2 mb-2'>
                        <span className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                          #{position}
                        </span>
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                          of 100
                        </span>
                      </div>
                      <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
                        Your position on the Top 100 chart
                      </p>
                    </CardBody>
                  </Card>
                ) : (
                  <Card>
                    <CardBody className='p-4 flex flex-col items-center justify-center text-center'>
                      <ChartBarIcon className='w-8 h-8 text-gray-400 mb-2' />
                      <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                        No Position
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        Not on the chart yet
                      </p>
                    </CardBody>
                  </Card>
                )}
              </div>

              {/* Action Items / What You Need To Do */}
              <Card>
                <CardBody className='p-6'>
                  <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                    What You Need To Do
                  </h2>
                  <div className='space-y-3'>
                    {!pulseData?.hasConnection ? (
                      <div className='flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                        <ExclamationTriangleIcon className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-gray-900 dark:text-white mb-1'>
                            Connect Your Platforms
                          </p>
                          <p className='text-xs text-gray-600 dark:text-gray-400 mb-2'>
                            Connect your social platforms and streaming profiles
                            to start tracking your momentum.
                          </p>
                          <Button
                            size='sm'
                            color='primary'
                            onPress={() => router.push('/pulse/connect')}
                            className='h-7 text-xs'
                          >
                            Connect Now
                          </Button>
                        </div>
                      </div>
                    ) : pulseData.eligibilityScore === null ? (
                      <div className='flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800'>
                        <InformationCircleIcon className='w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5' />
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-gray-900 dark:text-white mb-1'>
                            Calculating Your Score
                          </p>
                          <p className='text-xs text-gray-600 dark:text-gray-400'>
                            We&apos;re calculating your eligibility score. This
                            usually takes a few minutes.
                          </p>
                        </div>
                      </div>
                    ) : !isMonitored ? (
                      <div className='flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800'>
                        <ExclamationTriangleIcon className='w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5' />
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-gray-900 dark:text-white mb-1'>
                            Not in Top 100
                          </p>
                          <p className='text-xs text-gray-600 dark:text-gray-400 mb-2'>
                            Your eligibility score is{' '}
                            {Math.round(eligibilityScore)}. You need to improve
                            your score to enter the top 100 and appear on the
                            chart.
                          </p>
                          <Button
                            size='sm'
                            variant='light'
                            onPress={() => setShowNotTrackedModal(true)}
                            className='h-7 text-xs'
                          >
                            Why not tracked?
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800'>
                        <CheckCircleIcon className='w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5' />
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-gray-900 dark:text-white mb-1'>
                            You&apos;re Being Monitored!
                          </p>
                          <p className='text-xs text-gray-600 dark:text-gray-400'>
                            Great work! You&apos;re in the top 100 and actively
                            being tracked. Keep building momentum to improve
                            your position.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Recent Movement / Activity */}
              {isMonitored && (
                <Card>
                  <CardBody className='p-6'>
                    <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                      Your Movement
                    </h2>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg'>
                        <div>
                          <p className='text-sm font-medium text-gray-900 dark:text-white'>
                            Current Position
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            On the Top 100 chart
                          </p>
                        </div>
                        <span className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                          #{position}
                        </span>
                      </div>
                      {/* TODO: Add position history, trend charts, etc. */}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </div>
      </UnifiedLayout>

      {showInfoModal && (
        <PulseInfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
      )}
      {showNotTrackedModal && (
        <PulseNotTrackedModal
          isOpen={showNotTrackedModal}
          onClose={() => setShowNotTrackedModal(false)}
          eligibilityScore={eligibilityScore}
        />
      )}
    </>
  );
}
