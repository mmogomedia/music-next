'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Chip, Progress } from '@heroui/react';
import {
  ChartBarIcon,
  TrophyIcon,
  TrendingUpIcon,
  StarIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

interface ArtistScore {
  artistId: string;
  artistName: string;
  overallScore: number;
  engagementScore: number;
  growthScore: number;
  qualityScore: number;
  potentialScore: number;
  rank: number;
  scoreCategory: string;
}

interface StrengthScoreBreakdown {
  engagement: {
    completionRate: number;
    replayRate: number;
    likeRate: number;
    saveRate: number;
    shareRate: number;
  };
  growth: {
    playVelocity: number;
    uniqueListenerGrowth: number;
    geographicExpansion: number;
    timeConsistency: number;
  };
  quality: {
    skipRate: number;
    retentionRate: number;
    crossPlatformScore: number;
    genreFit: number;
  };
  potential: {
    viralCoefficient: number;
    marketPosition: number;
    demographicAppeal: number;
  };
}

export default function StrengthScoringDashboard() {
  const [topArtists, setTopArtists] = useState<ArtistScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<
    '24h' | '7d' | '30d' | '3m' | '1y'
  >('7d');
  const [minScore, setMinScore] = useState(0);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [artistBreakdown, setArtistBreakdown] =
    useState<StrengthScoreBreakdown | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchTopArtists();
  }, [timeRange, minScore]);

  const fetchTopArtists = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/stats/artists/top?timeRange=${timeRange}&minScore=${minScore}&limit=50`
      );

      if (response.ok) {
        const data = await response.json();
        setTopArtists(data.data.artists);
      }
    } catch (error) {
      console.error('Error fetching top artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtistBreakdown = async (artistId: string) => {
    try {
      const response = await fetch(
        `/api/stats/artist/${artistId}/strength?timeRange=${timeRange}`
      );

      if (response.ok) {
        const data = await response.json();
        setArtistBreakdown(data.data.scores.breakdown);
      }
    } catch (error) {
      console.error('Error fetching artist breakdown:', error);
    }
  };

  const handleArtistSelect = (artistId: string) => {
    setSelectedArtist(artistId);
    fetchArtistBreakdown(artistId);
  };

  const handleBatchCalculate = async () => {
    try {
      setCalculating(true);
      const response = await fetch('/api/stats/batch-calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeRange }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Batch calculation started for ${timeRange}`);

        // Refresh data after a delay
        setTimeout(() => {
          fetchTopArtists();
        }, 5000);
      }
    } catch (error) {
      console.error('Error starting batch calculation:', error);
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'primary';
    if (score >= 70) return 'secondary';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Artist Strength Scoring
          </h2>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardBody className='p-6'>
                <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2'></div>
                <div className='h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/2'></div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          Artist Strength Scoring
        </h2>
        <div className='flex items-center gap-2'>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as any)}
            className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
          >
            <option value='24h'>Last 24 Hours</option>
            <option value='7d'>Last 7 Days</option>
            <option value='30d'>Last 30 Days</option>
            <option value='3m'>Last 3 Months</option>
            <option value='1y'>Last Year</option>
          </select>
          <input
            type='number'
            placeholder='Min Score'
            value={minScore}
            onChange={e => setMinScore(parseFloat(e.target.value) || 0)}
            className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-24'
          />
          <Button color='primary' onClick={fetchTopArtists} size='sm'>
            Refresh
          </Button>
          <Button
            color='secondary'
            onClick={handleBatchCalculate}
            loading={calculating}
            size='sm'
          >
            Recalculate All
          </Button>
        </div>
      </div>

      {/* Top Artists Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {topArtists.map((artist, index) => (
          <Card
            key={artist.artistId}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedArtist === artist.artistId ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleArtistSelect(artist.artistId)}
          >
            <CardBody className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index < 3
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                        : 'bg-gray-500'
                    }`}
                  >
                    {artist.rank}
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 dark:text-white'>
                      {artist.artistName}
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {artist.scoreCategory}
                    </p>
                  </div>
                </div>
                <Chip
                  color={getScoreColor(artist.overallScore)}
                  variant='flat'
                  size='sm'
                >
                  {artist.overallScore.toFixed(1)}
                </Chip>
              </div>

              {/* Score Breakdown */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Engagement
                  </span>
                  <span className='font-medium'>
                    {artist.engagementScore.toFixed(1)}
                  </span>
                </div>
                <Progress
                  value={artist.engagementScore}
                  color={getScoreColor(artist.engagementScore)}
                  size='sm'
                />

                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Growth
                  </span>
                  <span className='font-medium'>
                    {artist.growthScore.toFixed(1)}
                  </span>
                </div>
                <Progress
                  value={artist.growthScore}
                  color={getScoreColor(artist.growthScore)}
                  size='sm'
                />

                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Quality
                  </span>
                  <span className='font-medium'>
                    {artist.qualityScore.toFixed(1)}
                  </span>
                </div>
                <Progress
                  value={artist.qualityScore}
                  color={getScoreColor(artist.qualityScore)}
                  size='sm'
                />

                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Potential
                  </span>
                  <span className='font-medium'>
                    {artist.potentialScore.toFixed(1)}
                  </span>
                </div>
                <Progress
                  value={artist.potentialScore}
                  color={getScoreColor(artist.potentialScore)}
                  size='sm'
                />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Artist Breakdown Modal */}
      {selectedArtist && artistBreakdown && (
        <Card className='mt-6'>
          <CardBody className='p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                Detailed Breakdown
              </h3>
              <Button
                size='sm'
                variant='light'
                onClick={() => setSelectedArtist(null)}
              >
                Close
              </Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {/* Engagement Breakdown */}
              <div className='space-y-3'>
                <h4 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                  <StarIcon className='w-5 h-5 text-blue-500' />
                  Engagement
                </h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Completion Rate</span>
                    <span>
                      {artistBreakdown.engagement.completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Replay Rate</span>
                    <span>
                      {artistBreakdown.engagement.replayRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Like Rate</span>
                    <span>
                      {artistBreakdown.engagement.likeRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Save Rate</span>
                    <span>
                      {artistBreakdown.engagement.saveRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Share Rate</span>
                    <span>
                      {artistBreakdown.engagement.shareRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Growth Breakdown */}
              <div className='space-y-3'>
                <h4 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                  <TrendingUpIcon className='w-5 h-5 text-green-500' />
                  Growth
                </h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Play Velocity</span>
                    <span>
                      {formatNumber(artistBreakdown.growth.playVelocity)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Unique Listeners</span>
                    <span>
                      {artistBreakdown.growth.uniqueListenerGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Geographic Reach</span>
                    <span>{artistBreakdown.growth.geographicExpansion}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Consistency</span>
                    <span>
                      {artistBreakdown.growth.timeConsistency.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality Breakdown */}
              <div className='space-y-3'>
                <h4 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                  <ChartBarIcon className='w-5 h-5 text-purple-500' />
                  Quality
                </h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Skip Rate</span>
                    <span>{artistBreakdown.quality.skipRate.toFixed(1)}%</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Retention Rate</span>
                    <span>
                      {artistBreakdown.quality.retentionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Cross-Platform</span>
                    <span>
                      {artistBreakdown.quality.crossPlatformScore.toFixed(1)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Genre Fit</span>
                    <span>{artistBreakdown.quality.genreFit.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Potential Breakdown */}
              <div className='space-y-3'>
                <h4 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                  <RocketLaunchIcon className='w-5 h-5 text-orange-500' />
                  Potential
                </h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Viral Coefficient</span>
                    <span>
                      {artistBreakdown.potential.viralCoefficient.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Market Position</span>
                    <span>
                      {artistBreakdown.potential.marketPosition.toFixed(1)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Demographic Appeal</span>
                    <span>
                      {artistBreakdown.potential.demographicAppeal.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Empty State */}
      {topArtists.length === 0 && !loading && (
        <Card>
          <CardBody className='p-12 text-center'>
            <TrophyIcon className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No Artists Found
            </h3>
            <p className='text-gray-500 dark:text-gray-400 mb-4'>
              No artists meet the current criteria. Try adjusting the minimum
              score or time range.
            </p>
            <Button
              color='primary'
              onClick={() => {
                setMinScore(0);
                setTimeRange('7d');
              }}
            >
              Reset Filters
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
