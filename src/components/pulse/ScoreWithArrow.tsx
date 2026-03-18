import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface ScoreWithArrowProps {
  value: number | null | undefined;
  delta: number | null | undefined;
  className?: string;
}

export default function ScoreWithArrow({
  value,
  delta,
  className = '',
}: ScoreWithArrowProps) {
  if (value == null) {
    return <span className={className}>—</span>;
  }

  const hasDelta = delta != null && delta !== 0;
  const isUp = hasDelta && delta! > 0;
  const isDown = hasDelta && delta! < 0;

  return (
    <div className='flex items-center gap-1.5'>
      <span className={className}>{value.toFixed(1)}</span>
      {hasDelta && (
        <span
          className={`flex-shrink-0 ${
            isUp
              ? 'text-green-600 dark:text-green-400'
              : isDown
                ? 'text-red-600 dark:text-red-400'
                : ''
          }`}
        >
          {isUp ? (
            <ArrowUpIcon className='w-3.5 h-3.5' />
          ) : isDown ? (
            <ArrowDownIcon className='w-3.5 h-3.5' />
          ) : null}
        </span>
      )}
    </div>
  );
}
