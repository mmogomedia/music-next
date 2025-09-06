# Phase 13: Content Moderation

## 🎯 Objective

Implement a comprehensive content moderation system that allows users to report inappropriate content, provides admin tools for reviewing and managing reported content, and includes automated moderation features to maintain platform safety and compliance.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, & 12 completed successfully
- Admin dashboard functional
- User management system working
- Database with report and moderation models available

## 🚀 Step-by-Step Implementation

### 1. Content Moderation Dashboard

#### `src/app/(dashboard)/admin/moderation/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import ModerationDashboard from '@/components/moderation/ModerationDashboard'

async function getModerationData() {
  // Get pending reports
  const pendingReports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: {
        select: {
          name: true,
          email: true,
        }
      },
      reportedUser: {
        select: {
          name: true,
          email: true,
        }
      },
      track: {
        select: {
          title: true,
          artist: {
            select: {
              name: true,
            }
          }
        }
      }
    }
  })

  // Get resolved reports (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const resolvedReports = await prisma.report.findMany({
    where: {
      status: { in: ['RESOLVED', 'REJECTED'] },
      updatedAt: { gte: thirtyDaysAgo }
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      reporter: {
        select: {
          name: true,
        }
      },
      reportedUser: {
        select: {
          name: true,
        }
      }
    }
  })

  // Get moderation statistics
  const totalReports = await prisma.report.count()
  const pendingCount = await prisma.report.count({ where: { status: 'PENDING' } })
  const resolvedCount = await prisma.report.count({ where: { status: 'RESOLVED' } })
  const rejectedCount = await prisma.report.count({ where: { status: 'REJECTED' } })

  // Get reports by type
  const reportsByType = await prisma.report.groupBy({
    by: ['reason'],
    _count: {
      id: true
    }
  })

  // Get reports by status
  const reportsByStatus = await prisma.report.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  })

  return {
    pendingReports,
    resolvedReports,
    stats: {
      total: totalReports,
      pending: pendingCount,
      resolved: resolvedCount,
      rejected: rejectedCount,
    },
    reportsByType,
    reportsByStatus,
  }
}

export default async function ModerationPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const moderationData = await getModerationData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Content Moderation
          </h1>
          <p className="mt-2 text-gray-600">
            Review and manage reported content, users, and platform violations
          </p>
        </div>

        <ModerationDashboard data={moderationData} />
      </div>
    </div>
  )
}
```

### 2. Moderation Dashboard Component

#### `src/components/moderation/ModerationDashboard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline'
import ReportList from './ReportList'
import ModerationStats from './ModerationStats'

interface ModerationData {
  pendingReports: any[]
  resolvedReports: any[]
  stats: {
    total: number
    pending: number
    resolved: number
    rejected: number
  }
  reportsByType: Array<{
    reason: string
    _count: { id: number }
  }>
  reportsByStatus: Array<{
    status: string
    _count: { id: number }
  }>
}

interface ModerationDashboardProps {
  data: ModerationData
}

