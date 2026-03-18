'use client';

import { useState, useEffect } from 'react';
import FlemojiModal, {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/shared/FlemojiModal';
import {
  Button,
  Progress,
  Spinner,
  Accordion,
  AccordionItem,
} from '@heroui/react';
import {
  SparklesIcon,
  UserGroupIcon,
  HeartIcon,
  ClockIcon,
  LinkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface EligibilityScoreComponents {
  followerScore: number;
  engagementScore: number;
  consistencyScore: number;
  platformDiversityScore: number;
  // Note: Trend Score removed from Eligibility - now part of Momentum Score only
}

interface PulseCalculateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculate: () => Promise<any>;
  hasExistingScore: boolean;
  currentScore?: number | null;
  components?: EligibilityScoreComponents | null;
}

export default function PulseCalculateModal({
  isOpen,
  onClose,
  onCalculate,
  hasExistingScore,
  currentScore,
  components,
}: PulseCalculateModalProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] =
    useState<EligibilityScoreComponents | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset error when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    setCalculationResult(null);
    setCalculatedTotal(null);

    try {
      const result = await onCalculate();

      // If API returns components, display them
      if (result?.eligibilityComponents) {
        setCalculationResult(result.eligibilityComponents);
        setCalculatedTotal(result.eligibilityScore);
      } else {
        // If no components returned, close modal and let parent handle refresh
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to calculate scores. Please try again.';
      setError(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  };

  const displayComponents = calculationResult || components;
  const displayTotal: number | null | undefined =
    calculatedTotal ?? currentScore;

  // Type guard for displayTotal
  const safeDisplayTotal =
    displayTotal != null && typeof displayTotal === 'number'
      ? displayTotal
      : null;

  const componentItems = [
    {
      id: 'follower',
      label: 'Follower Score',
      value: displayComponents?.followerScore ?? 0,
      weight: 30,
      icon: UserGroupIcon,
      color: 'blue',
      description: 'Based on your follower count',
      detailedDescription: {
        title: 'Follower Score',
        purpose:
          'Prevents very large accounts from dominating and gives small accounts a fair starting point.',
        calculation:
          'Uses a logarithmic scale where 100,000 followers = 100 points. This means smaller accounts can still achieve good scores, while very large accounts are capped.',
        examples: [
          '100 followers ≈ 20 points',
          '1,000 followers ≈ 40 points',
          '10,000 followers ≈ 60 points',
          '100,000 followers = 100 points (capped)',
        ],
        weight: '30% of your total eligibility score',
      },
    },
    {
      id: 'engagement',
      label: 'Engagement Quality',
      value: displayComponents?.engagementScore ?? 0,
      weight: 40,
      icon: HeartIcon,
      color: 'pink',
      description: 'Based on likes, comments, shares, and engagement rate',
      detailedDescription: {
        title: 'Engagement Quality Score',
        purpose:
          'Measures how engaged your audience is with your content using actual video performance data.',
        calculation:
          'Combines two factors: (1) Engagement Rate (60%) - average of likes, comments, and shares relative to views/followers, and (2) Performance Ratio (40%) - how many views each video gets relative to your follower count.',
        examples: [
          'High engagement: Videos get 4-10% engagement rate',
          'Good performance: Videos reach 1-3× your follower count',
          'Excellent: Both engagement and performance are strong',
        ],
        weight: '40% of your total eligibility score (most important)',
      },
    },
    {
      id: 'consistency',
      label: 'Consistency Score',
      value: displayComponents?.consistencyScore ?? 0,
      weight: 20,
      icon: ClockIcon,
      color: 'orange',
      description: 'Based on posting frequency across your videos',
      detailedDescription: {
        title: 'Consistency Score',
        purpose:
          'Rewards reliable posting without making spam uploading overpowered.',
        calculation:
          'Based on posting frequency across your recent videos. Calculates posts per day using the time span between your newest and oldest recent videos.',
        examples: [
          '< 0.1 posts/day (≤3 per month) → 10-30 points',
          '0.1-0.5 posts/day (3-15 per month) → 30-60 points',
          '0.5-1.5 posts/day (15-45 per month) → 60-90 points',
          '> 1.5 posts/day → 90-100 points',
        ],
        weight: '20% of your total eligibility score',
      },
    },
    {
      id: 'platform',
      label: 'Platform Diversity',
      value: displayComponents?.platformDiversityScore ?? 0,
      weight: 10,
      icon: LinkIcon,
      color: 'purple',
      description: 'Based on connected platforms (TikTok, Spotify, YouTube)',
      detailedDescription: {
        title: 'Platform Diversity Score',
        purpose:
          'Gives cross-platform creators a small advantage without excluding TikTok-only artists.',
        calculation:
          'Simple rule based on number of connected platforms: 1 platform = 50 points, 2 platforms = 75 points, 3+ platforms = 100 points.',
        examples: [
          'TikTok only → 50 points',
          'TikTok + Spotify → 75 points',
          'TikTok + Spotify + YouTube → 100 points',
        ],
        weight: '10% of your total eligibility score',
      },
    },
  ];

  return (
    <FlemojiModal
      isOpen={isOpen}
      onClose={onClose}
      size='2xl'
      scrollBehavior='inside'
      isDismissable={!isCalculating}
      isKeyboardDismissDisabled={isCalculating}
    >
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1 border-b border-gray-200 dark:border-slate-700'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
              <SparklesIcon className='w-6 h-6 text-white' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                {hasExistingScore ? 'Recalculate' : 'Calculate'} PULSE³ Scores
              </h2>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                {hasExistingScore
                  ? 'Update your eligibility and momentum scores'
                  : 'Calculate your eligibility score to see if you qualify for Top 100'}
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className='py-6'>
          {isCalculating && (
            <div className='mb-4 flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800'>
              <Spinner size='sm' color='primary' />
              <div>
                <p className='text-sm font-medium text-blue-900 dark:text-blue-300'>
                  Recalculating scores...
                </p>
                <p className='text-xs text-blue-700 dark:text-blue-400'>
                  Fetching latest data from TikTok and updating scores
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className='mb-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800'>
              <p className='text-sm font-medium text-red-900 dark:text-red-300'>
                Error calculating scores
              </p>
              <p className='text-xs text-red-700 dark:text-red-400 mt-1'>
                {error}
              </p>
            </div>
          )}
          <div className='space-y-4'>
            {/* Current Score Display */}
            {hasExistingScore && currentScore !== null && (
              <div className='bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-semibold text-blue-900 dark:text-blue-300'>
                    Current Eligibility Score
                  </span>
                  <span className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    {currentScore != null ? Math.round(currentScore) : '—'}
                  </span>
                </div>
                <Progress
                  value={currentScore}
                  maxValue={100}
                  size='sm'
                  color='primary'
                  className='mt-2'
                />
              </div>
            )}

            {/* Score Components */}
            <div>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-3'>
                Eligibility Score Components
              </h3>
              <div className='space-y-3'>
                {componentItems.map((item, index) => {
                  const Icon = item.icon;
                  const colorClasses = {
                    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                    pink: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
                    orange:
                      'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
                    green:
                      'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
                    purple:
                      'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
                  };

                  const weightedValue = (item.value * item.weight) / 100;

                  return (
                    <div
                      key={index}
                      className={`bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700 relative ${
                        isCalculating ? 'opacity-60' : ''
                      }`}
                    >
                      {isCalculating && (
                        <div className='absolute inset-0 bg-gray-100/50 dark:bg-slate-800/50 rounded-lg animate-pulse' />
                      )}
                      <div className='flex items-center justify-between mb-2 relative z-10'>
                        <div className='flex items-center gap-2 flex-1'>
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[item.color as keyof typeof colorClasses]}`}
                          >
                            <Icon className='w-4 h-4' />
                          </div>
                          <div className='flex-1'>
                            <span className='text-sm font-medium text-gray-900 dark:text-white'>
                              {item.label}
                            </span>
                            <span className='text-xs text-gray-500 dark:text-gray-400 ml-2'>
                              ({item.weight}% weight)
                            </span>
                          </div>
                        </div>
                        <div className='text-right ml-4'>
                          {isCalculating ? (
                            <div className='space-y-1.5'>
                              <div className='h-4 w-12 bg-gray-300 dark:bg-slate-600 rounded animate-pulse' />
                              <div className='h-3 w-16 bg-gray-300 dark:bg-slate-600 rounded animate-pulse ml-auto' />
                            </div>
                          ) : (
                            <>
                              <div className='text-sm font-bold text-gray-900 dark:text-white'>
                                {displayComponents
                                  ? Math.round(item.value)
                                  : '—'}{' '}
                                / 100
                              </div>
                              <div className='text-xs text-gray-500 dark:text-gray-400'>
                                Contributes:{' '}
                                {displayComponents
                                  ? Math.round(weightedValue * 10) / 10
                                  : '—'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {isCalculating ? (
                        <div className='mt-2 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden relative z-10'>
                          <div
                            className='h-full bg-gray-300 dark:bg-slate-600 rounded-full animate-pulse'
                            style={{ width: '60%' }}
                          />
                        </div>
                      ) : (
                        displayComponents && (
                          <Progress
                            value={item.value}
                            maxValue={100}
                            size='sm'
                            color={
                              item.color === 'blue'
                                ? 'primary'
                                : item.color === 'pink'
                                  ? 'secondary'
                                  : item.color === 'orange'
                                    ? 'warning'
                                    : item.color === 'green'
                                      ? 'success'
                                      : 'secondary'
                            }
                            className='mt-2 relative z-10'
                          />
                        )
                      )}
                      <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 relative z-10'>
                        {item.description}
                      </p>

                      {/* Accordion for detailed description */}
                      {item.detailedDescription && (
                        <Accordion className='mt-3' variant='light'>
                          <AccordionItem
                            key={item.id}
                            aria-label={item.label}
                            title={
                              <div className='flex items-center gap-2'>
                                <InformationCircleIcon className='w-4 h-4 text-gray-400' />
                                <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                                  Learn more about {item.label}
                                </span>
                              </div>
                            }
                          >
                            <div className='space-y-4 pt-2'>
                              {/* Purpose */}
                              <div>
                                <h4 className='text-xs font-semibold text-gray-900 dark:text-white mb-1.5'>
                                  Purpose
                                </h4>
                                <p className='text-xs text-gray-600 dark:text-gray-400 leading-relaxed'>
                                  {item.detailedDescription.purpose}
                                </p>
                              </div>

                              {/* Calculation */}
                              <div>
                                <h4 className='text-xs font-semibold text-gray-900 dark:text-white mb-1.5'>
                                  How It&apos;s Calculated
                                </h4>
                                <p className='text-xs text-gray-600 dark:text-gray-400 leading-relaxed'>
                                  {item.detailedDescription.calculation}
                                </p>
                              </div>

                              {/* Examples */}
                              <div>
                                <h4 className='text-xs font-semibold text-gray-900 dark:text-white mb-1.5'>
                                  Examples
                                </h4>
                                <ul className='space-y-1'>
                                  {item.detailedDescription.examples.map(
                                    (example, idx) => (
                                      <li
                                        key={idx}
                                        className='text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2'
                                      >
                                        <span className='text-gray-400 dark:text-gray-500 mt-0.5'>
                                          •
                                        </span>
                                        <span>{example}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>

                              {/* Weight */}
                              <div className='bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700'>
                                <p className='text-xs font-medium text-gray-900 dark:text-white mb-0.5'>
                                  Contribution to Total Score
                                </p>
                                <p className='text-xs text-gray-600 dark:text-gray-400'>
                                  {item.detailedDescription.weight}
                                </p>
                              </div>
                            </div>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Score */}
            {safeDisplayTotal != null && (
              <div
                className={`rounded-lg p-4 border-2 relative ${
                  isCalculating ? 'opacity-60' : ''
                } ${
                  safeDisplayTotal >= 70
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 dark:border-green-700'
                    : safeDisplayTotal >= 50
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-700'
                      : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-300 dark:border-red-700'
                }`}
              >
                {isCalculating && (
                  <div
                    className={`absolute inset-0 rounded-lg animate-pulse ${
                      safeDisplayTotal >= 70
                        ? 'bg-green-100/30 dark:bg-green-950/30'
                        : safeDisplayTotal >= 50
                          ? 'bg-yellow-100/30 dark:bg-yellow-950/30'
                          : 'bg-red-100/30 dark:bg-red-950/30'
                    }`}
                  />
                )}
                <div className='flex items-center justify-between relative z-10'>
                  <span className='text-base font-semibold text-gray-900 dark:text-white'>
                    Total Eligibility Score
                  </span>
                  {isCalculating ? (
                    <div
                      className={`h-8 w-16 rounded animate-pulse ${
                        safeDisplayTotal >= 70
                          ? 'bg-green-200 dark:bg-green-800'
                          : safeDisplayTotal >= 50
                            ? 'bg-yellow-200 dark:bg-yellow-800'
                            : 'bg-red-200 dark:bg-red-800'
                      }`}
                    />
                  ) : (
                    <span
                      className={`text-3xl font-bold ${
                        safeDisplayTotal >= 70
                          ? 'text-green-600 dark:text-green-400'
                          : safeDisplayTotal >= 50
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {Math.round(safeDisplayTotal)}
                    </span>
                  )}
                </div>
                {isCalculating ? (
                  <div
                    className={`mt-3 h-2 rounded-full overflow-hidden relative z-10 ${
                      safeDisplayTotal >= 70
                        ? 'bg-green-200 dark:bg-green-800'
                        : safeDisplayTotal >= 50
                          ? 'bg-yellow-200 dark:bg-yellow-800'
                          : 'bg-red-200 dark:bg-red-800'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full animate-pulse ${
                        safeDisplayTotal >= 70
                          ? 'bg-green-300 dark:bg-green-700'
                          : safeDisplayTotal >= 50
                            ? 'bg-yellow-300 dark:bg-yellow-700'
                            : 'bg-red-300 dark:bg-red-700'
                      }`}
                      style={{ width: `${safeDisplayTotal}%` }}
                    />
                  </div>
                ) : (
                  <Progress
                    value={safeDisplayTotal}
                    maxValue={100}
                    size='md'
                    color={
                      safeDisplayTotal >= 70
                        ? 'success'
                        : safeDisplayTotal >= 50
                          ? 'warning'
                          : 'danger'
                    }
                    className='mt-3 relative z-10'
                  />
                )}
                <p
                  className={`text-xs font-medium mt-2 relative z-10 ${
                    safeDisplayTotal >= 70
                      ? 'text-green-700 dark:text-green-300'
                      : safeDisplayTotal >= 50
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {safeDisplayTotal >= 70
                    ? 'Excellent! You qualify for active monitoring!'
                    : safeDisplayTotal >= 50
                      ? 'Good progress! Getting close to Top 100 eligibility'
                      : 'Keep building your presence to qualify'}
                </p>

                {/* Accordion for score range explanations */}
                <Accordion className='mt-3' variant='light'>
                  <AccordionItem
                    key='score-ranges'
                    aria-label='Score ranges explained'
                    title={
                      <div className='flex items-center gap-2'>
                        <InformationCircleIcon className='w-4 h-4 text-gray-400' />
                        <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                          What does my score mean?
                        </span>
                      </div>
                    }
                  >
                    <div className='space-y-4 pt-2'>
                      {/* Excellent Range (70-100) */}
                      <div className='bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800'>
                        <div className='flex items-center gap-2 mb-1.5'>
                          <div className='w-2 h-2 rounded-full bg-green-600 dark:bg-green-400' />
                          <h4 className='text-xs font-semibold text-green-900 dark:text-green-300'>
                            Excellent (70-100)
                          </h4>
                        </div>
                        <p className='text-xs text-green-800 dark:text-green-300 leading-relaxed'>
                          You qualify for active monitoring! Artists in this
                          range are actively monitored by PULSE³ and appear on
                          the Top 100 chart. You have strong engagement,
                          consistency, and reach across your platforms.
                        </p>
                      </div>

                      {/* Good Range (50-69) */}
                      <div className='bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800'>
                        <div className='flex items-center gap-2 mb-1.5'>
                          <div className='w-2 h-2 rounded-full bg-yellow-600 dark:bg-yellow-400' />
                          <h4 className='text-xs font-semibold text-yellow-900 dark:text-yellow-300'>
                            Good (50-69)
                          </h4>
                        </div>
                        <p className='text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed'>
                          You&apos;re making good progress! Artists in this
                          range are close to qualifying for active monitoring.
                          Focus on increasing engagement, maintaining consistent
                          posting, and connecting additional platforms to boost
                          your score.
                        </p>
                      </div>

                      {/* Needs Improvement (0-49) */}
                      <div className='bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800'>
                        <div className='flex items-center gap-2 mb-1.5'>
                          <div className='w-2 h-2 rounded-full bg-red-600 dark:bg-red-400' />
                          <h4 className='text-xs font-semibold text-red-900 dark:text-red-300'>
                            Needs Improvement (0-49)
                          </h4>
                        </div>
                        <p className='text-xs text-red-800 dark:text-red-300 leading-relaxed'>
                          Keep building your presence! Artists in this range
                          need to focus on increasing followers, improving
                          engagement rates, posting more consistently, and
                          connecting additional platforms. Every improvement
                          counts toward qualifying for the Top 100.
                        </p>
                      </div>

                      {/* How to Improve */}
                      <div className='bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700'>
                        <h4 className='text-xs font-semibold text-gray-900 dark:text-white mb-1.5'>
                          How to Improve Your Score
                        </h4>
                        <ul className='space-y-1.5'>
                          <li className='text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2'>
                            <span className='text-gray-400 dark:text-gray-500 mt-0.5'>
                              •
                            </span>
                            <span>
                              Increase engagement: Post content that encourages
                              likes, comments, and shares
                            </span>
                          </li>
                          <li className='text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2'>
                            <span className='text-gray-400 dark:text-gray-500 mt-0.5'>
                              •
                            </span>
                            <span>
                              Post consistently: Aim for 0.5-1.5 posts per day
                              for optimal consistency score
                            </span>
                          </li>
                          <li className='text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2'>
                            <span className='text-gray-400 dark:text-gray-500 mt-0.5'>
                              •
                            </span>
                            <span>
                              Connect platforms: Link Spotify and YouTube to
                              increase platform diversity score
                            </span>
                          </li>
                          <li className='text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2'>
                            <span className='text-gray-400 dark:text-gray-500 mt-0.5'>
                              •
                            </span>
                            <span>
                              Grow organically: Focus on building genuine
                              engagement rather than just follower count
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className='border-t border-gray-200 dark:border-slate-700'>
          <Button variant='light' onPress={onClose} isDisabled={isCalculating}>
            {hasExistingScore ? 'Cancel' : 'Close'}
          </Button>
          <Button
            color='primary'
            onPress={handleCalculate}
            isLoading={isCalculating}
            isDisabled={isCalculating}
            startContent={
              !isCalculating ? <SparklesIcon className='w-4 h-4' /> : undefined
            }
          >
            {isCalculating
              ? 'Calculating...'
              : hasExistingScore
                ? 'Recalculate'
                : 'Calculate'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </FlemojiModal>
  );
}
