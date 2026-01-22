'use client';

import Image from 'next/image';
import FlemojiModal, {
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@/components/shared/FlemojiModal';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import type { LeagueEntry, SubscoreType } from '../types';
import { getArtistImageUrl } from '../utils';

interface SubscoreExplanationModalProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  entry: LeagueEntry | null;
  subscoreType: SubscoreType | null;
}

export default function SubscoreExplanationModal({
  isOpen,
  onOpenChange,
  entry,
  subscoreType,
}: SubscoreExplanationModalProps) {
  const getScoreValue = () => {
    if (!entry || !subscoreType) return null;
    const value =
      subscoreType === 'audience'
        ? (entry.run_followerScore ?? entry.followerScore)
        : subscoreType === 'engagement'
          ? (entry.run_engagementScore ?? entry.engagementScore)
          : subscoreType === 'consistency'
            ? (entry.run_consistencyScore ?? entry.consistencyScore)
            : (entry.run_platformDiversityScore ??
              entry.platformDiversityScore);
    return value != null ? Math.max(0, Math.min(100, value)) : null;
  };

  const getScoreLabel = () => {
    switch (subscoreType) {
      case 'audience':
        return 'Audience Score';
      case 'engagement':
        return 'Engagement Score';
      case 'consistency':
        return 'Consistency Score';
      case 'presence':
        return 'Presence Score';
      default:
        return 'Score';
    }
  };

  const getWeight = () => {
    switch (subscoreType) {
      case 'audience':
        return '30%';
      case 'engagement':
        return '40%';
      case 'consistency':
        return '20%';
      case 'presence':
        return '10%';
      default:
        return '';
    }
  };

  return (
    <FlemojiModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement='center'
      size='lg'
      scrollBehavior='inside'
      classNames={{
        base: 'bg-white dark:bg-slate-900 rounded-lg overflow-hidden',
        header:
          'border-b border-gray-200/60 dark:border-slate-800/60 p-0 relative z-10 mb-0',
        body: 'py-5 relative z-0',
      }}
    >
      <ModalContent>
        <ModalHeader className='p-0 overflow-hidden rounded-t-lg relative z-10'>
          <div className='w-full px-6 py-5 bg-gradient-to-r from-blue-50/70 via-purple-50/40 to-indigo-50/70 dark:from-blue-950/40 dark:via-purple-950/25 dark:to-indigo-950/40 border-b border-gray-200/60 dark:border-slate-800/60 relative z-10'>
            <div className='inline-flex items-center gap-2 mb-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-300/30 dark:border-blue-700/30'>
              <InformationCircleIcon className='w-4 h-4 text-blue-600 dark:text-blue-400' />
              <span className='text-[10px] font-bold tracking-wider text-blue-700 dark:text-blue-300 uppercase'>
                {getScoreLabel()}
              </span>
            </div>
            <div className='flex items-center gap-3'>
              {entry && getArtistImageUrl(entry.artist_image) && (
                <div className='w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/50 dark:ring-slate-800/50'>
                  <Image
                    src={getArtistImageUrl(entry.artist_image)!}
                    alt={entry.artist_name ?? 'Artist'}
                    width={48}
                    height={48}
                    className='object-cover'
                  />
                </div>
              )}
              {entry && !getArtistImageUrl(entry.artist_image) && (
                <div className='w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 ring-2 ring-white/50 dark:ring-slate-800/50'>
                  <span className='text-lg font-semibold text-gray-500 dark:text-gray-300'>
                    {entry.artist_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <h2 className='text-xl md:text-2xl font-black leading-tight flex-1'>
                <span className='bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent'>
                  {entry?.artist_name ?? 'Score Details'}
                </span>
              </h2>
            </div>
            {entry && subscoreType && (
              <div className='mt-3'>
                <div className='flex items-center gap-2'>
                  <span className='text-2xl font-bold text-gray-900 dark:text-white'>
                    {getScoreValue() != null
                      ? getScoreValue()!.toFixed(1)
                      : '—'}
                  </span>
                  <span className='text-sm text-gray-500 dark:text-gray-400'>
                    / 100
                  </span>
                </div>
              </div>
            )}
          </div>
        </ModalHeader>
        <ModalBody className='px-6 pt-0'>
          {entry && subscoreType && (
            <div className='space-y-6'>
              <div>
                <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
                  What is this score?
                </h3>
                <div className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                  {subscoreType === 'audience' && (
                    <div className='space-y-3'>
                      <p>
                        Your <strong>Audience Score</strong> measures the size
                        and strength of your follower base across the platforms
                        you connect to Flemoji.
                      </p>
                      <p>
                        Pulse³ uses a <strong>logarithmic scale</strong>,
                        meaning your score grows in a realistic curve:
                      </p>
                      <ul className='list-disc list-inside space-y-1.5 text-sm pl-2'>
                        <li>Smaller artists can still achieve strong scores</li>
                        <li>Bigger artists still benefit from their reach</li>
                        <li>
                          Sudden &quot;fake follower jumps&quot; don&apos;t
                          inflate your score
                        </li>
                      </ul>
                      <p>
                        Roughly <strong>100,000 total followers</strong> = a
                        perfect 100 on this scale.
                      </p>
                    </div>
                  )}
                  {subscoreType === 'engagement' && (
                    <p>
                      Your <strong>Engagement Score</strong> measures how well
                      your audience interacts with your content. It combines two
                      factors:
                      <strong> 60% engagement rate</strong> (likes, comments,
                      shares per view) and{' '}
                      <strong>40% average performance</strong> (views relative
                      to your follower count). Higher engagement shows your
                      content resonates with your audience.
                    </p>
                  )}
                  {subscoreType === 'consistency' && (
                    <p>
                      Your <strong>Consistency Score</strong> measures how
                      regularly you post content. It&apos;s calculated based on
                      your posting frequency over time. Posting at least once
                      per day typically achieves the highest scores, while less
                      frequent posting results in lower scores. Consistency
                      shows your commitment to building your presence.
                    </p>
                  )}
                  {subscoreType === 'presence' && (
                    <p>
                      Your <strong>Presence Score</strong> measures how many
                      platforms you&apos;re active on. Having TikTok connected
                      gives you a base score of 50. Connecting Spotify or
                      YouTube increases it to 75, and having all three platforms
                      connected gives you the maximum score of 100. Diversifying
                      your presence across platforms shows broader reach and
                      engagement.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
                  How to improve this score
                </h3>
                <div className='space-y-3'>
                  {subscoreType === 'audience' && (
                    <>
                      <div className='mb-2 text-xs text-gray-500 dark:text-gray-400 italic'>
                        Here&apos;s what actually moves the number:
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Keep growing your audience naturally</strong>
                          <br />
                          <span className='text-xs text-gray-500 dark:text-gray-400'>
                            Create content that speaks to the people you want to
                            reach. Authenticity moves faster than inflated
                            numbers.
                          </span>
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Interact with your community</strong>
                          <br />
                          <span className='text-xs text-gray-500 dark:text-gray-400'>
                            Reply to comments, duet, stitch, collaborate, and
                            engage with other artists. Active creators grow
                            quicker.
                          </span>
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Stay consistent</strong>
                          <br />
                          <span className='text-xs text-gray-500 dark:text-gray-400'>
                            Regular posting trains the algorithm (and your fans)
                            to expect you.
                          </span>
                        </span>
                      </div>
                    </>
                  )}
                  {subscoreType === 'engagement' && (
                    <>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Create compelling content:</strong> Make
                          videos that encourage likes, comments, and shares
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Ask questions:</strong> Encourage your
                          audience to comment by asking for their opinions or
                          experiences
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Post at optimal times:</strong> Share content
                          when your audience is most active
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Engage back:</strong> Respond to comments and
                          interact with your audience to build community
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Use trending sounds and formats:</strong> Tap
                          into what&apos;s popular to increase visibility
                        </span>
                      </div>
                    </>
                  )}
                  {subscoreType === 'consistency' && (
                    <>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Post daily:</strong> Aim for at least one post
                          per day to maximize your consistency score
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Create a content calendar:</strong> Plan your
                          posts in advance to maintain consistency
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Batch create content:</strong> Film multiple
                          videos at once so you always have content ready to
                          post
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Set reminders:</strong> Use scheduling tools
                          or notifications to help you post regularly
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Quality over quantity:</strong> While
                          consistency matters, don&apos;t sacrifice quality. One
                          great post is better than multiple low-quality ones
                        </span>
                      </div>
                    </>
                  )}
                  {subscoreType === 'presence' && (
                    <>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Connect Spotify:</strong> Link your Spotify
                          account to increase your score from 50 to 75
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Connect YouTube:</strong> Link your YouTube
                          channel to reach the maximum score of 100 (if you have
                          all three platforms)
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Maintain active profiles:</strong> Ensure all
                          connected platforms have recent activity
                        </span>
                      </div>
                      <div className='flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400'>
                        <span className='text-blue-500 dark:text-blue-400 mt-0.5'>
                          •
                        </span>
                        <span>
                          <strong>Cross-promote:</strong> Share your content
                          across all platforms to maximize your reach
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className='pt-4 border-t border-gray-200/60 dark:border-slate-700/60'>
                <div className='text-xs text-gray-500 dark:text-gray-400'>
                  <strong>Weight in overall score:</strong> {getWeight()}
                </div>
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </FlemojiModal>
  );
}