export default function ModerationDashboard({ data }: ModerationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'stats'>('pending')

  const tabs = [
    { id: 'pending', name: 'Pending Reports', count: data.stats.pending },
    { id: 'resolved', name: 'Resolved Reports', count: data.stats.resolved + data.stats.rejected },
    { id: 'stats', name: 'Statistics', count: null },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reports</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.stats.pending}
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
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.stats.resolved}
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
            <div className="p-3 rounded-lg bg-red-500">
              <XCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.stats.rejected}
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
            <div className="p-3 rounded-lg bg-blue-500">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.stats.total}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                {tab.count !== null && (
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pending' && (
            <ReportList
              reports={data.pendingReports}
              status="pending"
            />
          )}

          {activeTab === 'resolved' && (
            <ReportList
              reports={data.resolvedReports}
              status="resolved"
            />
          )}

          {activeTab === 'stats' && (
            <ModerationStats
              reportsByType={data.reportsByType}
              reportsByStatus={data.reportsByStatus}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

### 3. Report List Component

#### `src/components/moderation/ReportList.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  MusicalNoteIcon,
  FlagIcon
} from '@heroicons/react/24/outline'

interface Report {
  id: string
  reason: string
  description: string
  status: string
  createdAt: string
  reporter: {
    name: string
    email: string
  }
  reportedUser?: {
    name: string
    email: string
  }
  track?: {
    title: string
    artist: {
      name: string
    }
  }
}

interface ReportListProps {
  reports: Report[]
  status: 'pending' | 'resolved'
}

export default function ReportList({ reports, status }: ReportListProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleResolve = async (reportId: string, action: 'resolve' | 'reject') => {
    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          status: action === 'resolve' ? 'RESOLVED' : 'REJECTED',
        }),
      })

      if (response.ok) {
        router.refresh()
        setSelectedReport(null)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to process report')
      }
    } catch (error) {
      console.error('Error processing report:', error)
      alert('An error occurred while processing the report')
    } finally {
      setIsProcessing(false)
    }
  }

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'COPYRIGHT_VIOLATION':
        return 'bg-red-100 text-red-800'
      case 'INAPPROPRIATE_CONTENT':
        return 'bg-orange-100 text-orange-800'
      case 'SPAM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HARASSMENT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FlagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No {status} reports
        </h3>
        <p className="text-gray-500">
          {status === 'pending'
            ? 'All reports have been processed.'
            : 'No reports have been resolved yet.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <motion.div
          key={report.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => setSelectedReport(report)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {report.track ? (
                  <MusicalNoteIcon className="w-6 h-6 text-blue-500" />
                ) : (
                  <UserIcon className="w-6 h-6 text-red-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReasonColor(report.reason)}`}>
                    {report.reason.replace('_', ' ')}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>

                <p className="text-sm font-medium text-gray-900 truncate">
                  {report.track ? `Track: ${report.track.title}` : `User: ${report.reportedUser?.name}`}
                </p>

                <p className="text-sm text-gray-500">
                  Reported by {report.reporter.name} • {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedReport(report)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Report Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Report Details
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Report Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Report Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reason:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReasonColor(selectedReport.reason)}`}>
                        {selectedReport.reason.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reported:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedReport.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reporter Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reporter</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900">{selectedReport.reporter.name}</p>
                    <p className="text-sm text-gray-600">{selectedReport.reporter.email}</p>
                  </div>
                </div>

                {/* Reported Content */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reported Content</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedReport.track ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Track: {selectedReport.track.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          Artist: {selectedReport.track.artist.name}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          User: {selectedReport.reportedUser?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedReport.reportedUser?.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{selectedReport.description}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedReport.status === 'PENDING' && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      disabled={isProcessing}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => handleResolve(selectedReport.id, 'reject')}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Reject Report'}
                    </button>

                    <button
                      onClick={() => handleResolve(selectedReport.id, 'resolve')}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Resolve Report'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### 4. Report API Routes

#### `src/app/api/reports/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason, description, reportedUserId, trackId } = body;

    if (!reason || !description) {
      return NextResponse.json(
        { error: 'Reason and description are required' },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = [
      'COPYRIGHT_VIOLATION',
      'INAPPROPRIATE_CONTENT',
      'SPAM',
      'HARASSMENT',
      'OTHER',
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    // Prevent self-reporting
    if (reportedUserId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot report yourself' },
        { status: 400 }
      );
    }

    // Check if user has already reported this content
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        reportedUserId: reportedUserId || null,
        trackId: trackId || null,
        status: 'PENDING',
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reason,
        description,
        reporterId: session.user.id,
        reportedUserId,
        trackId,
        status: 'PENDING',
      },
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            name: true,
            email: true,
          },
        },
        track: {
          select: {
            title: true,
            artist: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Report submitted successfully',
        report,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Only admins can view all reports
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            name: true,
            email: true,
          },
        },
        track: {
          select: {
            title: true,
            artist: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.report.count({ where });

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5. Admin Report Management API

#### `src/app/api/admin/reports/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, status, adminNotes } = body;

    if (!action || !status) {
      return NextResponse.json(
        { error: 'Action and status are required' },
        { status: 400 }
      );
    }

    // Get the report
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        reportedUser: true,
        track: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id: params.id },
      data: {
        status: status.toUpperCase(),
        adminNotes,
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      },
    });

    // Take action based on the report
    if (action === 'resolve') {
      if (report.trackId) {
        // Remove track if it's a track report
        await prisma.track.update({
          where: { id: report.trackId },
          data: { isPublished: false },
        });
      } else if (report.reportedUserId) {
        // Suspend user if it's a user report
        await prisma.user.update({
          where: { id: report.reportedUserId },
          data: { isSuspended: true },
        });
      }
    }

    // Log the moderation action
    await prisma.moderationLog.create({
      data: {
        action: action.toUpperCase(),
        reportId: params.id,
        adminId: session.user.id,
        targetType: report.trackId ? 'TRACK' : 'USER',
        targetId: report.trackId || report.reportedUserId,
        notes: adminNotes,
      },
    });

    return NextResponse.json({
      message: 'Report processed successfully',
      report: updatedReport,
    });
  } catch (error) {
    console.error('Error processing report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            name: true,
            email: true,
          },
        },
        track: {
          select: {
            title: true,
            artist: {
              select: {
                name: true,
              },
            },
          },
        },
        moderationLogs: {
          include: {
            admin: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Report creation works** - Users can submit reports successfully
2. **Admin review functional** - Admins can view and process reports
3. **Content moderation works** - Reports trigger appropriate actions
4. **Status tracking** - Report status updates correctly
5. **Access control** - Only admins can access moderation tools
6. **Audit logging** - Moderation actions are logged properly

### Test Commands:

```bash
# Test report submission
# 1. Submit reports as different users
# 2. Verify report data is stored correctly
# 3. Test duplicate report prevention

# Test admin moderation
# 1. Login as admin
# 2. Review and process reports
# 3. Verify content actions are taken
# 4. Check audit logs
```

## 🚨 Common Issues & Solutions

### Issue: Reports not submitting

**Solution**: Check form validation, verify database schema, check user permissions

### Issue: Admin access not working

**Solution**: Verify admin role, check session data, validate route protection

### Issue: Content actions not triggering

**Solution**: Check action logic, verify database updates, validate target content

### Issue: Audit logging failing

**Solution**: Check moderation log schema, verify admin user data, validate log creation

## 📝 Notes

- Implement automated content filtering for common violations
- Add report analytics and trend analysis
- Consider implementing appeal process for rejected reports
- Add bulk moderation actions for efficiency
- Implement content warning system for borderline cases

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 14: Testing & QA](./14-testing-qa.md)
