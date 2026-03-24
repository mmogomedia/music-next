'use client';

import React, { useState } from 'react';
import { Button, Progress } from '@heroui/react';
import {
  SparklesIcon,
  ChartBarIcon,
  ArrowRightIcon,
  BoltIcon,
  TrophyIcon,
  UserGroupIcon,
  HeartIcon,
  ArrowPathIcon,
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
  position: number | null;
  isActivelyMonitored: boolean;
  hasConnection: boolean;
}

interface PulseCardProps {
  pulseData: PulseData | null;
  loading?: boolean;
  onRefresh?: () => void;
}

function ScoreRing({
  value,
  max = 100,
  color,
  size = 72,
}: {
  value: number;
  max?: number;
  color: 'blue' | 'emerald';
  size?: number;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const strokeColor = color === 'blue' ? '#a855f7' : '#10b981';
  const trackColor = color === 'blue' ? '#3b1f5e' : '#064e3b';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className='flex-shrink-0'
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        stroke={trackColor}
        strokeWidth='6'
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        stroke={strokeColor}
        strokeWidth='6'
        strokeLinecap='round'
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      {/* Value text */}
      <text
        x='50%'
        y='50%'
        dominantBaseline='middle'
        textAnchor='middle'
        fontSize='16'
        fontWeight='700'
        fill='white'
      >
        {Math.round(value)}
      </text>
    </svg>
  );
}

