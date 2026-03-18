'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { SSEEvent } from '@/lib/ai/sse-event-emitter';

interface DebugPanelProps {
  events: SSEEvent[];
  isLoading: boolean;
  userMessage?: string;
}

const EVENT_STYLES: Record<
  string,
  { bg: string; border: string; dot: string; label: string }
> = {
  connected: {
    bg: 'bg-gray-50 dark:bg-gray-800/60',
    border: 'border-gray-200 dark:border-gray-700',
    dot: 'bg-gray-400',
    label: 'Connected',
  },
  analyzing_intent: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    label: 'Analyzing Intent',
  },
  routing_decision: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
    label: 'Routing Decision',
  },
  llm_classifying: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    label: 'LLM Classifying',
  },
  agent_processing: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500',
    label: 'Agent Processing',
  },
  calling_tool: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
    label: 'Calling Tool',
  },
  tool_result: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    label: 'Tool Result',
  },
  processing_results: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    dot: 'bg-teal-500',
    label: 'Processing Results',
  },
  finalizing: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    dot: 'bg-cyan-500',
    label: 'Finalizing',
  },
  complete: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    label: 'Complete',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    label: 'Error',
  },
  heartbeat: {
    bg: 'bg-gray-50 dark:bg-gray-800/40',
    border: 'border-gray-100 dark:border-gray-800',
    dot: 'bg-gray-300',
    label: 'Heartbeat',
  },
};

