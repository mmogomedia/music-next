'use client';

/**
 * ArtistTypeQuestionnaire
 *
 * 7-step inline questionnaire shown before the first career audit.
 * Maps answers → ArtistType / RevenueModels / GrowthEngines / CareerStage
 * and saves them via POST /api/ai/artist-audit/questionnaire.
 *
 * On completion, calls onComplete() so the parent can start the audit stream.
 */

import { useState } from 'react';
import clsx from 'clsx';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

// ── Question definitions ───────────────────────────────────────────────────────

interface Option {
  value: string;
  label: string;
  sub?: string;
  emoji?: string;
}

interface Question {
  id: keyof RawAnswers;
  title: string;
  subtitle: string;
  multi?: boolean; // ranked multi-select (max 3)
  options: Option[];
}

interface RawAnswers {
  journeyType: string;
  discoveryRanked: string[];
  socialManaged: string;
  incomeRanked: string[];
  primaryGoal: string;
  trackCount: string;
  collaborations: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'journeyType',
    title: 'How would you describe your artist journey?',
    subtitle:
      'This shapes how we score and prioritise recommendations for you.',
    options: [
      {
        value: 'independent',
        label: 'Independent',
        sub: 'I write, record, and release everything myself',
        emoji: '🎤',
      },
      {
        value: 'performer',
        label: 'Live Performer',
        sub: 'My main focus is performing and booking gigs',
        emoji: '🎸',
      },
      {
        value: 'songwriter',
        label: 'Songwriter',
        sub: 'I write songs — mainly for or with other artists',
        emoji: '✍️',
      },
      {
        value: 'session_producer',
        label: 'Producer / Beatmaker',
        sub: 'I produce beats or work in sessions for others',
        emoji: '🎛️',
      },
      {
        value: 'signed_artist',
        label: 'Signed / Managed',
        sub: "I'm signed to a label or have management",
        emoji: '📋',
      },
      {
        value: 'hybrid',
        label: 'Hybrid',
        sub: 'I do a mix of all of the above',
        emoji: '🔀',
      },
    ],
  },
  {
    id: 'discoveryRanked',
    title: 'Where do fans discover you?',
    subtitle: 'Select up to 3 — in order of importance.',
    multi: true,
    options: [
      {
        value: 'social_media',
        label: 'Social media',
        sub: 'TikTok, Instagram, YouTube Shorts',
        emoji: '📱',
      },
      {
        value: 'playlists',
        label: 'Playlists',
        sub: 'Spotify, Apple Music editorial & algorithmic',
        emoji: '🎧',
      },
      {
        value: 'live_shows',
        label: 'Live shows',
        sub: 'People see me perform in person',
        emoji: '🎪',
      },
      {
        value: 'word_of_mouth',
        label: 'Word of mouth',
        sub: 'Local scene, community, cultural circles',
        emoji: '🗣️',
      },
      {
        value: 'collaborations',
        label: 'Collaborations',
        sub: "Other artists' audiences find me",
        emoji: '🤝',
      },
      {
        value: 'press_media',
        label: 'Press & media',
        sub: 'Blogs, radio, music publications',
        emoji: '📰',
      },
    ],
  },
  {
    id: 'socialManaged',
    title: 'Who handles your social media?',
    subtitle: 'Affects how we weight your platform presence in the audit.',
    options: [
      {
        value: 'myself',
        label: 'I do it myself',
        sub: 'I create and post all my own content',
        emoji: '💪',
      },
      {
        value: 'team_helps',
        label: 'I have help',
        sub: 'A manager, team member, or agency assists me',
        emoji: '👥',
      },
      {
        value: 'not_active',
        label: "I'm not very active",
        sub: "Social media isn't a focus right now",
        emoji: '🔇',
      },
    ],
  },
  {
    id: 'incomeRanked',
    title: 'What are your main income sources from music?',
    subtitle: 'Select up to 3 — put the biggest earner first.',
    multi: true,
    options: [
      {
        value: 'live_shows',
        label: 'Live shows',
        sub: 'Gigs, events, bookings',
        emoji: '🎪',
      },
      {
        value: 'streaming',
        label: 'Streaming royalties',
        sub: 'Spotify, Apple Music, etc.',
        emoji: '🎧',
      },
      {
        value: 'production',
        label: 'Production',
        sub: 'Beat sales, session fees, mixing',
        emoji: '🎛️',
      },
      {
        value: 'sync',
        label: 'Sync licensing',
        sub: 'TV, film, adverts, games',
        emoji: '📺',
      },
      {
        value: 'merch',
        label: 'Merch & products',
        sub: 'Clothing, physical releases, etc.',
        emoji: '👕',
      },
      {
        value: 'mixed',
        label: 'No dominant stream',
        sub: 'My income is spread across many areas',
        emoji: '🔀',
      },
    ],
  },
  {
    id: 'primaryGoal',
    title: "What's your main goal right now?",
    subtitle: "We'll prioritise actions that move you toward this.",
    options: [
      {
        value: 'more_streams',
        label: 'More streams',
        sub: 'Grow my audience and online numbers',
        emoji: '📈',
      },
      {
        value: 'more_gigs',
        label: 'More gigs',
        sub: 'Book more shows and grow my live presence',
        emoji: '🎟️',
      },
      {
        value: 'get_signed',
        label: 'Get signed or managed',
        sub: 'Attract a label, manager, or booking agent',
        emoji: '🤝',
      },
      {
        value: 'production_career',
        label: 'Build a production career',
        sub: 'More placements, credits, and production work',
        emoji: '🎛️',
      },
      {
        value: 'more_revenue',
        label: 'Make more money',
        sub: 'Unlock new or stronger income streams',
        emoji: '💰',
      },
    ],
  },
  {
    id: 'trackCount',
    title: 'How many tracks have you released publicly?',
    subtitle: 'This helps us calibrate your career stage.',
    options: [
      {
        value: '0_5',
        label: '0 – 5 tracks',
        sub: 'Just getting started',
        emoji: '🌱',
      },
      {
        value: '6_20',
        label: '6 – 20 tracks',
        sub: 'Building momentum',
        emoji: '🌿',
      },
      {
        value: '21_50',
        label: '21 – 50 tracks',
        sub: 'Established catalogue',
        emoji: '🌳',
      },
      {
        value: '50_plus',
        label: '50+ tracks',
        sub: 'Veteran with a large catalogue',
        emoji: '🏆',
      },
    ],
  },
  {
    id: 'collaborations',
    title: 'How often do you collaborate with other artists?',
    subtitle: 'Affects how we assess your network and reach.',
    options: [
      {
        value: 'never',
        label: 'Rarely or never',
        sub: 'I mostly work alone',
        emoji: '🧍',
      },
      {
        value: 'occasionally',
        label: 'Occasionally',
        sub: 'A feature or two, here and there',
        emoji: '🤜',
      },
      {
        value: 'regularly',
        label: 'Regularly',
        sub: 'Collaborations are part of my process',
        emoji: '🎶',
      },
      {
        value: 'central',
        label: "It's central to how I work",
        sub: 'I thrive through collaboration',
        emoji: '🌐',
      },
    ],
  },
];

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className='flex items-center gap-1.5'>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={clsx(
            'rounded-full transition-all duration-300',
            i < current
              ? 'w-2 h-2 bg-purple-600'
              : i === current
                ? 'w-4 h-2 bg-purple-600'
                : 'w-2 h-2 bg-slate-200 dark:bg-slate-700'
          )}
        />
      ))}
    </div>
  );
}