function ComponentBar({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  const pct = Math.round(value);
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className='flex items-center gap-2'>
      <Icon className='w-3 h-3 text-purple-300/70 flex-shrink-0' />
      <div className='flex-1 min-w-0'>
        <div className='flex items-center justify-between mb-0.5'>
          <span className='text-[10px] text-purple-200/60 truncate'>
            {label}
          </span>
          <span className='text-[10px] font-semibold text-blue-100/80 ml-1'>
            {pct}
          </span>
        </div>
        <div className='h-1 bg-white/10 rounded-full overflow-hidden'>
          <div
            className={`h-full rounded-full ${color} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
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

  // Loading state
  if (loading || !pulseData) {
    return (
      <div className='h-full w-full rounded-xl bg-gradient-to-br from-slate-900 via-purple-950 to-blue-900 border border-purple-800/30 animate-pulse overflow-hidden'>
        <div className='p-5 space-y-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-white/10 rounded-xl' />
            <div className='space-y-1.5'>
              <div className='h-3.5 w-20 bg-white/10 rounded' />
              <div className='h-2.5 w-32 bg-white/10 rounded' />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3 pt-2'>
            <div className='bg-white/5 rounded-xl p-4 space-y-3'>
              <div className='h-2.5 w-16 bg-white/10 rounded' />
              <div className='w-16 h-16 bg-white/10 rounded-full mx-auto' />
              <div className='h-1.5 bg-white/10 rounded-full' />
            </div>
            <div className='bg-white/5 rounded-xl p-4 space-y-3'>
              <div className='h-2.5 w-16 bg-white/10 rounded' />
              <div className='w-16 h-16 bg-white/10 rounded-full mx-auto' />
              <div className='h-1.5 bg-white/10 rounded-full' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No connection state
  if (!pulseData.hasConnection) {
    return (
      <>
        <div className='h-full w-full rounded-xl bg-gradient-to-br from-slate-900 via-purple-950 to-blue-900 border border-purple-800/30 overflow-hidden flex flex-col'>
          {/* Header */}
          <div className='px-5 pt-5 pb-4 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center ring-1 ring-white/20'>
                <SparklesIcon className='w-5 h-5 text-white' />
              </div>
              <div>
                <h3 className='text-base font-bold text-white tracking-wide'>
                  PULSE³
                </h3>
                <p className='text-xs text-purple-300/80'>
                  Momentum intelligence
                </p>
              </div>
            </div>
            <span className='text-[10px] font-semibold bg-purple-500/20 border border-purple-400/30 text-purple-300 px-2 py-0.5 rounded-full'>
              NEW
            </span>
          </div>

          {/* Body */}
          <div className='flex-1 px-5 pb-5 flex flex-col justify-between'>
            <p className='text-sm text-purple-100/70 leading-relaxed mb-4'>
              Connect your social platforms to unlock your PULSE³ score and see
              where you rank on the Top 100 artist chart.
            </p>

            {/* Feature list */}
            <div className='space-y-2 mb-5'>
              {[
                { icon: ChartBarIcon, text: 'Eligibility & momentum scores' },
                { icon: TrophyIcon, text: 'Top 100 chart ranking' },
                { icon: BoltIcon, text: 'Real-time platform monitoring' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className='flex items-center gap-2'>
                  <div className='w-5 h-5 bg-purple-500/20 rounded-md flex items-center justify-center flex-shrink-0'>
                    <Icon className='w-3 h-3 text-purple-400' />
                  </div>
                  <span className='text-xs text-purple-200/70'>{text}</span>
                </div>
              ))}
            </div>

            <div className='flex gap-2'>
              <Button
                color='primary'
                size='sm'
                className='flex-1 h-9 text-sm font-semibold'
                onPress={() => router.push('/pulse/connect')}
                endContent={<ArrowRightIcon className='w-4 h-4' />}
              >
                Connect Now
              </Button>
              <Button
                size='sm'
                variant='bordered'
                className='h-9 text-xs border-white/20 text-white/60 hover:text-white'
                onPress={() => setShowInfoModal(true)}
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>

        {showInfoModal && (
          <PulseInfoModal
            isOpen={showInfoModal}
            onClose={() => setShowInfoModal(false)}
          />
        )}
      </>
    );
  }

  // Connected but no score calculated yet
  if (pulseData.hasConnection && pulseData.eligibilityScore === null) {
    return (
      <>
        <div className='h-full w-full rounded-xl bg-gradient-to-br from-slate-900 via-purple-950 to-blue-900 border border-purple-800/30 overflow-hidden flex flex-col'>
          <div className='px-5 pt-5 pb-4 flex items-center gap-3'>
            <div className='w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center ring-1 ring-white/20'>
              <SparklesIcon className='w-5 h-5 text-white' />
            </div>
            <div>
              <h3 className='text-base font-bold text-white tracking-wide'>
                PULSE³
              </h3>
              <p className='text-xs text-purple-300/80'>Ready to calculate</p>
            </div>
          </div>

          <div className='flex-1 px-5 pb-5 flex flex-col justify-between'>
            {/* Score preview placeholders */}
            <div className='grid grid-cols-2 gap-3 mb-4'>
              {['Eligibility', 'Momentum'].map(label => (
                <div
                  key={label}
                  className='bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center gap-2'
                >
                  <div className='w-12 h-12 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center'>
                    <span className='text-white/30 text-xs font-bold'>—</span>
                  </div>
                  <span className='text-[11px] text-purple-300/60'>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <p className='text-xs text-purple-200/60 mb-4 leading-relaxed'>
              Your connections are linked. Calculate your scores to see your
              eligibility rating and momentum ranking.
            </p>

            <Button
              color='primary'
              size='sm'
              className='w-full h-9 text-sm font-semibold'
              onPress={() => setShowCalculateModal(true)}
              startContent={<BoltIcon className='w-4 h-4' />}
            >
              Calculate Scores
            </Button>
          </div>
        </div>

        <PulseCalculateModal
          isOpen={showCalculateModal}
          onClose={() => setShowCalculateModal(false)}
          onCalculate={async () => {
            const response = await fetch('/api/pulse/calculate', {
              method: 'POST',
            });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to calculate scores');
            }
            const result = await response.json();
            if (onRefresh) onRefresh();
            else router.refresh();
            return result;
          }}
          hasExistingScore={false}
          components={null}
        />
      </>
    );
  }

  // Full data state
  const eligibilityScore = pulseData.eligibilityScore ?? 0;
  const momentumScore = pulseData.momentumScore;
  const isMonitored = pulseData.isActivelyMonitored;
  const position = pulseData.position;
  const components = pulseData.eligibilityComponents;

  return (
    <>
      <div className='h-full w-full rounded-xl bg-gradient-to-br from-slate-900 via-purple-950 to-blue-900 border border-purple-800/30 overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='px-5 pt-4 pb-3 flex items-center justify-between flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center ring-1 ring-white/20 flex-shrink-0'>
              <SparklesIcon className='w-4.5 h-4.5 text-white' />
            </div>
            <div>
              <h3 className='text-sm font-bold text-white tracking-wide'>
                PULSE³
              </h3>
              <p className='text-[11px] text-blue-300/70'>
                Momentum intelligence
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {isMonitored ? (
              <div className='flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-1'>
                <span className='w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse' />
                <span className='text-[11px] font-semibold text-emerald-300'>
                  Live
                </span>
              </div>
            ) : (
              <div className='flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1'>
                <span className='text-[11px] text-white/40'>Unmonitored</span>
              </div>
            )}
            <button
              onClick={onRefresh}
              className='w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors'
              aria-label='Refresh'
            >
              <ArrowPathIcon className='w-3.5 h-3.5 text-white/40 hover:text-white/70 transition-colors' />
            </button>
          </div>
        </div>

        {/* Score rings */}
        <div className='px-5 py-3 grid grid-cols-2 gap-3 flex-shrink-0'>
          {/* Eligibility */}
          <div className='bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2'>
            <div className='flex items-center gap-1.5 self-stretch justify-between mb-1'>
              <span className='text-[11px] font-medium text-purple-200/70'>
                Eligibility
              </span>
              <button
                onClick={() => setShowCalculateModal(true)}
                className='text-[10px] text-purple-400/70 hover:text-purple-300 transition-colors'
              >
                Recalc
              </button>
            </div>
            <ScoreRing value={eligibilityScore} color='blue' />
            <Progress
              value={eligibilityScore}
              maxValue={100}
              size='sm'
              color='primary'
              aria-label='Eligibility score'
              className='w-full'
            />
          </div>

          {/* Momentum / Not monitored */}
          {isMonitored && momentumScore !== null ? (
            <div className='bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2'>
              <div className='flex items-center gap-1.5 self-stretch justify-between mb-1'>
                <span className='text-[11px] font-medium text-purple-200/70'>
                  Momentum
                </span>
                <ChartBarIcon className='w-3.5 h-3.5 text-emerald-400/70' />
              </div>
              <ScoreRing value={momentumScore} color='emerald' />
              <Progress
                value={momentumScore}
                maxValue={100}
                size='sm'
                color='success'
                aria-label='Momentum score'
                className='w-full'
              />
            </div>
          ) : (
            <div className='bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center gap-2'>
              <div className='w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center'>
                <ChartBarIcon className='w-5 h-5 text-white/20' />
              </div>
              <p className='text-[11px] text-white/40 text-center leading-tight'>
                Momentum unlocks once monitored
              </p>
              <button
                onClick={() => setShowNotTrackedModal(true)}
                className='text-[10px] text-purple-400/70 hover:text-purple-300 underline transition-colors'
              >
                Why not monitored?
              </button>
            </div>
          )}
        </div>

        {/* Chart position */}
        {position && (
          <div className='mx-5 mb-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between flex-shrink-0'>
            <div className='flex items-center gap-2'>
              <TrophyIcon className='w-4 h-4 text-amber-400' />
              <span className='text-xs text-purple-200/80'>Chart position</span>
            </div>
            <span className='text-lg font-bold text-white'>
              #{position}
              <span className='text-xs text-purple-300/60 font-normal ml-1'>
                / 100
              </span>
            </span>
          </div>
        )}

        {/* Component breakdown */}
        {components && (
          <div className='mx-5 mb-3 space-y-2 flex-shrink-0'>
            <p className='text-[10px] font-semibold text-blue-300/50 uppercase tracking-wider'>
              Score breakdown
            </p>
            <ComponentBar
              label='Followers'
              value={components.followerScore}
              icon={UserGroupIcon}
            />
            <ComponentBar
              label='Engagement'
              value={components.engagementScore}
              icon={HeartIcon}
            />
            <ComponentBar
              label='Consistency'
              value={components.consistencyScore}
              icon={ChartBarIcon}
            />
            <ComponentBar
              label='Platforms'
              value={components.platformDiversityScore}
              icon={BoltIcon}
            />
          </div>
        )}

        {/* Footer actions */}
        <div className='mt-auto px-5 pb-4 pt-2 flex gap-2 border-t border-white/5 flex-shrink-0'>
          <Button
            size='sm'
            variant='bordered'
            className='flex-1 h-8 text-xs border-white/20 text-white/60 hover:text-white hover:border-white/40'
            onPress={() => router.push('/pulse/connect')}
            endContent={<ArrowRightIcon className='w-3.5 h-3.5' />}
          >
            Manage
          </Button>
          <Button
            size='sm'
            variant='light'
            className='h-8 text-xs text-white/40 hover:text-white/70'
            onPress={() => setShowInfoModal(true)}
          >
            About
          </Button>
        </div>
      </div>

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
        onClose={() => setShowCalculateModal(false)}
        onCalculate={async () => {
          const response = await fetch('/api/pulse/calculate', {
            method: 'POST',
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to calculate scores');
          }
          const result = await response.json();
          if (onRefresh) onRefresh();
          else router.refresh();
          return result;
        }}
        hasExistingScore={pulseData.eligibilityScore !== null}
        currentScore={pulseData.eligibilityScore ?? undefined}
        components={pulseData.eligibilityComponents ?? undefined}
      />
    </>
  );
}
