'use client';

import FlemojiModal, {
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@/components/shared/FlemojiModal';
import { Chip, Accordion, AccordionItem } from '@heroui/react';
import { TrophyIcon } from '@heroicons/react/24/outline';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({
  isOpen,
  onClose,
}: HowItWorksModalProps) {
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
        <ModalHeader className='p-0 overflow-hidden rounded-t-lg'>
          <div className='w-full px-6 py-5 bg-gradient-to-r from-blue-50/70 via-purple-50/40 to-indigo-50/70 dark:from-blue-950/40 dark:via-purple-950/25 dark:to-indigo-950/40 border-b border-gray-200/60 dark:border-slate-800/60'>
            <div className='inline-flex items-center gap-2 mb-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-300/30 dark:border-blue-700/30'>
              <TrophyIcon className='w-4 h-4 text-blue-600 dark:text-blue-400' />
              <span className='text-[10px] font-bold tracking-wider text-blue-700 dark:text-blue-300 uppercase'>
                PULSE³ — Artist Momentum Index
              </span>
            </div>
            <h2 className='text-2xl md:text-3xl font-black leading-tight'>
              <span className='bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent'>
                How Pulse³ works
              </span>
            </h2>
            <p className='mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-3xl'>
              Pulse³ is your momentum tracker inside Flemoji — turning real
              audience signals into a clear score and a public league.
            </p>
          </div>
        </ModalHeader>
        <ModalBody className='px-6'>
          <div className='space-y-6 text-sm text-gray-700 dark:text-gray-300'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4'>
                <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-2'>
                  What Pulse³ is
                </h3>
                <p className='leading-relaxed'>
                  Once you connect TikTok and/or Spotify, Pulse³ reads the
                  signals your audience creates and turns them into a simple,
                  real-time score. It&apos;s built to help artists understand
                  traction and grow — not to judge unfairly.
                </p>
              </div>

              <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4'>
                <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-2'>
                  Why artists care
                </h3>
                <ul className='space-y-2'>
                  <li>
                    <span className='font-semibold'>Clarity</span>: see if
                    you&apos;re rising, holding, or slowing.
                  </li>
                  <li>
                    <span className='font-semibold'>Learning</span>: understand
                    what content patterns boost visibility.
                  </li>
                  <li>
                    <span className='font-semibold'>Visibility</span>: strong
                    momentum appears on the public leaderboard.
                  </li>
                </ul>
              </div>
            </div>

            <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 p-4'>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-3'>
                How Pulse³ works (Artist version)
              </h3>
              <div className='grid gap-3 md:grid-cols-2'>
                <div className='rounded-lg bg-white dark:bg-slate-900 p-3 border border-gray-200 dark:border-slate-700'>
                  <div className='font-semibold text-gray-900 dark:text-white'>
                    1. Audience Strength
                  </div>
                  <div className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                    How steady and meaningful your audience is across connected
                    platforms.
                  </div>
                </div>
                <div className='rounded-lg bg-white dark:bg-slate-900 p-3 border border-gray-200 dark:border-slate-700'>
                  <div className='font-semibold text-gray-900 dark:text-white'>
                    2. Engagement Quality
                  </div>
                  <div className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                    How deeply people react to your content, not just
                    superficial likes.
                  </div>
                </div>
                <div className='rounded-lg bg-white dark:bg-slate-900 p-3 border border-gray-200 dark:border-slate-700'>
                  <div className='font-semibold text-gray-900 dark:text-white'>
                    3. Posting Consistency
                  </div>
                  <div className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                    Momentum grows when you show up. We track your rhythm over
                    time.
                  </div>
                </div>
                <div className='rounded-lg bg-white dark:bg-slate-900 p-3 border border-gray-200 dark:border-slate-700'>
                  <div className='font-semibold text-gray-900 dark:text-white'>
                    4. Platform Presence
                  </div>
                  <div className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                    Whether movement is happening on one platform or across
                    multiple.
                  </div>
                </div>
              </div>
              <p className='mt-3 text-xs text-gray-600 dark:text-gray-400'>
                These combine into your Eligibility Score (0–100), which
                determines your position in Pulse³.
              </p>
            </div>

            <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4'>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-3'>
                The Pulse³ tiers
              </h3>
              <div className='flex flex-wrap gap-2 mb-3'>
                <Chip size='sm' color='primary' variant='flat'>
                  Tier 1 — Top Tier (Top 50)
                </Chip>
                <Chip size='sm' color='default' variant='flat'>
                  Tier 2 — Watchlist (Next 100)
                </Chip>
              </div>
              <p className='leading-relaxed'>
                Your rise or fall reflects real movement — not opinions, not
                hype. Rankings update throughout the day depending on tier
                rules.
              </p>
            </div>

            <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4'>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-3'>
                What you&apos;ll see in the league
              </h3>
              <div className='grid gap-3 md:grid-cols-2'>
                <div className='rounded-lg bg-gray-50 dark:bg-slate-800/60 p-3 border border-gray-200 dark:border-slate-700'>
                  <div className='font-semibold text-gray-900 dark:text-white mb-1'>
                    Movement
                  </div>
                  <div className='text-xs text-gray-600 dark:text-gray-400'>
                    Up, Down, Holding, New entries, plus promotions/demotions.
                  </div>
                </div>
                <div className='rounded-lg bg-gray-50 dark:bg-slate-800/60 p-3 border border-gray-200 dark:border-slate-700'>
                  <div className='font-semibold text-gray-900 dark:text-white mb-1'>
                    Stability markers
                  </div>
                  <div className='text-xs text-gray-600 dark:text-gray-400'>
                    Secure, At Risk, Above Range (promotion candidate).
                  </div>
                </div>
              </div>
            </div>

            <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4'>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-3'>
                Privacy + control
              </h3>
              <ul className='space-y-2'>
                <li>
                  <span className='font-semibold'>Opt-in only</span>: if you
                  don&apos;t connect platforms, you won&apos;t appear.
                </li>
                <li>
                  <span className='font-semibold'>No scraping</span>: we only
                  use approved API data you choose to share.
                </li>
                <li>
                  <span className='font-semibold'>Disconnect anytime</span>:
                  your data stops updating immediately.
                </li>
              </ul>
            </div>

            <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4'>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-3'>
                FAQ
              </h3>
              <Accordion variant='splitted'>
                <AccordionItem
                  key='faq-1'
                  aria-label='Connect TikTok/Spotify'
                  title='Do I need to connect TikTok or Spotify to appear in Pulse³?'
                >
                  Yes. Pulse³ is 100% opt-in. If you don&apos;t connect your
                  platforms, you won&apos;t appear in the rankings.
                </AccordionItem>
                <AccordionItem
                  key='faq-2'
                  aria-label='Public data'
                  title='Does Pulse³ use public data?'
                >
                  No. Pulse³ only uses the data you choose to share by
                  connecting your platforms. Nothing is collected without your
                  permission.
                </AccordionItem>
                <AccordionItem
                  key='faq-3'
                  aria-label='TikTok access'
                  title='What does Pulse³ access when I connect TikTok?'
                >
                  Only fields approved by TikTok&apos;s official API, such as
                  basic profile info, public videos, and public engagement
                  stats. Pulse³ does not access internal dashboards or private
                  analytics.
                </AccordionItem>
                <AccordionItem
                  key='faq-4'
                  aria-label='Spotify access'
                  title='What about Spotify?'
                >
                  If you connect Spotify, Pulse³ uses approved API data such as
                  your artist profile, monthly listeners, and public follower
                  metrics. No private Spotify for Artists numbers are accessed
                  unless Spotify exposes them via allowed scopes.
                </AccordionItem>
                <AccordionItem
                  key='faq-5'
                  aria-label='Disconnect'
                  title='What happens if I disconnect my accounts?'
                >
                  Your data stops updating immediately and you will no longer
                  appear in Pulse³.
                </AccordionItem>
                <AccordionItem
                  key='faq-6'
                  aria-label='Small artists'
                  title='Can a small artist appear in the Top Tier?'
                >
                  Yes. Pulse³ rewards momentum — not size. If your content is
                  hitting and your audience is reacting strongly, you can
                  outrank bigger artists.
                </AccordionItem>
                <AccordionItem
                  key='faq-7'
                  aria-label='Score changes'
                  title='Why does my score go up or down?'
                >
                  Your score changes based on how people respond to your
                  content, how consistently you post, how your audience evolves,
                  and how your connected platforms shift over time.
                </AccordionItem>
                <AccordionItem
                  key='faq-8'
                  aria-label='Guarantees'
                  title='Does Pulse³ guarantee streams or growth?'
                >
                  No system can guarantee that — but Pulse³ gives insight into
                  momentum so you can make smarter, more strategic moves.
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </FlemojiModal>
  );
}
