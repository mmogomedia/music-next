# Phase 11: Premium Analytics

## 🎯 Objective

Implement advanced analytics features exclusively for premium users, including detailed performance metrics, audience insights, trend analysis, and predictive analytics to help artists and users make data-driven decisions.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, 7, 8, 9, & 10 completed successfully
- Subscription system functional
- Basic analytics system working
- Premium user access control implemented

## 🚀 Step-by-Step Implementation

### 1. Premium Analytics Dashboard

#### `src/app/(dashboard)/premium-analytics/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import PremiumAnalyticsDashboard from '@/components/analytics/PremiumAnalyticsDashboard'
import { subscriptionPlans } from '@/lib/stripe'

async function getPremiumAnalyticsData(userId: string) {
  // Check if user has premium access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPremium: true,
      role: true,
      subscription: {
        select: {
          status: true,
          stripePriceId: true,
        }
      }
    }
  })

  if (!user?.isPremium && user?.role !== 'ADMIN') {
    return null
  }

  // Get comprehensive analytics data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get user's tracks (if artist)
  const tracks = user.role === 'ARTIST' ? await prisma.track.findMany({
    where: { artistId: userId },
    include: {
      playEvents: {
        where: {
          timestamp: { gte: thirtyDaysAgo }
        },
        select: {
          timestamp: true,
          duration: true,
          completed: true,
          ipAddress: true,
          userAgent: true,
        }
      },
      _count: {
        select: {
          likes: true,
        }
      }
    }
  }) : []

  // Get audience demographics (if available)
  const audienceData = await prisma.playEvent.groupBy({
    by: ['ipAddress'],
    where: {
      track: { artistId: userId },
      timestamp: { gte: thirtyDaysAgo }
    },
    _count: {
      id: true
    }
  })

  // Get geographic data (simplified - in production, use IP geolocation service)
  const geographicData = audienceData.slice(0, 10).map((item, index) => ({
    location: `Location ${index + 1}`,
    plays: item._count.id,
    percentage: Math.round((item._count.id / audienceData.length) * 100)
  }))

  // Get device/browser data
  const deviceData = await prisma.playEvent.groupBy({
    by: ['userAgent'],
    where: {
      track: { artistId: userId },
      timestamp: { gte: thirtyDaysAgo }
    },
    _count: {
      id: true
    }
  })

  // Get time-based analytics
  const timeAnalytics = await prisma.playEvent.groupBy({
    by: ['timestamp'],
    where: {
      track: { artistId: userId },
      timestamp: { gte: thirtyDaysAgo }
    },
    _count: {
      id: true
    }
  })

  // Calculate advanced metrics
  const totalPlays = tracks.reduce((sum, track) => sum + track.playEvents.length, 0)
  const totalLikes = tracks.reduce((sum, track) => sum + track._count.likes, 0)
  const totalDuration = tracks.reduce((sum, track) =>
    sum + track.playEvents.reduce((trackSum, event) => trackSum + (event.duration || 0), 0), 0
  )
  const completionRate = totalPlays > 0
    ? (tracks.reduce((sum, track) =>
        sum + track.playEvents.filter(event => event.completed).length, 0) / totalPlays) * 100
    : 0

  // Get trending analysis
  const trendingTracks = tracks
    .sort((a, b) => b.playEvents.length - a.playEvents.length)
    .slice(0, 5)
    .map(track => ({
      id: track.id,
      title: track.title,
      plays: track.playEvents.length,
      likes: track._count.likes,
      completionRate: track.playEvents.length > 0
        ? (track.playEvents.filter(event => event.completed).length / track.playEvents.length) * 100
        : 0
    }))

  return {
    user,
    summary: {
      totalPlays,
      totalLikes,
      totalDuration,
      completionRate: Math.round(completionRate * 100) / 100,
      uniqueListeners: audienceData.length,
      totalTracks: tracks.length,
    },
    tracks,
    geographicData,
    deviceData: deviceData.slice(0, 5),
    timeAnalytics: timeAnalytics.map(item => ({
      date: item.timestamp,
      plays: item._count.id,
    })),
    trendingTracks,
    timeRange: {
      start: thirtyDaysAgo,
      end: new Date(),
      days: 30,
    }
  }
}

export default async function PremiumAnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const analyticsData = await getPremiumAnalyticsData(session.user.id)

  if (!analyticsData) {
    redirect('/pricing?feature=premium-analytics')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Premium Analytics
              </h1>
              <p className="mt-2 text-gray-600">
                Advanced insights and detailed metrics for premium users
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                Premium
              </span>
            </div>
          </div>
        </div>

        <PremiumAnalyticsDashboard data={analyticsData} />
      </div>
    </div>
  )
}
```

### 2. Premium Analytics Dashboard Component

#### `src/components/analytics/PremiumAnalyticsDashboard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TrendingUpIcon,
  UsersIcon,
  ClockIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { formatDuration } from '@/lib/utils'