function EventDetail({ event }: { event: SSEEvent }) {
  switch (event.type) {
    case 'routing_decision':
      return (
        <div className='mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[10px]'>
          <span className='text-gray-400'>Intent</span>
          <span className='font-mono font-semibold text-purple-600 dark:text-purple-400'>
            {event.intent ?? '—'}
          </span>
          <span className='text-gray-400'>Confidence</span>
          <span className='font-mono'>
            {event.confidence != null
              ? `${(event.confidence * 100).toFixed(0)}%`
              : '—'}
          </span>
          <span className='text-gray-400'>Method</span>
          <span
            className={`font-mono font-semibold ${event.method === 'keyword' ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}
          >
            {event.method ?? '—'} {event.method === 'keyword' ? '⚡' : '🤖'}
          </span>
          <span className='text-gray-400'>Agent</span>
          <span className='font-mono'>{event.agent ?? '—'}</span>
          {event.latency && (
            <>
              <span className='text-gray-400'>Latency</span>
              <span className='font-mono text-gray-500'>
                {event.latency.total}ms total
                {event.latency.keyword != null
                  ? ` · ${event.latency.keyword}ms kw`
                  : ''}
                {event.latency.llm != null
                  ? ` · ${event.latency.llm}ms llm`
                  : ''}
              </span>
            </>
          )}
        </div>
      );

    case 'calling_tool':
      return (
        <div className='mt-1.5 text-[10px] space-y-1'>
          <div className='flex items-center gap-2'>
            <span className='text-gray-400'>Tool</span>
            <span className='font-mono font-semibold text-orange-600 dark:text-orange-400'>
              {event.tool}
            </span>
          </div>
          {event.parameters && Object.keys(event.parameters).length > 0 && (
            <pre className='font-mono bg-gray-100 dark:bg-slate-800 rounded p-1.5 text-[9px] overflow-x-auto whitespace-pre-wrap'>
              {JSON.stringify(event.parameters, null, 2)}
            </pre>
          )}
        </div>
      );

    case 'tool_result':
      return (
        <div className='mt-1.5 flex items-center gap-3 text-[10px]'>
          <span className='text-gray-400'>Tool</span>
          <span className='font-mono'>{event.tool}</span>
          <span className='text-gray-400'>Found</span>
          <span className='font-mono font-semibold text-green-600 dark:text-green-400'>
            {event.resultCount ?? 0}
          </span>
        </div>
      );

    case 'agent_processing':
      return (
        <div className='mt-1 text-[10px] text-gray-400'>
          Agent:{' '}
          <span className='font-mono text-yellow-600 dark:text-yellow-400'>
            {event.agent}
          </span>
        </div>
      );

    case 'error':
      return (
        <div className='mt-1 text-[10px] text-red-600 dark:text-red-400 font-mono break-all'>
          {event.error?.code && (
            <span className='mr-1 opacity-60'>[{event.error.code}]</span>
          )}
          {event.error?.message ?? 'Unknown error'}
        </div>
      );

    default:
      return null;
  }
}

function CopyButton({
  value,
  label = 'Copy',
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
        copied
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
          : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
      }`}
    >
      {copied ? (
        <>
          <svg
            className='w-3 h-3'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 13l4 4L19 7'
            />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg
            className='w-3 h-3'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

/**
 * Build a human-readable, copy-pasteable trace string from SSE events.
 */
function buildTraceText(
  events: SSEEvent[],
  userMessage: string,
  elapsedMs: number
): string {
  const lines: string[] = [];

  const connectedEvent = events.find(e => e.type === 'connected');
  const traceId = connectedEvent?.traceId;
  const routingEvent = events.find(e => e.type === 'routing_decision');
  const toolCallEvents = events.filter(e => e.type === 'calling_tool');
  const toolResultEvents = events.filter(e => e.type === 'tool_result');
  const completeEvent = events.find(e => e.type === 'complete');
  const errorEvent = events.find(e => e.type === 'error');

  lines.push('=== FLEMOJI AI TRACE ===');
  if (traceId) {
    lines.push(`Trace ID : ${traceId}`);
    lines.push(`LangSmith: has(tags, "${traceId}")`);
  }
  lines.push(`Duration : ${elapsedMs}ms`);
  lines.push(`Time     : ${new Date().toISOString()}`);
  lines.push('');

  // User input
  lines.push('── USER INPUT ──────────────────────────────────────────');
  lines.push(userMessage ? `"${userMessage}"` : '(not captured)');
  lines.push('');

  // Routing decision
  lines.push('── ROUTING ─────────────────────────────────────────────');
  if (routingEvent) {
    const methodIcon = routingEvent.method === 'keyword' ? '⚡' : '🤖';
    lines.push(`Method     : ${routingEvent.method ?? '—'} ${methodIcon}`);
    lines.push(`Intent     : ${routingEvent.intent ?? '—'}`);
    lines.push(
      `Confidence : ${routingEvent.confidence != null ? `${(routingEvent.confidence * 100).toFixed(0)}%` : '—'}`
    );
    lines.push(`Agent      : ${routingEvent.agent ?? '—'}`);
    if (routingEvent.latency) {
      const lat = routingEvent.latency;
      const parts = [`${lat.total}ms total`];
      if (lat.keyword != null) parts.push(`${lat.keyword}ms keyword`);
      if (lat.llm != null) parts.push(`${lat.llm}ms llm`);
      lines.push(`Latency    : ${parts.join(' · ')}`);
    }
  } else {
    lines.push('(no routing event)');
  }
  lines.push('');

  // Tool calls paired with results
  lines.push('── TOOL CALLS ──────────────────────────────────────────');
  if (toolCallEvents.length === 0) {
    lines.push('(no tool calls — fast path)');
  } else {
    toolCallEvents.forEach((callEvent, idx) => {
      const resultEvent = toolResultEvents[idx];
      lines.push(`[${idx + 1}] ${callEvent.tool ?? 'unknown'}`);
      if (
        callEvent.parameters &&
        Object.keys(callEvent.parameters).length > 0
      ) {
        const paramLines = JSON.stringify(callEvent.parameters, null, 2).split(
          '\n'
        );
        paramLines.forEach(l => lines.push(`    ${l}`));
      }
      if (resultEvent != null) {
        lines.push(`    → ${resultEvent.resultCount ?? 0} result(s)`);
      } else {
        lines.push(`    → (no result event)`);
      }
      if (idx < toolCallEvents.length - 1) lines.push('');
    });
  }
  lines.push('');

  // AI response
  lines.push('── AI RESPONSE ─────────────────────────────────────────');
  if (completeEvent?.data) {
    const resp = completeEvent.data;
    const msg: string = resp.message ?? '';
    const dataType: string = resp.data?.type ?? '';
    const trackCount: number =
      resp.data?.data?.tracks?.length ?? resp.data?.data?.metadata?.total ?? 0;

    if (msg) {
      lines.push(`Message : "${msg}"`);
    }
    if (dataType) {
      lines.push(`Type    : ${dataType}`);
    }
    if (trackCount > 0) {
      lines.push(`Tracks  : ${trackCount}`);
    }
    if (!msg && !dataType) {
      lines.push(JSON.stringify(resp, null, 2));
    }
  } else if (errorEvent) {
    lines.push(
      `ERROR: [${errorEvent.error?.code ?? 'UNKNOWN'}] ${errorEvent.error?.message ?? 'Unknown error'}`
    );
  } else {
    lines.push('(still loading or no complete event)');
  }
  lines.push('');
  lines.push('════════════════════════════════════════════════════════');

  return lines.join('\n');
}

export function DebugPanel({
  events,
  isLoading,
  userMessage = '',
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'timeline' | 'summary' | 'trace'>('timeline');
  const bottomRef = useRef<HTMLDivElement>(null);

  const startTime =
    events.length > 0 ? new Date(events[0].timestamp).getTime() : null;
  const lastEvent = events[events.length - 1];
  const elapsedMs =
    startTime && lastEvent
      ? new Date(lastEvent.timestamp).getTime() - startTime
      : 0;

  const connectedEvent = events.find(e => e.type === 'connected');
  const traceId = connectedEvent?.traceId ?? null;

  const routingEvent = events.find(e => e.type === 'routing_decision');
  const toolCallEvents = events.filter(e => e.type === 'calling_tool');
  const toolResultEvents = events.filter(e => e.type === 'tool_result');
  const hasError = events.some(e => e.type === 'error');
  const isComplete = events.some(e => e.type === 'complete');

  // Dot colour for the toggle button
  const dotColor = isLoading
    ? 'bg-yellow-400 animate-pulse'
    : hasError
      ? 'bg-red-400'
      : isComplete
        ? 'bg-emerald-400'
        : 'bg-gray-500';

  // Auto-scroll timeline when new events arrive
  useEffect(() => {
    if (isOpen && tab === 'timeline') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, isOpen, tab]);

  const formatOffset = (event: SSEEvent) => {
    if (!startTime) return '+0ms';
    const ms = new Date(event.timestamp).getTime() - startTime;
    return `+${ms}ms`;
  };

  const fastPath =
    routingEvent?.method === 'keyword' && toolCallEvents.length === 0;

  const traceText = buildTraceText(events, userMessage, elapsedMs);

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className='fixed bottom-24 right-4 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium shadow-lg hover:bg-slate-800 transition-colors select-none'
        title='Toggle AI Debug Panel'
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        <span>Debug</span>
        {events.length > 0 && (
          <span className='bg-blue-500 text-[9px] rounded-full px-1 min-w-[14px] text-center leading-[14px]'>
            {events.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className='fixed bottom-36 right-4 z-50 w-96 max-h-[65vh] flex flex-col rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white flex-shrink-0'>
            <div className='flex items-center gap-2 min-w-0'>
              <span className='text-xs font-semibold flex-shrink-0'>
                AI Debug
              </span>
              {isLoading && (
                <span className='text-[10px] text-yellow-300 animate-pulse flex-shrink-0'>
                  ● live
                </span>
              )}
              {!isLoading && events.length > 0 && (
                <span className='text-[10px] text-gray-400 flex-shrink-0'>
                  {elapsedMs}ms
                </span>
              )}
              {traceId && (
                <div className='flex items-center gap-1 min-w-0'>
                  <span className='text-[9px] text-gray-500 font-mono truncate'>
                    {traceId.slice(-12)}
                  </span>
                  <CopyButton value={traceId} label='ID' />
                </div>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className='text-gray-400 hover:text-white text-xs leading-none px-1 flex-shrink-0 ml-1'
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className='flex border-b border-gray-200 dark:border-slate-700 flex-shrink-0'>
            {(['timeline', 'summary', 'trace'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-[11px] py-1.5 font-medium transition-colors capitalize ${
                  tab === t
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className='flex-1 overflow-y-auto'>
            {events.length === 0 ? (
              <div className='flex items-center justify-center h-20 text-xs text-gray-400'>
                Send a message to start tracing…
              </div>
            ) : tab === 'timeline' ? (
              <div className='p-2 space-y-1.5'>
                {events.map((event, i) => {
                  const style =
                    EVENT_STYLES[event.type] ?? EVENT_STYLES.connected;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg px-2.5 py-1.5 border ${style.bg} ${style.border}`}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-1.5 min-w-0'>
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`}
                          />
                          <span className='text-[10px] font-semibold text-gray-700 dark:text-gray-200 truncate'>
                            {style.label}
                          </span>
                        </div>
                        <span className='text-[9px] text-gray-400 font-mono flex-shrink-0'>
                          {formatOffset(event)}
                        </span>
                      </div>
                      <EventDetail event={event} />
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            ) : tab === 'summary' ? (
              /* Summary tab */
              <div className='p-3 space-y-3'>
                {/* LangSmith trace ID */}
                {traceId && (
                  <div className='rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 p-2.5'>
                    <div className='flex items-center justify-between mb-1.5'>
                      <span className='text-[9px] text-gray-400 uppercase tracking-wide font-medium'>
                        LangSmith Trace ID
                      </span>
                      <CopyButton value={traceId} label='Copy ID' />
                    </div>
                    <p className='font-mono text-[10px] text-gray-600 dark:text-gray-300 break-all leading-relaxed'>
                      {traceId}
                    </p>
                    <p className='text-[9px] text-gray-400 mt-1.5'>
                      Filter in LangSmith:{' '}
                      <span className='font-mono'>
                        has(tags, &quot;{traceId}&quot;)
                      </span>
                    </p>
                  </div>
                )}

                <div className='grid grid-cols-2 gap-2'>
                  {[
                    { label: 'Total Time', value: `${elapsedMs}ms` },
                    { label: 'Events', value: String(events.length) },
                    {
                      label: 'Routing',
                      value: routingEvent?.method ?? '—',
                      highlight: routingEvent?.method === 'keyword',
                      color: 'text-green-600 dark:text-green-400',
                    },
                    {
                      label: 'Confidence',
                      value:
                        routingEvent?.confidence != null
                          ? `${(routingEvent.confidence * 100).toFixed(0)}%`
                          : '—',
                    },
                    { label: 'Intent', value: routingEvent?.intent ?? '—' },
                    { label: 'Agent', value: routingEvent?.agent ?? '—' },
                    {
                      label: 'Tools Called',
                      value: String(toolCallEvents.length),
                    },
                    {
                      label: 'Fast Path',
                      value: fastPath ? 'Yes ⚡' : 'No',
                      highlight: fastPath,
                      color: 'text-green-600 dark:text-green-400',
                    },
                  ].map(({ label, value, highlight, color }) => (
                    <div
                      key={label}
                      className='bg-gray-50 dark:bg-slate-800 rounded-lg p-2'
                    >
                      <div className='text-[9px] text-gray-400 uppercase tracking-wide'>
                        {label}
                      </div>
                      <div
                        className={`text-xs font-semibold font-mono mt-0.5 truncate ${highlight && color ? color : 'text-gray-900 dark:text-gray-100'}`}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {toolCallEvents.length > 0 && (
                  <div>
                    <div className='text-[10px] text-gray-400 uppercase tracking-wide mb-1.5'>
                      Tool Calls
                    </div>
                    <div className='space-y-1'>
                      {toolCallEvents.map((e, i) => (
                        <div
                          key={i}
                          className='flex items-center gap-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg px-2 py-1.5 text-[10px]'
                        >
                          <span className='font-mono text-orange-600 dark:text-orange-400 flex-1 truncate'>
                            {e.tool}
                          </span>
                          {toolResultEvents[i] != null && (
                            <span className='text-green-600 dark:text-green-400 flex-shrink-0'>
                              → {toolResultEvents[i].resultCount ?? 0} results
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasError && (
                  <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 text-[10px] text-red-600 dark:text-red-400'>
                    {events.find(e => e.type === 'error')?.error?.message ??
                      'An error occurred'}
                  </div>
                )}
              </div>
            ) : (
              /* Trace tab — copy-pasteable full trace */
              <div className='flex flex-col h-full'>
                {/* Sticky copy button bar */}
                <div className='flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0'>
                  <span className='text-[10px] text-gray-400'>
                    Full trace — paste to Claude
                  </span>
                  <CopyButton value={traceText} label='Copy Trace' />
                </div>
                {/* Trace text */}
                <pre className='flex-1 overflow-auto p-3 text-[10px] font-mono text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words'>
                  {traceText}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
