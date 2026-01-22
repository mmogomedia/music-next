'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardBody, Button, Chip, Alert } from '@heroui/react';
import {
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import PulseInfoModal from './PulseInfoModal';
import ScoreCalculationModal from './ScoreCalculationModal';

// Platform Logo Components
const TikTokLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox='0 0 24 24'
    fill='currentColor'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z' />
  </svg>
);

const SpotifyLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox='0 0 24 24'
    fill='currentColor'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z' />
  </svg>
);

const YouTubeLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox='0 0 24 24'
    fill='currentColor'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
  </svg>
);

export default function PulseConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [calculationData, setCalculationData] = useState<{
    tiktokData: any;
    scoreBreakdown: any;
  } | null>(null);

  // Check for OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setMessage({ type: 'success', text: 'TikTok connected successfully!' });
      setTiktokConnected(true);

      // Fetch calculation breakdown and show modal
      fetchCalculationBreakdown();

      // Clear URL params
      router.replace('/pulse/connect');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        unauthorized: 'You must be logged in to connect TikTok.',
        no_code: 'Authorization was cancelled or failed.',
        invalid_state: 'Security verification failed. Please try again.',
        config_error: 'TikTok integration is not properly configured.',
        no_profile: 'Please create an artist profile first.',
        callback_error: 'Failed to complete TikTok connection.',
        token_exchange_error:
          'Failed to exchange authorization code for token. Please try again.',
        user_info_error: 'Failed to fetch user information from TikTok.',
        missing_code_verifier:
          'Security verification failed. Please try again.',
      };

      const details = searchParams.get('details');
      const errorMessage =
        errorMessages[error] || 'An error occurred connecting TikTok.';
      setMessage({
        type: 'error',
        text: details ? `${errorMessage} ${details}` : errorMessage,
      });
      // Clear URL params
      router.replace('/pulse/connect');
    }
  }, [searchParams, router]);

  // Fetch connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/pulse/tiktok/status');
        if (response.ok) {
          const data = await response.json();
          setTiktokConnected(data.connected === true);
        } else {
          setTiktokConnected(false);
        }
      } catch (error) {
        console.error('Error checking TikTok connection:', error);
        setTiktokConnected(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnectTikTok = () => {
    setLoading(true);
    // Redirect to OAuth authorization endpoint
    window.location.href = '/api/pulse/tiktok/authorize';
  };

  const handleDisconnectTikTok = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pulse/tiktok/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setTiktokConnected(false);
        setCalculationData(null);
      } else {
        console.error('Failed to disconnect TikTok');
      }
    } catch (error) {
      console.error('Error disconnecting TikTok:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalculationBreakdown = async () => {
    try {
      // Small delay to ensure data is saved after callback
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch('/api/pulse/calculate-breakdown');
      if (response.ok) {
        const data = await response.json();
        setCalculationData(data);
        setShowCalculationModal(true);
      }
    } catch (error) {
      console.error('Error fetching calculation breakdown:', error);
    }
  };

  return (
    <>
      {/* Header with Logo */}
      <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <Link href='/' className='flex items-center gap-3'>
              <Image
                src='/logo_symbol.png'
                alt='Flemoji symbol'
                width={32}
                height={32}
                priority
                className='h-8 w-8 rounded-lg block lg:hidden'
              />
              <Image
                src='/main_logo.png'
                alt='Flemoji'
                width={220}
                height={60}
                priority
                className='h-10 w-auto hidden lg:block'
              />
            </Link>
            <Button
              variant='light'
              size='sm'
              onPress={() => router.back()}
              startContent={<ArrowLeftIcon className='w-4 h-4' />}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Success/Error Messages */}
        {message && (
          <Alert
            color={message.type === 'success' ? 'success' : 'danger'}
            variant='flat'
            className='mb-6'
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {/* Page Header */}
        <div className='mb-6'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center'>
              <SparklesIcon className='w-6 h-6 text-white' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Connect to PULSE³
              </h1>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Get discovered and stand out on the Top 100 chart
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content - Left Side */}
          <div className='lg:col-span-2 space-y-6'>
            {/* What is PULSE³ Section */}
            <Card>
              <CardBody className='p-6'>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                  What is PULSE³?
                </h2>
                <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4'>
                  PULSE³ (pronounced &quot;Pulse Three&quot;) is Flemoji&apos;s
                  real-time momentum intelligence system. It tracks when your
                  profile is gaining momentum and helps you get discovered by
                  appearing on the public Top 100 chart.
                </p>
                <div className='bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 mb-4'>
                  <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
                    How It Works
                  </h3>
                  <ul className='text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-disc list-inside'>
                    <li>
                      Connect your social platforms and streaming profiles to
                      track your momentum
                    </li>
                    <li>
                      PULSE³ calculates your eligibility score based on
                      engagement, activity, and performance
                    </li>
                    <li>
                      Top 100 artists get actively monitored and appear on the
                      public chart
                    </li>
                    <li>
                      Your momentum score determines your position (1-100) on
                      the chart
                    </li>
                  </ul>
                </div>
                <Button
                  variant='light'
                  size='sm'
                  onPress={() => setShowInfoModal(true)}
                  className='text-xs'
                >
                  Learn more about PULSE³
                </Button>
              </CardBody>
            </Card>

            {/* Platform Connections */}
            <Card>
              <CardBody className='p-6'>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                  Connect Your Platforms
                </h2>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>
                  Connect your social platforms and streaming profiles to start
                  tracking your momentum. The more platforms you connect, the
                  more accurate your scores will be.
                </p>

                <div className='space-y-4'>
                  {/* TikTok Connection */}
                  <div className='border border-gray-200 dark:border-slate-700 rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0'>
                          <TikTokLogo className='w-6 h-6 text-white' />
                        </div>
                        <div>
                          <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                            TikTok
                          </h3>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            Track engagement, reach, and activity
                          </p>
                        </div>
                      </div>
                      {tiktokConnected ? (
                        <Chip
                          size='sm'
                          color='success'
                          variant='flat'
                          startContent={<CheckCircleIcon className='w-4 h-4' />}
                        >
                          Connected
                        </Chip>
                      ) : (
                        <Button
                          color='primary'
                          size='sm'
                          onPress={handleConnectTikTok}
                          className='h-8 text-xs'
                          isLoading={loading}
                          isDisabled={loading}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                    {tiktokConnected && (
                      <div className='mt-3 pt-3 border-t border-gray-200 dark:border-slate-700'>
                        <Button
                          variant='light'
                          size='sm'
                          color='danger'
                          className='h-7 text-xs'
                          onPress={handleDisconnectTikTok}
                          isLoading={loading}
                          isDisabled={loading}
                        >
                          Disconnect
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Spotify Connection - Disabled */}
                  <div className='border border-gray-200 dark:border-slate-700 rounded-lg p-4 opacity-60'>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-[#1DB954] rounded-lg flex items-center justify-center flex-shrink-0'>
                          <SpotifyLogo className='w-6 h-6 text-white' />
                        </div>
                        <div>
                          <div className='flex items-center gap-2'>
                            <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                              Spotify
                            </h3>
                            <Chip
                              size='sm'
                              variant='flat'
                              color='default'
                              className='h-5 text-[10px]'
                            >
                              Coming Soon
                            </Chip>
                          </div>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            Add context with monthly listeners and followers
                          </p>
                        </div>
                      </div>
                      <Button
                        color='default'
                        size='sm'
                        isDisabled
                        className='h-8 text-xs'
                        variant='bordered'
                      >
                        Connect
                      </Button>
                    </div>
                  </div>

                  {/* YouTube Connection - Disabled */}
                  <div className='border border-gray-200 dark:border-slate-700 rounded-lg p-4 opacity-60'>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-[#FF0000] rounded-lg flex items-center justify-center flex-shrink-0'>
                          <YouTubeLogo className='w-6 h-6 text-white' />
                        </div>
                        <div>
                          <div className='flex items-center gap-2'>
                            <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                              YouTube
                            </h3>
                            <Chip
                              size='sm'
                              variant='flat'
                              color='default'
                              className='h-5 text-[10px]'
                            >
                              Coming Soon
                            </Chip>
                          </div>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            Track views, subscribers, and engagement
                          </p>
                        </div>
                      </div>
                      <Button
                        color='default'
                        size='sm'
                        isDisabled
                        className='h-8 text-xs'
                        variant='bordered'
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className='space-y-6'>
            {/* Benefits Card */}
            <Card>
              <CardBody className='p-6'>
                <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-4'>
                  Benefits
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-start gap-2'>
                    <CheckCircleIcon className='w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='text-sm font-medium text-gray-900 dark:text-white'>
                        Featured on Top 100 Chart
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        Get discovered by thousands of listeners
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-2'>
                    <CheckCircleIcon className='w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='text-sm font-medium text-gray-900 dark:text-white'>
                        Real-time Momentum Tracking
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        See when you&apos;re gaining traction
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-2'>
                    <CheckCircleIcon className='w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='text-sm font-medium text-gray-900 dark:text-white'>
                        Stand Out to Opportunities
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        Get noticed by playlists and curators
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* What Happens Next */}
            <Card>
              <CardBody className='p-6'>
                <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-4'>
                  What Happens Next
                </h3>
                <div className='space-y-3 text-sm text-gray-600 dark:text-gray-400'>
                  <div className='flex items-start gap-2'>
                    <span className='text-blue-600 dark:text-blue-400 font-semibold'>
                      1.
                    </span>
                    <span>
                      We calculate your eligibility score based on your
                      connected platforms
                    </span>
                  </div>
                  <div className='flex items-start gap-2'>
                    <span className='text-blue-600 dark:text-blue-400 font-semibold'>
                      2.
                    </span>
                    <span>
                      If you&apos;re in the top 100, you&apos;ll be actively
                      monitored and appear on the chart
                    </span>
                  </div>
                  <div className='flex items-start gap-2'>
                    <span className='text-blue-600 dark:text-blue-400 font-semibold'>
                      3.
                    </span>
                    <span>
                      Your momentum score updates frequently, showing your
                      position and growth
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {showInfoModal && (
        <PulseInfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
      )}

      {showCalculationModal && calculationData && (
        <ScoreCalculationModal
          isOpen={showCalculationModal}
          onClose={() => setShowCalculationModal(false)}
          tiktokData={calculationData.tiktokData}
          scoreBreakdown={calculationData.scoreBreakdown}
        />
      )}
    </>
  );
}