interface PremiumAnalyticsData {
  user: any
  summary: {
    totalPlays: number
    totalLikes: number
    totalDuration: number
    completionRate: number
    uniqueListeners: number
    totalTracks: number
  }
  tracks: any[]
  geographicData: Array<{
    location: string
    plays: number
    percentage: number
  }>
  deviceData: Array<{
    userAgent: string
    _count: { id: number }
  }>
  timeAnalytics: Array<{
    date: string
    plays: number
  }>
  trendingTracks: Array<{
    id: string
    title: string
    plays: number
    likes: number
    completionRate: number
  }>
  timeRange: {
    start: Date
    end: Date
    days: number
  }
}

interface PremiumAnalyticsDashboardProps {
  data: PremiumAnalyticsData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function PremiumAnalyticsDashboard({ data }: PremiumAnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'plays' | 'likes' | 'duration'>('plays')

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ]

  const metricOptions = [
    { value: 'plays', label: 'Plays', icon: TrendingUpIcon },
    { value: 'likes', label: 'Likes', icon: UsersIcon },
    { value: 'duration', label: 'Duration', icon: ClockIcon },
  ]

  // Process device data for better display
  const processedDeviceData = data.deviceData.map(item => {
    const userAgent = item.userAgent || 'Unknown'
    let deviceType = 'Unknown'
    let browser = 'Unknown'

    if (userAgent.includes('Mobile')) deviceType = 'Mobile'
    else if (userAgent.includes('Tablet')) deviceType = 'Tablet'
    else if (userAgent.includes('Windows') || userAgent.includes('Mac')) deviceType = 'Desktop'

    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'

    return {
      deviceType,
      browser,
      plays: item._count.id
    }
  })

  // Group by device type
  const deviceTypeData = processedDeviceData.reduce((acc, item) => {
    acc[item.deviceType] = (acc[item.deviceType] || 0) + item.plays
    return acc
  }, {} as Record<string, number>)

  const deviceTypeChartData = Object.entries(deviceTypeData).map(([type, plays]) => ({
    type,
    plays
  }))

  // Group by browser
  const browserData = processedDeviceData.reduce((acc, item) => {
    acc[item.browser] = (acc[item.browser] || 0) + item.plays
    return acc
  }, {} as Record<string, number>)

  const browserChartData = Object.entries(browserData).map(([browser, plays]) => ({
    browser,
    plays
  }))

