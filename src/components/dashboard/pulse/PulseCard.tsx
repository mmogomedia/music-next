'use client';

import React, { useState } from 'react';
import { Button } from '@heroui/react';
import {
  SparklesIcon,
  ArrowRightIcon,
  BoltIcon,
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

function MiniBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value);
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className='flex items-center gap-1.5'>
      <span className='text-[10px] text-purple-300/60 w-16 truncate shrink-0'>
        {label}
      </span>
      <div className='flex-1 h-1 bg-white/10 rounded-full overflow-hidden'>
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className='text-[10px] font-semibold text-white/60 w-6 text-right shrink-0'>
        {pct}
      </span>
    </div>
  );
}

const CARD =
  'w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-purple-950 to-blue-900 border border-purple-800/30 overflow-hidden flex flex-col';

function CardHeader({
  badge,
  onRefresh,
}: {
  badge?: React.ReactNode;
  onRefresh?: () => void;
}) {
  return (
    <div className='px-4 pt-3.5 pb-3 flex items-center justify-between shrink-0'>
      <div className='flex items-center gap-2.5'>
        <div className='w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center ring-1 ring-white/20 shrink-0'>
          <SparklesIcon className='w-4 h-4 text-white' />
        </div>
        <div>
          <h3 className='text-sm font-bold text-white tracking-wide leading-none'>
            PULSE³
          </h3>
          <p className='text-[10px] text-blue-300/60 mt-0.5'>
            Momentum intelligence
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        {badge}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className='w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors'
            aria-label='Refresh'
          >
            <ArrowPathIcon className='w-3.5 h-3.5 text-white/40 hover:text-white/70 transition-colors' />
          </button>
        )}
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || !pulseData) {
    return (
      <div className={`${CARD} animate-pulse`}>
        <div className='px-4 pt-3.5 pb-3 flex items-center gap-2.5'>
          <div className='w-8 h-8 bg-white/10 rounded-lg' />
          <div className='space-y-1.5'>
            <div className='h-3 w-16 bg-white/10 rounded' />
            <div className='h-2 w-24 bg-white/10 rounded' />
          </div>
        </div>
        <div className='px-4 pb-4 flex gap-4'>
          <div className='w-16 h-16 bg-white/10 rounded-xl shrink-0' />
          <div className='flex-1 space-y-2 pt-1'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-1.5 bg-white/10 rounded-full' />
            ))}
          </div>
        </div>
        <div className='px-4 pb-3.5 pt-2 border-t border-white/5 flex gap-2'>
          <div className='flex-1 h-7 bg-white/10 rounded-lg' />
          <div className='w-14 h-7 bg-white/10 rounded-lg' />
        </div>
      </div>
    );
  }

  // ── No connection ──────────────────────────────────────────────────────────
  if (!pulseData.hasConnection) {
    return (
      <>
        <div className={CARD}>
          <CardHeader
            badge={
              <span className='text-[10px] font-semibold bg-purple-500/20 border border-purple-400/30 text-purple-300 px-2 py-0.5 rounded-full'>
                NEW
              </span>
            }
          />
          <div className='px-4 pb-4 flex-1 flex flex-col justify-between'>
            <p className='text-xs text-purple-100/60 leading-relaxed mb-3'>
              Connect your social platforms to unlock your PULSE³ score and
              chart ranking.
            </p>
            <div className='flex gap-2'>
              <Button
                color='primary'
                size='sm'
                className='flex-1 h-8 text-xs font-semibold'
                onPress={() => router.push('/pulse/connect')}
                endContent={<ArrowRightIcon className='w-3.5 h-3.5' />}
              >
                Connect
              </Button>
              <Button
                size='sm'
                variant='bordered'
                className='h-8 text-xs border-white/20 text-white/60 hover:text-white'
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

  // ── Connected, no score yet ────────────────────────────────────────────────
  if (pulseData.hasConnection && pulseData.eligibilityScore === null) {
    return (
      <>
        <div className={CARD}>
          <CardHeader />
          <div className='px-4 pb-4 flex-1 flex flex-col justify-between'>
            <p className='text-xs text-purple-200/60 leading-relaxed mb-3'>
              Connections linked. Calculate your scores to get your eligibility
              rating.
            </p>
            <Button
              color='primary'
              size='sm'
              className='w-full h-8 text-xs font-semibold'
              onPress={() => setShowCalculateModal(true)}
              startContent={<BoltIcon className='w-3.5 h-3.5' />}
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

  // ── Full data ──────────────────────────────────────────────────────────────
  const eligibilityScore = pulseData.eligibilityScore ?? 0;
  const isMonitored = pulseData.isActivelyMonitored;
  const position = pulseData.position;
  const components = pulseData.eligibilityComponents;

  return (
    <>
      <div className={CARD}>
        {/* Header */}
        <CardHeader
          onRefresh={onRefresh}
          badge={
            isMonitored ? (
              <div className='flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2 py-0.5'>
                <span className='w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse' />
                <span className='text-[10px] font-semibold text-emerald-300'>
                  Live
                </span>
              </div>
            ) : (
              <span className='text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5'>
                Unmonitored
              </span>
            )
          }
        />

        {/* Body: score + bars */}
        <div className='px-4 pb-3 flex gap-4 flex-1'>
          {/* Score block */}
          <div className='flex flex-col items-center justify-center shrink-0 w-16 bg-white/5 border border-white/10 rounded-xl py-2'>
            <span className='text-2xl font-extrabold text-white leading-none'>
              {Math.round(eligibilityScore)}
            </span>
            <span className='text-[9px] text-purple-300/60 mt-1 uppercase tracking-wide'>
              Eligibility
            </span>
            {position && (
              <span className='text-[9px] text-amber-400 font-semibold mt-1'>
                #{position}
              </span>
            )}
            <button
              onClick={() => setShowCalculateModal(true)}
              className='text-[9px] text-purple-400/60 hover:text-purple-300 mt-1.5 transition-colors'
            >
              Recalc
            </button>
          </div>

          {/* Component bars */}
          <div className='flex-1 flex flex-col justify-center gap-1.5'>
            {components ? (
              <>
                <MiniBar label='Followers' value={components.followerScore} />
                <MiniBar
                  label='Engagement'
                  value={components.engagementScore}
                />
                <MiniBar
                  label='Consistency'
                  value={components.consistencyScore}
                />
                <MiniBar
                  label='Platforms'
                  value={components.platformDiversityScore}
                />
              </>
            ) : (
              <p className='text-xs text-white/30 text-center'>
                No breakdown available
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='px-4 pb-3.5 pt-2 flex gap-2 border-t border-white/5 shrink-0'>
          <Button
            size='sm'
            variant='bordered'
            className='flex-1 h-7 text-xs border-white/20 text-white/60 hover:text-white hover:border-white/40'
            onPress={() => router.push('/pulse/connect')}
            endContent={<ArrowRightIcon className='w-3 h-3' />}
          >
            Manage
          </Button>
          <Button
            size='sm'
            variant='light'
            className='h-7 text-xs text-white/40 hover:text-white/70 px-2'
            onPress={() => setShowInfoModal(true)}
          >
            About
          </Button>
          {!isMonitored && (
            <button
              onClick={() => setShowNotTrackedModal(true)}
              className='text-[10px] text-purple-400/60 hover:text-purple-300 transition-colors underline'
            >
              Why?
            </button>
          )}
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