// ── Option card ───────────────────────────────────────────────────────────────

function OptionCard({
  option,
  selected,
  rank,
  onClick,
}: {
  option: Option;
  selected: boolean;
  rank?: number; // 1-based rank for multi-select
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150',
        selected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
      )}
    >
      {/* Emoji */}
      {option.emoji && (
        <span className='text-xl flex-shrink-0 w-8 text-center' aria-hidden>
          {option.emoji}
        </span>
      )}

      {/* Text */}
      <div className='flex-1 min-w-0'>
        <p
          className={clsx(
            'text-sm font-semibold leading-tight',
            selected
              ? 'text-purple-800 dark:text-purple-200'
              : 'text-slate-800 dark:text-slate-200'
          )}
        >
          {option.label}
        </p>
        {option.sub && (
          <p
            className={clsx(
              'text-xs mt-0.5 leading-tight',
              selected
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {option.sub}
          </p>
        )}
      </div>

      {/* Selection indicator */}
      <div
        className={clsx(
          'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
          selected
            ? 'border-purple-600 bg-purple-600'
            : 'border-slate-300 dark:border-slate-600'
        )}
      >
        {selected && rank ? (
          <span className='text-[10px] font-bold text-white'>{rank}</span>
        ) : selected ? (
          <CheckIcon className='w-3.5 h-3.5 text-white' />
        ) : null}
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ArtistTypeQuestionnaireProps {
  onComplete: () => void;
  /** If provided, shows a Cancel button (used when re-opened from the result view) */
  onCancel?: () => void;
}

export default function ArtistTypeQuestionnaire({
  onComplete,
  onCancel,
}: ArtistTypeQuestionnaireProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<RawAnswers>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const currentAnswer = answers[question.id];

  // ── Selection handlers ──────────────────────────────────────────────────────

  function selectSingle(value: string) {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  }

  function toggleMulti(value: string) {
    const current = (answers[question.id] as string[] | undefined) ?? [];
    if (current.includes(value)) {
      setAnswers(prev => ({
        ...prev,
        [question.id]: current.filter(v => v !== value),
      }));
    } else if (current.length < 3) {
      setAnswers(prev => ({ ...prev, [question.id]: [...current, value] }));
    }
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function canAdvance(): boolean {
    if (!currentAnswer) return false;
    if (question.multi) {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    }
    return typeof currentAnswer === 'string' && currentAnswer.length > 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/artist-audit/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to save answers');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className='max-w-2xl mx-auto'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-8'>
        <div className='w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0'>
          <SparklesIcon className='w-5 h-5 text-white' />
        </div>
        <div>
          <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
            Tell us about your journey
          </h2>
          <p className='text-xs text-slate-500 dark:text-slate-400'>
            7 quick questions — takes about 90 seconds
          </p>
        </div>
        <div className='ml-auto flex items-center gap-3'>
          <StepDots total={QUESTIONS.length} current={step} />
          {onCancel && (
            <button
              onClick={onCancel}
              className='text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors'
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Question */}
      <div className='mb-6'>
        <p className='text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1'>
          Question {step + 1} of {QUESTIONS.length}
        </p>
        <h3 className='text-xl font-bold text-slate-900 dark:text-white mb-1'>
          {question.title}
        </h3>
        <p className='text-sm text-slate-500 dark:text-slate-400'>
          {question.subtitle}
        </p>
      </div>

      {/* Options */}
      <div className='space-y-2.5 mb-8'>
        {question.options.map(option => {
          const isMulti = question.multi;
          const multiArr = (currentAnswer as string[] | undefined) ?? [];
          const selected = isMulti
            ? multiArr.includes(option.value)
            : currentAnswer === option.value;
          const rank = isMulti ? multiArr.indexOf(option.value) + 1 : undefined;

          return (
            <OptionCard
              key={option.value}
              option={option}
              selected={selected}
              rank={rank || undefined}
              onClick={() =>
                isMulti ? toggleMulti(option.value) : selectSingle(option.value)
              }
            />
          );
        })}
      </div>

      {/* Multi-select hint */}
      {question.multi && (
        <p className='text-xs text-slate-400 dark:text-slate-500 -mt-5 mb-6'>
          {((currentAnswer as string[] | undefined) ?? []).length} / 3 selected
          — the order you pick them sets the priority
        </p>
      )}

      {/* Error */}
      {error && (
        <p className='text-sm text-rose-600 dark:text-rose-400 mb-4'>{error}</p>
      )}

      {/* Navigation */}
      <div className='flex items-center justify-between'>
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className={clsx(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
            step === 0
              ? 'invisible'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <ArrowLeftIcon className='w-4 h-4' />
          Back
        </button>

        <button
          onClick={isLast ? handleSubmit : () => setStep(s => s + 1)}
          disabled={!canAdvance() || submitting}
          className={clsx(
            'inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
            canAdvance() && !submitting
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          )}
        >
          {submitting ? (
            'Saving…'
          ) : isLast ? (
            <>
              Run My Audit
              <SparklesIcon className='w-4 h-4' />
            </>
          ) : (
            <>
              Next
              <ArrowRightIcon className='w-4 h-4' />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
