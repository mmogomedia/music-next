'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
  Spinner,
} from '@heroui/react';
import {
  PlayIcon,
  ArrowPathIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  ArrowUpIcon,
} from '@heroicons/react/24/outline';

interface EligibilityRecalcLog {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed' | 'aborted';
  artistsProcessed: number;
  successCount: number;
  errorCount: number;
  totalDurationMs: number | null;
  errorMessage: string | null;
}

interface TierLastRun {
  tierCode: string;
  tierName: string;
  lastRun: {
    runAt: string;
    runType: string;
    entriesCount: number;
  } | null;
}

interface LeagueRunLog {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed' | 'aborted';
  tiersProcessed: number;
  tiersSkipped: number;
  tiersErrored: number;
  entriesCreated: number;
  totalDurationMs: number | null;
  errorMessage: string | null;
  promotionsProcessed?: boolean;
  avgTimePerTier?: number | null;
  successRate?: number | null;
  tierLastRuns?: TierLastRun[];
}

export default function PulseLogsAndRuns() {
  const [eligibilityLogs, setEligibilityLogs] = useState<
    EligibilityRecalcLog[]
  >([]);
  const [leagueLogs, setLeagueLogs] = useState<LeagueRunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLogs();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    setError(null);
    try {
      const [eligibilityRes, leagueRes] = await Promise.all([
        fetch('/api/admin/pulse/logs/eligibility'),
        fetch('/api/admin/pulse/logs/league'),
      ]);

      if (eligibilityRes.ok) {
        const data = await eligibilityRes.json();
        setEligibilityLogs(data.logs || []);
      } else {
        const errorData = await eligibilityRes.json().catch(() => ({}));
        console.error('Error fetching eligibility logs:', errorData);
        setError(
          `Failed to load eligibility logs: ${errorData.error || 'Unknown error'}`
        );
      }

      if (leagueRes.ok) {
        const data = await leagueRes.json();
        setLeagueLogs(data.logs || []);
      } else {
        const errorData = await leagueRes.json().catch(() => ({}));
        console.error('Error fetching league logs:', errorData);
        if (!error) {
          setError(
            `Failed to load league logs: ${errorData.error || 'Unknown error'}`
          );
        }
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      setError(`Error: ${error?.message || 'Failed to fetch logs'}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerRun = async (type: 'eligibility' | 'league', force = false) => {
    setTriggering(type);
    try {
      const endpoint =
        type === 'eligibility'
          ? '/api/pulse/eligibility/recalculate'
          : '/api/pulse/league/run';
      const url = force ? `${endpoint}?force=true` : endpoint;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh logs after a short delay
        setTimeout(fetchLogs, 2000);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to trigger run'}`);
      }
    } catch (error) {
      console.error('Error triggering run:', error);
      alert('Failed to trigger run');
    } finally {
      setTriggering(null);
    }
  };

  const getStatusColor = (
    status: 'running' | 'completed' | 'failed' | 'aborted'
  ): 'default' | 'success' | 'danger' | 'warning' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'aborted':
        return 'warning';
      case 'running':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Error Display */}
      {error && (
        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400'>
          {error}
        </div>
      )}

      {/* Action Buttons - Compact */}
      <div className='flex flex-wrap gap-2'>
        <Button
          size='sm'
          color='primary'
          startContent={<PlayIcon className='h-4 w-4' />}
          onPress={() => triggerRun('eligibility', false)}
          isLoading={triggering === 'eligibility'}
          className='text-xs'
        >
          Recalc
        </Button>
        <Button
          size='sm'
          variant='bordered'
          startContent={<ArrowPathIcon className='h-4 w-4' />}
          onPress={() => triggerRun('eligibility', true)}
          isLoading={triggering === 'eligibility'}
          className='text-xs'
        >
          Force Recalc
        </Button>
        <Button
          size='sm'
          color='secondary'
          startContent={<PlayIcon className='h-4 w-4' />}
          onPress={() => triggerRun('league', false)}
          isLoading={triggering === 'league'}
          className='text-xs'
        >
          League Run
        </Button>
        <Button
          size='sm'
          variant='bordered'
          startContent={<ArrowPathIcon className='h-4 w-4' />}
          onPress={() => triggerRun('league', true)}
          isLoading={triggering === 'league'}
          className='text-xs'
        >
          Force Run
        </Button>
      </div>

      {/* Eligibility Recalculation Logs - Compact */}
      <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden'>
        <div className='px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50'>
          <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
            Eligibility Recalculation Logs
          </h2>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
            {eligibilityLogs.length} log(s)
          </p>
        </div>
        <Table
          aria-label='Eligibility recalculation logs'
          removeWrapper
          classNames={{
            th: 'text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50',
            td: 'text-xs py-2',
          }}
        >
          <TableHeader>
            <TableColumn className='w-32'>Time</TableColumn>
            <TableColumn className='w-20'>Status</TableColumn>
            <TableColumn className='w-16'>Artists</TableColumn>
            <TableColumn className='w-16'>✓</TableColumn>
            <TableColumn className='w-16'>✗</TableColumn>
            <TableColumn className='w-20'>Duration</TableColumn>
            <TableColumn>Reason</TableColumn>
          </TableHeader>
          <TableBody emptyContent='No logs found'>
            {eligibilityLogs.map(log => (
              <TableRow
                key={log.id}
                className='hover:bg-gray-50 dark:hover:bg-slate-700/50'
              >
                <TableCell className='font-mono text-xs'>
                  {new Date(log.startedAt).toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  <Chip
                    size='sm'
                    color={getStatusColor(log.status)}
                    variant='flat'
                    className='text-xs'
                  >
                    {log.status}
                  </Chip>
                </TableCell>
                <TableCell className='font-medium'>
                  {log.artistsProcessed}
                </TableCell>
                <TableCell className='text-green-600 dark:text-green-400 font-medium'>
                  {log.successCount}
                </TableCell>
                <TableCell className='text-red-600 dark:text-red-400 font-medium'>
                  {log.errorCount}
                </TableCell>
                <TableCell className='text-gray-600 dark:text-gray-400'>
                  {formatDuration(log.totalDurationMs)}
                </TableCell>
                <TableCell className='text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate'>
                  {log.errorMessage || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* League Run Logs - Enhanced */}
      <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden'>
        <div className='px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50'>
          <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
            League Run Logs
          </h2>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
            {leagueLogs.length} log(s)
          </p>
        </div>
        <Table
          aria-label='League run logs'
          removeWrapper
          classNames={{
            th: 'text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50',
            td: 'text-xs py-2',
          }}
        >
          <TableHeader>
            <TableColumn className='w-8'> </TableColumn>
            <TableColumn className='w-40'>Started</TableColumn>
            <TableColumn className='w-20'>Status</TableColumn>
            <TableColumn className='w-16'>Tiers</TableColumn>
            <TableColumn className='w-16'>Skipped</TableColumn>
            <TableColumn className='w-16'>Errors</TableColumn>
            <TableColumn className='w-20'>Entries</TableColumn>
            <TableColumn className='w-24'>Duration</TableColumn>
            <TableColumn className='w-20'>Success</TableColumn>
            <TableColumn>Details</TableColumn>
          </TableHeader>
          <TableBody emptyContent='No logs found'>
            {leagueLogs.map(log => {
              const isExpanded = expandedLogs.has(log.id);
              const hasDetails =
                log.tierLastRuns ||
                log.promotionsProcessed !== undefined ||
                log.avgTimePerTier ||
                log.errorMessage;

              return (
                <>
                  <TableRow
                    key={log.id}
                    className='hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer'
                    onClick={() => hasDetails && toggleExpanded(log.id)}
                  >
                    <TableCell>
                      {hasDetails ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleExpanded(log.id);
                          }}
                          className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className='h-4 w-4' />
                          ) : (
                            <ChevronRightIcon className='h-4 w-4' />
                          )}
                        </button>
                      ) : (
                        <span className='w-4'></span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='font-mono text-xs'>
                          {new Date(log.startedAt).toLocaleString()}
                        </span>
                        <span className='text-[10px] text-gray-500 dark:text-gray-400'>
                          {formatRelativeTime(log.startedAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size='sm'
                        color={getStatusColor(log.status)}
                        variant='flat'
                        className='text-xs'
                      >
                        {log.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <span className='text-green-600 dark:text-green-400 font-medium'>
                          {log.tiersProcessed}
                        </span>
                        {log.tiersErrored > 0 && (
                          <span className='text-red-600 dark:text-red-400 text-[10px]'>
                            ({log.tiersErrored})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-yellow-600 dark:text-yellow-400 font-medium'>
                      {log.tiersSkipped}
                    </TableCell>
                    <TableCell className='text-red-600 dark:text-red-400 font-medium'>
                      {log.tiersErrored}
                    </TableCell>
                    <TableCell className='font-medium'>
                      {log.entriesCreated.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          {formatDuration(log.totalDurationMs)}
                        </span>
                        {log.avgTimePerTier && (
                          <span className='text-[10px] text-gray-500 dark:text-gray-400'>
                            ~{formatDuration(log.avgTimePerTier)}/tier
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.successRate !== null &&
                      log.successRate !== undefined ? (
                        <div className='flex items-center gap-1'>
                          <span
                            className={`font-medium ${
                              log.successRate >= 80
                                ? 'text-green-600 dark:text-green-400'
                                : log.successRate >= 50
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {log.successRate}%
                          </span>
                        </div>
                      ) : (
                        <span className='text-gray-400'>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2 flex-wrap'>
                        {log.promotionsProcessed && (
                          <Chip
                            size='sm'
                            color='success'
                            variant='flat'
                            startContent={<ArrowUpIcon className='h-3 w-3' />}
                            className='text-[10px]'
                          >
                            Promos
                          </Chip>
                        )}
                        {log.errorMessage && (
                          <Chip
                            size='sm'
                            color='danger'
                            variant='flat'
                            startContent={
                              <ExclamationTriangleIcon className='h-3 w-3' />
                            }
                            className='text-[10px]'
                          >
                            Error
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && hasDetails && (
                    <TableRow key={`${log.id}-expanded`}>
                      <TableCell
                        colSpan={10}
                        className='bg-gray-50 dark:bg-slate-900/30 p-4'
                      >
                        <div className='space-y-4'>
                          {/* Tier Last Run Information */}
                          {log.tierLastRuns && log.tierLastRuns.length > 0 && (
                            <div>
                              <h4 className='text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2'>
                                <TrophyIcon className='h-4 w-4' />
                                Tier Last Runs
                              </h4>
                              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                                {log.tierLastRuns.map(tier => (
                                  <div
                                    key={tier.tierCode}
                                    className='bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 p-2'
                                  >
                                    <div className='flex items-center justify-between mb-1'>
                                      <span className='text-xs font-medium text-gray-900 dark:text-white'>
                                        {tier.tierCode}
                                      </span>
                                      <span className='text-[10px] text-gray-500 dark:text-gray-400'>
                                        {tier.tierName}
                                      </span>
                                    </div>
                                    {tier.lastRun ? (
                                      <div className='space-y-1'>
                                        <div className='flex items-center gap-1 text-[10px]'>
                                          <ClockIcon className='h-3 w-3 text-gray-400' />
                                          <span className='text-gray-600 dark:text-gray-400'>
                                            {formatRelativeTime(
                                              tier.lastRun.runAt
                                            )}
                                          </span>
                                        </div>
                                        <div className='flex items-center justify-between text-[10px]'>
                                          <span className='text-gray-500 dark:text-gray-400'>
                                            {tier.lastRun.runType}
                                          </span>
                                          <span className='font-medium text-gray-700 dark:text-gray-300'>
                                            {tier.lastRun.entriesCount} entries
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className='text-[10px] text-gray-400 italic'>
                                        No runs yet
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Additional Stats */}
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                            {log.promotionsProcessed !== undefined && (
                              <div className='bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 p-2'>
                                <div className='text-[10px] text-gray-500 dark:text-gray-400 mb-1'>
                                  Promotions
                                </div>
                                <div className='flex items-center gap-1'>
                                  {log.promotionsProcessed ? (
                                    <>
                                      <CheckCircleIcon className='h-4 w-4 text-green-600' />
                                      <span className='text-xs font-medium text-green-600 dark:text-green-400'>
                                        Processed
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircleIcon className='h-4 w-4 text-gray-400' />
                                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Skipped
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {log.avgTimePerTier && (
                              <div className='bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 p-2'>
                                <div className='text-[10px] text-gray-500 dark:text-gray-400 mb-1'>
                                  Avg Time/Tier
                                </div>
                                <div className='text-xs font-medium text-gray-900 dark:text-white'>
                                  {formatDuration(log.avgTimePerTier)}
                                </div>
                              </div>
                            )}

                            {log.successRate !== null &&
                              log.successRate !== undefined && (
                                <div className='bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 p-2'>
                                  <div className='text-[10px] text-gray-500 dark:text-gray-400 mb-1'>
                                    Success Rate
                                  </div>
                                  <div
                                    className={`text-xs font-medium ${
                                      log.successRate >= 80
                                        ? 'text-green-600 dark:text-green-400'
                                        : log.successRate >= 50
                                          ? 'text-yellow-600 dark:text-yellow-400'
                                          : 'text-red-600 dark:text-red-400'
                                    }`}
                                  >
                                    {log.successRate}%
                                  </div>
                                </div>
                              )}

                            {log.completedAt && (
                              <div className='bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 p-2'>
                                <div className='text-[10px] text-gray-500 dark:text-gray-400 mb-1'>
                                  Completed
                                </div>
                                <div className='text-xs font-medium text-gray-900 dark:text-white'>
                                  {new Date(
                                    log.completedAt
                                  ).toLocaleTimeString()}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Error Message */}
                          {log.errorMessage && (
                            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2'>
                              <div className='flex items-start gap-2'>
                                <ExclamationTriangleIcon className='h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5' />
                                <div>
                                  <div className='text-xs font-semibold text-red-700 dark:text-red-300 mb-1'>
                                    Error Details
                                  </div>
                                  <div className='text-xs text-red-600 dark:text-red-400'>
                                    {log.errorMessage}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