  return (
    <div className="space-y-8">
      {/* Advanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <TrendingUpIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Plays</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.totalPlays.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Listeners</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.uniqueListeners.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.completionRate}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Duration</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(data.summary.totalDuration)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Over Time</h3>
          <div className="flex space-x-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedTimeRange(option.value as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedTimeRange === option.value
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data.timeAnalytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="plays"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Geographic and Device Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <GlobeAltIcon className="w-5 h-5 mr-2" />
            Geographic Distribution
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.geographicData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="plays" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device Types */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <DevicePhoneMobileIcon className="w-5 h-5 mr-2" />
            Device Types
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceTypeChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ deviceType, percentage }) => `${deviceType} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="plays"
              >
                {deviceTypeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Browser Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Browser Usage</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={browserChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="browser" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="plays" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trending Tracks Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Tracks</h3>

        <div className="space-y-4">
          {data.trendingTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{track.title}</h4>
                  <p className="text-sm text-gray-500">{track.plays} plays</p>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">{track.likes}</p>
                  <p className="text-gray-500">Likes</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">{track.completionRate.toFixed(1)}%</p>
                  <p className="text-gray-500">Completion</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Performance Radar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Overview</h3>

        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={[
            {
              metric: 'Plays',
              value: Math.min((data.summary.totalPlays / 1000) * 100, 100),
              fullMark: 100,
            },
            {
              metric: 'Engagement',
              value: data.summary.completionRate,
              fullMark: 100,
            },
            {
              metric: 'Reach',
              value: Math.min((data.summary.uniqueListeners / 500) * 100, 100),
              fullMark: 100,
            },
            {
              metric: 'Likes',
              value: Math.min((data.summary.totalLikes / 100) * 100, 100),
              fullMark: 100,
            },
            {
              metric: 'Retention',
              value: data.summary.completionRate,
              fullMark: 100,
            },
          ]}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">AI-Powered Insights</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Performance Highlights</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your top track has {data.trendingTracks[0]?.plays || 0} plays</li>
              <li>• Overall completion rate is {data.summary.completionRate}%</li>
              <li>• {data.summary.uniqueListeners} unique listeners this period</li>
              <li>• Average engagement rate is strong</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Growth Opportunities</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Focus on mobile optimization ({(deviceTypeData.Mobile || 0) / data.summary.totalPlays * 100}% mobile users)</li>
              <li>• Consider promoting tracks with lower completion rates</li>
              <li>• Expand reach in top geographic locations</li>
              <li>• Leverage trending tracks for marketing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3. Advanced Analytics API Routes

#### `src/app/api/analytics/premium/[userId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can access this data
    if (params.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user has premium access
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        isPremium: true,
        role: true,
        subscription: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!user?.isPremium && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Premium access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const metric = searchParams.get('metric') || 'plays';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get advanced analytics data
    const analytics = await getAdvancedAnalytics(
      params.userId,
      startDate,
      metric
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching premium analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getAdvancedAnalytics(
  userId: string,
  startDate: Date,
  metric: string
) {
  // Get user's tracks
  const tracks = await prisma.track.findMany({
    where: { artistId: userId },
    include: {
      playEvents: {
        where: {
          timestamp: { gte: startDate },
        },
        select: {
          timestamp: true,
          duration: true,
          completed: true,
          ipAddress: true,
          userAgent: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });

  // Calculate advanced metrics
  const totalPlays = tracks.reduce(
    (sum, track) => sum + track.playEvents.length,
    0
  );
  const totalLikes = tracks.reduce((sum, track) => sum + track._count.likes, 0);
  const totalDuration = tracks.reduce(
    (sum, track) =>
      sum +
      track.playEvents.reduce(
        (trackSum, event) => trackSum + (event.duration || 0),
        0
      ),
    0
  );

  // Get time-based analytics with more granular data
  const hourlyData = await prisma.$queryRaw`
    SELECT 
      EXTRACT(HOUR FROM "timestamp") as hour,
      COUNT(*) as plays,
      AVG(duration) as avg_duration
    FROM play_events 
    WHERE "trackId" IN (
      SELECT id FROM tracks WHERE "artistId" = ${userId}
    ) 
      AND "timestamp" >= ${startDate}
    GROUP BY EXTRACT(HOUR FROM "timestamp")
    ORDER BY hour
  `;

  // Get weekly trends
  const weeklyData = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('week', "timestamp") as week,
      COUNT(*) as plays,
      COUNT(CASE WHEN completed = true THEN 1 END) as completed_plays
    FROM play_events 
    WHERE "trackId" IN (
      SELECT id FROM tracks WHERE "artistId" = ${userId}
    ) 
      AND "timestamp" >= ${startDate}
    GROUP BY DATE_TRUNC('week', "timestamp")
    ORDER BY week
  `;

  // Get audience insights
  const audienceInsights = await prisma.playEvent.groupBy({
    by: ['ipAddress'],
    where: {
      track: { artistId: userId },
      timestamp: { gte: startDate },
    },
    _count: {
      id: true,
    },
    _sum: {
      duration: true,
    },
  });

  // Calculate engagement metrics
  const engagementMetrics = {
    totalPlays,
    totalLikes,
    totalDuration,
    uniqueListeners: audienceInsights.length,
    completionRate:
      totalPlays > 0
        ? (tracks.reduce(
            (sum, track) =>
              sum + track.playEvents.filter(event => event.completed).length,
            0
          ) /
            totalPlays) *
          100
        : 0,
    avgPlayDuration: totalPlays > 0 ? totalDuration / totalPlays : 0,
    listenerRetention: calculateListenerRetention(audienceInsights),
  };

  // Get predictive analytics
  const predictions = await getPredictiveAnalytics(tracks, startDate);

  return {
    summary: engagementMetrics,
    timeAnalytics: {
      hourly: hourlyData,
      weekly: weeklyData,
    },
    audienceInsights,
    predictions,
    recommendations: generateRecommendations(engagementMetrics, tracks),
  };
}

function calculateListenerRetention(audienceInsights: any[]) {
  // Calculate listener retention based on repeat plays
  const repeatListeners = audienceInsights.filter(
    insight => insight._count.id > 1
  ).length;
  return audienceInsights.length > 0
    ? (repeatListeners / audienceInsights.length) * 100
    : 0;
}

async function getPredictiveAnalytics(tracks: any[], startDate: Date) {
  // Simple trend analysis - in production, use ML models
  const recentPlays = tracks.reduce(
    (sum, track) =>
      sum +
      track.playEvents.filter(
        event =>
          new Date(event.timestamp) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    0
  );

  const previousWeekPlays = tracks.reduce(
    (sum, track) =>
      sum +
      track.playEvents.filter(event => {
        const eventDate = new Date(event.timestamp);
        const weekAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
        return eventDate >= twoWeeksAgo && eventDate < weekAgo;
      }).length,
    0
  );

  const growthRate =
    previousWeekPlays > 0
      ? ((recentPlays - previousWeekPlays) / previousWeekPlays) * 100
      : 0;

  return {
    projectedPlays: Math.round(recentPlays * (1 + growthRate / 100)),
    growthRate: Math.round(growthRate * 100) / 100,
    trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
  };
}

function generateRecommendations(metrics: any, tracks: any[]) {
  const recommendations = [];

  if (metrics.completionRate < 70) {
    recommendations.push({
      type: 'warning',
      title: 'Low Completion Rate',
      message: 'Consider optimizing track intros and improving audio quality',
      priority: 'high',
    });
  }

  if (metrics.avgPlayDuration < 60) {
    recommendations.push({
      type: 'info',
      title: 'Short Play Duration',
      message: 'Focus on creating engaging content that keeps listeners hooked',
      priority: 'medium',
    });
  }

  if (tracks.length < 5) {
    recommendations.push({
      type: 'success',
      title: 'Content Expansion',
      message:
        'Adding more tracks can increase your overall reach and engagement',
      priority: 'low',
    });
  }

  return recommendations;
}
```

### 4. Premium Feature Access Control

#### `src/components/auth/PremiumGuard.tsx`

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import Link from 'next/link'
import {
  StarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

interface PremiumGuardProps {
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
}

export default function PremiumGuard({
  children,
  fallback,
  showUpgradePrompt = true
}: PremiumGuardProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <LockClosedIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Required
        </h2>
        <p className="text-gray-600 mb-6">
          Please sign in to access this feature.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  if (!session.user.isPremium) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showUpgradePrompt) {
      return (
        <div className="text-center py-12">
          <StarIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Premium Feature
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            This feature is exclusively available to premium subscribers.
            Upgrade your account to unlock advanced analytics and premium features.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              View Plans
            </Link>
            <Link
              href="/subscription"
              className="inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Manage Subscription
            </Link>
          </div>
        </div>
      )
    }

    return null
  }

  return <>{children}</>
}
```

### 5. Premium Analytics Hooks

#### `src/hooks/usePremiumAnalytics.ts`

```typescript
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface PremiumAnalyticsOptions {
  userId?: string;
  timeRange?: '7d' | '30d' | '90d';
  metric?: 'plays' | 'likes' | 'duration';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function usePremiumAnalytics(options: PremiumAnalyticsOptions = {}) {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    userId = session?.user?.id,
    timeRange = '30d',
    metric = 'plays',
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
  } = options;

  const fetchAnalytics = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/analytics/premium/${userId}?days=${timeRange}&metric=${metric}`
      );

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userId, timeRange, metric]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const refresh = () => {
    fetchAnalytics();
  };

  const exportData = async (format: 'csv' | 'json' = 'json') => {
    if (!data) return;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `premium-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert data to CSV format
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `premium-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return {
    data,
    loading,
    error,
    refresh,
    exportData,
  };
}

function convertToCSV(data: any): string {
  // Simple CSV conversion - in production, use a proper CSV library
  const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (
          typeof obj[key] === 'object' &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          Object.assign(acc, flattenObject(obj[key], pre + key));
        } else {
          acc[pre + key] = obj[key];
        }
        return acc;
      },
      {} as Record<string, any>
    );
  };

  const flattened = flattenObject(data);
  const headers = Object.keys(flattened);
  const values = Object.values(flattened);

  return [headers.join(','), values.join(',')].join('\n');
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Premium access control works** - Only premium users can access features
2. **Advanced analytics display** - Charts and metrics render correctly
3. **Data accuracy** - Analytics show correct information
4. **Performance acceptable** - Dashboard loads within reasonable time
5. **Export functionality** - Can export data in different formats
6. **Responsive design** - Works on all device sizes

### Test Commands:

```bash
# Test premium access control
# 1. Try accessing as non-premium user
# 2. Verify upgrade prompts display
# 3. Test with premium user access

# Test analytics functionality
# 1. Verify charts render correctly
# 2. Test data export features
# 3. Check real-time updates
```

## 🚨 Common Issues & Solutions

### Issue: Premium features not accessible

**Solution**: Check subscription status, verify premium flags, check access control logic

### Issue: Analytics data missing

**Solution**: Verify database queries, check user permissions, validate data relationships

### Issue: Charts not rendering

**Solution**: Check chart library installation, verify data format, check for JavaScript errors

### Issue: Performance issues

**Solution**: Implement data caching, optimize database queries, add loading states

## 📝 Notes

- Implement proper data caching for better performance
- Consider adding real-time analytics updates
- Implement data export limits for large datasets
- Add analytics data retention policies
- Consider implementing ML-powered insights

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 12: Admin Dashboard](./12-admin-dashboard.md)
