'use client';

import FlemojiModal, {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/shared/FlemojiModal';
import { Button } from '@heroui/react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface PulseNotTrackedModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibilityScore?: number;
}

export default function PulseNotTrackedModal({
  isOpen,
  onClose,
  eligibilityScore,
}: PulseNotTrackedModalProps) {
  const score = eligibilityScore ?? 0;

  // Determine reason based on score
  const getReason = () => {
    if (score < 30) {
      return {
        title: 'Low Eligibility Score',
        description:
          'Your eligibility score is below the threshold needed for active monitoring. PULSE³ actively monitors the top 100 artists based on eligibility scores.',
        reasons: [
          'Your TikTok reach may need to grow',
          'Engagement quality could be improved',
          'Posting consistency may need work',
          'Recent performance may be below baseline',
        ],
        tips: [
          'Post consistently on TikTok',
          'Focus on creating engaging content',
          'Build your follower base organically',
          'Connect your Spotify account for additional context',
        ],
      };
    } else if (score < 50) {
      return {
        title: 'Building Eligibility',
        description:
          "You're making progress! Your eligibility score is improving, but you're not yet in the top 100 artists being actively monitored.",
        reasons: [
          'Your score is competitive but not in the top tier',
          'Other artists may have higher engagement rates',
          'Activity consistency could be improved',
        ],
        tips: [
          'Continue posting regularly',
          'Focus on engagement quality over quantity',
          'Monitor your eligibility score as it updates',
        ],
      };
    } else {
      return {
        title: 'Not Currently Monitored',
        description:
          "Your eligibility score is strong, but you're not currently in the top 100 actively monitored artists. This can change as scores are recalculated.",
        reasons: [
          'The top 100 slots are competitive',
          'Scores are recalculated periodically',
          'Your position may change with momentum',
        ],
        tips: [
          'Keep building momentum',
          'Your eligibility score will be re-evaluated',
          'Focus on consistent growth',
        ],
      };
    }
  };

  const reason = getReason();

  return (
    <FlemojiModal
      isOpen={isOpen}
      onClose={onClose}
      size='lg'
      scrollBehavior='inside'
    >
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <InformationCircleIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
            <span>Why You&apos;re Not Being Tracked</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className='space-y-4'>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
                {reason.title}
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {reason.description}
              </p>
            </div>

            {eligibilityScore !== undefined && (
              <div className='bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Your Eligibility Score:
                  </span>
                  <span className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                    {Math.round(eligibilityScore)}/100
                  </span>
                </div>
              </div>
            )}

            <div>
              <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
                Possible Reasons:
              </h4>
              <ul className='list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400'>
                {reason.reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
                Tips to Improve:
              </h4>
              <ul className='list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400'>
                {reason.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className='bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3'>
              <p className='text-xs text-gray-600 dark:text-gray-400'>
                <strong>Note:</strong> PULSE³ actively monitors 100 artists at a
                time. Eligibility scores are recalculated periodically, and your
                position can change as momentum builds.
              </p>
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
