'use client';

import FlemojiModal, {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/shared/FlemojiModal';
import { Button } from '@heroui/react';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface PulseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PulseInfoModal({
  isOpen,
  onClose,
}: PulseInfoModalProps) {
  return (
    <FlemojiModal
      isOpen={isOpen}
      onClose={onClose}
      size='2xl'
      scrollBehavior='inside'
      classNames={{
        base: 'bg-white dark:bg-slate-900',
        header: 'border-b border-gray-200 dark:border-slate-800',
        body: 'py-6',
      }}
    >
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
              <SparklesIcon className='w-6 h-6 text-white' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                What is PULSE³?
              </h2>
              <p className='text-sm font-normal text-gray-600 dark:text-gray-400'>
                Real-time momentum intelligence for artists
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className='space-y-6'>
            {/* Overview */}
            <div>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-2'>
                Get Discovered and Stand Out
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                PULSE³ (pronounced &quot;Pulse Three&quot;) helps you get
                discovered by tracking when your profile is gaining real
                momentum. When your eligibility and momentum scores are strong,
                you stand out to listeners, playlists, and opportunities—helping
                your music reach the right audience at the perfect time.
              </p>
            </div>

            {/* Core Principle */}
            <div>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-2'>
                How Discovery Happens
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2'>
                <strong className='text-gray-900 dark:text-white'>
                  Momentum × Momentum × Momentum
                </strong>
              </p>
              <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                When your profile starts getting noticed, that attention
                compounds—more people discover you, which leads to even more
                discovery. PULSE³ catches this early, so you can stand out when
                it matters most and get your music in front of the right people.
              </p>
            </div>

            {/* How It Works */}
            <div>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-3'>
                How PULSE³ Helps You Get Discovered
              </h3>
              <div className='space-y-3'>
                <div className='bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border-l-4 border-blue-600'>
                  <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
                    1. Detection
                  </h4>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>
                    We spot when your profile is starting to get noticed—more
                    people discovering your music, engaging with your content,
                    and sharing it. This early detection means you can stand out
                    before everyone else catches on.
                  </p>
                </div>
                <div className='bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border-l-4 border-green-600'>
                  <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
                    2. Acceleration
                  </h4>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>
                    We track whether your discovery is speeding up—meaning more
                    people are finding you every day. When this happens, your
                    profile stands out more, making you visible to playlists,
                    curators, and new fans.
                  </p>
                </div>
                <div className='bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border-l-4 border-purple-600'>
                  <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
                    3. Compounding
                  </h4>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>
                    When your discovery momentum is strong, you get prioritized
                    in our monitoring system. This means your profile gets more
                    visibility, helping you stand out to the right people at the
                    perfect moment for maximum impact.
                  </p>
                </div>
              </div>
            </div>

            {/* Scores Explained */}
            <div>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-3'>
                How Your Scores Help You Stand Out
              </h3>
              <div className='space-y-3'>
                <div className='bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3'>
                  <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-1.5'>
                    Eligibility Score
                  </h4>
                  <p className='text-xs text-gray-600 dark:text-gray-400 mb-2'>
                    This score determines if your profile stands out enough to
                    be actively monitored. The higher your score, the more
                    visible you become in our system. We calculate it based on:
                  </p>
                  <ul className='text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside'>
                    <li>
                      Your TikTok reach and how consistently you&apos;re growing
                    </li>
                    <li>
                      How engaged your audience is (likes, comments, shares per
                      view)
                    </li>
                    <li>How regularly you post content</li>
                    <li>How your recent posts are performing</li>
                    <li>Your Spotify presence (if connected)</li>
                  </ul>
                  <p className='text-xs text-gray-500 dark:text-gray-500 mt-2'>
                    <strong>Why it matters:</strong> If you&apos;re in the top
                    100, your profile gets prioritized monitoring, appears on
                    the public Top 100 chart, making you more discoverable and
                    helping you stand out to listeners and opportunities.
                  </p>
                </div>
                <div className='bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3'>
                  <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-1.5'>
                    Momentum Score
                  </h4>
                  <p className='text-xs text-gray-600 dark:text-gray-400 mb-2'>
                    Once you&apos;re being actively monitored, this score shows
                    how much you&apos;re being discovered right now. It
                    measures:
                  </p>
                  <ul className='text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside'>
                    <li>How quickly new people are discovering your profile</li>
                    <li>Whether discovery is speeding up or slowing down</li>
                    <li>
                      Whether the discovery is consistent or just a one-time
                      spike
                    </li>
                    <li>
                      How you&apos;re standing out compared to artists at your
                      level
                    </li>
                  </ul>
                  <p className='text-xs text-gray-500 dark:text-gray-500 mt-2'>
                    <strong>Why it matters:</strong> Your position (1-100)
                    determines your ranking on the public Top 100 chart. A
                    higher position means more visibility on the chart, more
                    discovery opportunities, and a better chance to get your
                    music heard by the right people.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Benefits */}
            <div className='bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4'>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
                How PULSE³ Helps You Get Discovered
              </h3>
              <ul className='text-xs text-gray-600 dark:text-gray-400 space-y-1.5'>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 dark:text-blue-400 mt-0.5'>
                    •
                  </span>
                  <span>
                    <strong>Featured on the Top 100 Chart:</strong> When
                    you&apos;re in the top 100, you appear on our public chart
                    where thousands of listeners discover new artists. This
                    gives you massive visibility and helps you stand out from
                    the crowd
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 dark:text-blue-400 mt-0.5'>
                    •
                  </span>
                  <span>
                    <strong>Stand out when it matters:</strong> Get prioritized
                    visibility when your profile is gaining momentum, helping
                    you get discovered by new fans and opportunities
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 dark:text-blue-400 mt-0.5'>
                    •
                  </span>
                  <span>
                    <strong>Be seen by the right people:</strong> Higher scores
                    mean your profile gets more attention from listeners,
                    playlists, and curators looking for emerging talent
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 dark:text-blue-400 mt-0.5'>
                    •
                  </span>
                  <span>
                    <strong>Ride the discovery wave:</strong> Know when
                    you&apos;re being discovered so you can maximize that
                    moment—engage with new fans, release content, or promote
                    your work
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 dark:text-blue-400 mt-0.5'>
                    •
                  </span>
                  <span>
                    <strong>Compete for chart position:</strong> Your position
                    (1-100) on the public chart shows how much you&apos;re
                    standing out. The higher you rank, the more visible you are
                    to potential fans and the better your chances of discovery
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onPress={onClose}>
            Got it
          </Button>
        </ModalFooter>
      </ModalContent>
    </FlemojiModal>
  );
}
