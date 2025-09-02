# Phase 8: Analytics System

## 🎯 Objective
Implement a comprehensive analytics system that provides detailed insights into music performance, user engagement, and platform usage with interactive charts, data visualization, and actionable insights.

## 📋 Prerequisites
- Phase 1, 2, 3, 4, 5, 6, & 7 completed successfully
- Artist dashboard functional
- Database with play events and analytics data
- Chart libraries installed

## 🚀 Step-by-Step Implementation

### 1. Analytics Dashboard Component

#### `src/components/dashboard/AnalyticsDashboard.tsx`
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
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { formatDuration } from '@/lib/utils'

interface AnalyticsData {
  summary: {
    totalPlays: number
    totalLikes: number
    totalDuration: number
    totalTracks: number
  }
  playsByDate: Array<{
    timestamp: string
    _count: {
      id: number
    }
  }>
  topTracks: Array<{
    id: string
    title: string
    plays: number
    likes: number
    duration: number
  }>
  tracks: any[]
}

interface AnalyticsDashboardProps {
  data: AnalyticsData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Process plays by date for chart
  const chartData = data.playsByDate.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    plays: item._count.id,
  }))

  // Process top tracks for chart
  const topTracksData = data.topTracks.map(track => ({
    name: track.title,
    plays: track.plays,
    likes: track.likes,
  }))

  // Calculate engagement rate
  const engagementRate = data.summary.totalPlays > 0 
    ? ((data.summary.totalLikes / data.summary.totalPlays) * 100).toFixed(1)
    : '0'

  // Calculate average play duration
  const avgPlayDuration = data.summary.totalPlays > 0
    ? Math.round(data.summary.totalDuration / data.summary.totalPlays)
    : 0

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
            <div className="p-3 rounded-lg bg-red-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.totalLikes.toLocaleString()}
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
            <div className="p-3 rounded-lg bg-green-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {engagementRate}%
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
            <div className="p-3 rounded-lg bg-purple-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Play Duration</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(avgPlayDuration)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Plays Over Time</h3>
          <div className="flex space-x-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="plays" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performing Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Tracks</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTracksData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="plays" fill="#3B82F6" />
              <Bar dataKey="likes" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Track Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topTracksData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="plays"
              >
                {topTracksData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Track Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Track Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Track
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plays
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topTracks.map((track, index) => {
                const engagement = track.plays > 0 ? ((track.likes / track.plays) * 100).toFixed(1) : '0'
                
                return (
                  <tr key={track.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{track.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{track.plays.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{track.likes.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDuration(track.duration)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{engagement}%</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Performance Highlights</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your top track has {data.topTracks[0]?.plays || 0} plays</li>
              <li>• Overall engagement rate is {engagementRate}%</li>
              <li>• Average play duration is {formatDuration(avgPlayDuration)}</li>
            </ul>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Growth Opportunities</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Consider promoting tracks with lower engagement</li>
              <li>• Focus on tracks with shorter play durations</li>
              <li>• Create more content to increase total plays</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. Advanced Analytics API Routes

#### `src/app/api/analytics/tracks/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const groupBy = searchParams.get('groupBy') || 'day'

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get track details
    const track = await prisma.track.findUnique({
      where: { id: params.id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      )
    }

    // Check if user owns the track or is admin
    if (track.artistId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get play events with time grouping
    let playsByTime: any[] = []
    
    if (groupBy === 'hour') {
      playsByTime = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', "timestamp") as time_group,
          COUNT(*) as plays,
          AVG(duration) as avg_duration,
          COUNT(CASE WHEN completed = true THEN 1 END) as completed_plays
        FROM play_events 
        WHERE "trackId" = ${params.id} 
          AND "timestamp" >= ${startDate}
        GROUP BY DATE_TRUNC('hour', "timestamp")
        ORDER BY time_group
      `
    } else if (groupBy === 'day') {
      playsByTime = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "timestamp") as time_group,
          COUNT(*) as plays,
          AVG(duration) as avg_duration,
          COUNT(CASE WHEN completed = true THEN 1 END) as completed_plays
        FROM play_events 
        WHERE "trackId" = ${params.id} 
          AND "timestamp" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "timestamp")
        ORDER BY time_group
      `
    } else if (groupBy === 'week') {
      playsByTime = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', "timestamp") as time_group,
          COUNT(*) as plays,
          AVG(duration) as avg_duration,
          COUNT(CASE WHEN completed = true THEN 1 END) as completed_plays
        FROM play_events 
        WHERE "trackId" = ${params.id} 
          AND "timestamp" >= ${startDate}
        GROUP BY DATE_TRUNC('week', "timestamp")
        ORDER BY time_group
      `
    }

    // Get geographic data (if available)
    const geographicData = await prisma.playEvent.groupBy({
      by: ['ipAddress'],
      where: {
        trackId: params.id,
        timestamp: { gte: startDate }
      },
      _count: {
        id: true
      }
    })

    // Get device/browser data
    const deviceData = await prisma.playEvent.groupBy({
      by: ['userAgent'],
      where: {
        trackId: params.id,
        timestamp: { gte: startDate }
      },
      _count: {
        id: true
      }
    })

    // Calculate summary statistics
    const totalPlays = playsByTime.reduce((sum, item) => sum + parseInt(item.plays), 0)
    const totalDuration = playsByTime.reduce((sum, item) => sum + (parseFloat(item.avg_duration) * parseInt(item.plays)), 0)
    const completionRate = totalPlays > 0 ? (playsByTime.reduce((sum, item) => sum + parseInt(item.completed_plays), 0) / totalPlays) * 100 : 0

    return NextResponse.json({
      track,
      summary: {
        totalPlays,
        totalDuration,
        completionRate: Math.round(completionRate * 100) / 100,
        avgDuration: totalPlays > 0 ? Math.round(totalDuration / totalPlays) : 0,
      },
      playsByTime: playsByTime.map(item => ({
        time: item.time_group,
        plays: parseInt(item.plays),
        avgDuration: Math.round(parseFloat(item.avg_duration)),
        completedPlays: parseInt(item.completed_plays),
      })),
      geographicData: geographicData.slice(0, 10), // Top 10 locations
      deviceData: deviceData.slice(0, 10), // Top 10 devices
    })
  } catch (error) {
    console.error('Error fetching track analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 3. Artist Analytics API Route

#### `src/app/api/analytics/artist/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only artists and admins can access artist analytics
    if (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const artistId = searchParams.get('artistId') || session.user.id

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get artist's tracks with play data
    const tracks = await prisma.track.findMany({
      where: { artistId },
      include: {
        playEvents: {
          where: {
            timestamp: { gte: startDate }
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
    })

    // Calculate overall statistics
    const totalPlays = tracks.reduce((sum, track) => sum + track.playEvents.length, 0)
    const totalLikes = tracks.reduce((sum, track) => sum + track._count.likes, 0)
    const totalDuration = tracks.reduce((sum, track) => 
      sum + track.playEvents.reduce((trackSum, event) => trackSum + (event.duration || 0), 0), 0
    )

    // Group plays by date
    const playsByDate = await prisma.playEvent.groupBy({
      by: ['timestamp'],
      where: {
        track: { artistId },
        timestamp: { gte: startDate }
      },
      _count: {
        id: true
      }
    })

    // Get top performing tracks
    const topTracks = tracks
      .sort((a, b) => b.playEvents.length - a.playEvents.length)
      .slice(0, 10)
      .map(track => ({
        id: track.id,
        title: track.title,
        plays: track.playEvents.length,
        likes: track._count.likes,
        duration: track.duration,
        playCount: track.playCount,
      }))

    // Get genre performance
    const genrePerformance = await prisma.track.groupBy({
      by: ['genre'],
      where: { artistId },
      _sum: {
        playCount: true,
        likeCount: true,
      },
      _count: {
        id: true
      }
    })

    // Get audience insights
    const audienceInsights = await prisma.playEvent.groupBy({
      by: ['ipAddress'],
      where: {
        track: { artistId },
        timestamp: { gte: startDate }
      },
      _count: {
        id: true
      }
    })

    // Calculate growth metrics
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days)
    
    const previousPeriodPlays = await prisma.playEvent.count({
      where: {
        track: { artistId },
        timestamp: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    })

    const growthRate = previousPeriodPlays > 0 
      ? ((totalPlays - previousPeriodPlays) / previousPeriodPlays) * 100
      : 0

    return NextResponse.json({
      summary: {
        totalPlays,
        totalLikes,
        totalDuration,
        totalTracks: tracks.length,
        growthRate: Math.round(growthRate * 100) / 100,
      },
      playsByDate: playsByDate.map(item => ({
        date: item.timestamp,
        plays: item._count.id,
      })),
      topTracks,
      genrePerformance: genrePerformance.map(item => ({
        genre: item.genre,
        tracks: item._count.id,
        totalPlays: item._sum.playCount || 0,
        totalLikes: item._sum.likeCount || 0,
      })),
      audienceInsights: {
        uniqueListeners: audienceInsights.length,
        topLocations: audienceInsights.slice(0, 10),
      },
      timeRange: {
        start: startDate,
        end: new Date(),
        days,
      }
    })
  } catch (error) {
    console.error('Error fetching artist analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 4. Real-time Analytics Updates

#### `src/components/analytics/RealTimeAnalytics.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayIcon, UsersIcon, TrendingUpIcon } from '@heroicons/react/24/outline'

interface RealTimeData {
  currentListeners: number
  recentPlays: Array<{
    trackTitle: string
    artistName: string
    timestamp: string
  }>
  trendingTracks: Array<{
    title: string
    plays: number
    change: number
  }>
}

export default function RealTimeAnalytics() {
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    currentListeners: 0,
    recentPlays: [],
    trendingTracks: []
  })
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Simulate real-time updates (replace with actual WebSocket connection)
    const interval = setInterval(() => {
      // Update current listeners (random simulation)
      setRealTimeData(prev => ({
        ...prev,
        currentListeners: Math.floor(Math.random() * 100) + 50,
      }))
    }, 5000)

    // Simulate new plays
    const playInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new play
        const newPlay = {
          trackTitle: 'Sample Track',
          artistName: 'Sample Artist',
          timestamp: new Date().toLocaleTimeString(),
        }
        
        setRealTimeData(prev => ({
          ...prev,
          recentPlays: [newPlay, ...prev.recentPlays.slice(0, 4)]
        }))
      }
    }, 3000)

    setIsConnected(true)

    return () => {
      clearInterval(interval)
      clearInterval(playInterval)
      setIsConnected(false)
    }
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Real-Time Activity</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-500">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Listeners */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-blue-50 rounded-lg"
        >
          <div className="flex items-center justify-center mb-2">
            <UsersIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {realTimeData.currentListeners}
          </div>
          <div className="text-sm text-blue-600">Currently Listening</div>
        </motion.div>

        {/* Recent Plays */}
        <div className="md:col-span-2">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Plays</h4>
          <div className="space-y-2">
            <AnimatePresence>
              {realTimeData.recentPlays.map((play, index) => (
                <motion.div
                  key={`${play.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-3 text-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-900 font-medium">{play.trackTitle}</span>
                  <span className="text-gray-500">by {play.artistName}</span>
                  <span className="text-gray-400">{play.timestamp}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {realTimeData.recentPlays.length === 0 && (
              <div className="text-gray-400 text-sm">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      {/* Trending Tracks */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Trending Now</h4>
        <div className="space-y-2">
          {realTimeData.trendingTracks.map((track, index) => (
            <motion.div
              key={track.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{track.title}</span>
                <span className="text-xs text-gray-500">{track.plays} plays</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUpIcon className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600">+{track.change}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 5. Analytics Export Functionality

#### `src/components/analytics/ExportAnalytics.tsx`
```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  DocumentArrowDownIcon, 
  TableCellsIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline'

interface ExportAnalyticsProps {
  data: any
  artistName: string
}

export default function ExportAnalytics({ data, artistName }: ExportAnalyticsProps) {
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv')

  const exportToCSV = (data: any, filename: string) => {
    const csvContent = convertToCSV(data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const convertToCSV = (data: any): string => {
    // Convert analytics data to CSV format
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Plays', data.summary?.totalPlays || 0],
      ['Total Likes', data.summary?.totalLikes || 0],
      ['Total Tracks', data.summary?.totalTracks || 0],
      ['Growth Rate', `${data.summary?.growthRate || 0}%`],
    ]

    if (data.topTracks) {
      rows.push(['', ''])
      rows.push(['Top Tracks', ''])
      data.topTracks.forEach((track: any, index: number) => {
        rows.push([`${index + 1}. ${track.title}`, `${track.plays} plays`])
      })
    }

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return csvContent
  }

  const handleExport = async () => {
    setExporting(true)
    
    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${artistName}_analytics_${timestamp}.${exportFormat}`

      if (exportFormat === 'csv') {
        exportToCSV(data, filename)
      } else if (exportFormat === 'json') {
        exportToJSON(data, filename)
      } else if (exportFormat === 'pdf') {
        // PDF export would require a library like jsPDF
        alert('PDF export coming soon!')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Analytics</h3>
      
      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="flex space-x-4">
            {[
              { value: 'csv', label: 'CSV', icon: TableCellsIcon, color: 'bg-green-500' },
              { value: 'json', label: 'JSON', icon: ChartBarIcon, color: 'bg-blue-500' },
              { value: 'pdf', label: 'PDF', icon: DocumentArrowDownIcon, color: 'bg-red-500' },
            ].map((format) => (
              <label key={format.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.value}
                  checked={exportFormat === format.value}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 ${
                  exportFormat === format.value ? format.color : 'border-gray-300'
                }`} />
                <span className="text-sm text-gray-700">{format.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <motion.button
          onClick={handleExport}
          disabled={exporting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>
            {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
          </span>
        </motion.button>

        {/* Export Info */}
        <div className="text-xs text-gray-500 text-center">
          {exportFormat === 'csv' && 'Best for spreadsheet analysis'}
          {exportFormat === 'json' && 'Best for data processing'}
          {exportFormat === 'pdf' && 'Best for reports and sharing'}
        </div>
      </div>
    </div>
  )
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:
1. **Analytics dashboard loads** - All charts and data display correctly
2. **Real-time updates work** - Live data updates function properly
3. **Export functionality** - Can export data in different formats
4. **Chart interactions** - Charts respond to user interactions
5. **Data accuracy** - Analytics show correct information
6. **Performance acceptable** - Dashboard loads within reasonable time

### Test Commands:
```bash
# Test analytics dashboard
# 1. Login as artist
# 2. Navigate to analytics page
# 3. Verify charts display correctly
# 4. Test export functionality

# Test real-time features
# 1. Check live listener count
# 2. Verify recent plays update
# 3. Test trending tracks display
```

## 🚨 Common Issues & Solutions

### Issue: Charts not rendering
**Solution**: Check chart library installation, verify data format, check for JavaScript errors

### Issue: Real-time updates not working
**Solution**: Verify WebSocket connection, check server-side event handling, validate data flow

### Issue: Export functionality failing
**Solution**: Check file permissions, verify data structure, test with smaller datasets

### Issue: Performance issues
**Solution**: Implement data pagination, optimize database queries, add caching layers

## 📝 Notes
- Consider implementing data caching for better performance
- Add error boundaries for chart rendering failures
- Implement progressive loading for large datasets
- Consider adding scheduled analytics reports
- Implement data retention policies for analytics data

## 🔗 Next Phase
Once this phase is complete and tested, proceed to [Phase 9: Smart Links System](./09-smart-links.md)
