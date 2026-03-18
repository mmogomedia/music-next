import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import type { StatusChange } from './utils';

interface StatusIconProps {
  statusChange: StatusChange;
}

export default function StatusIcon({ statusChange }: StatusIconProps) {
  switch (statusChange) {
    case 'UP':
    case 'PROMOTED':
      return <ArrowUpIcon className='w-4 h-4 text-green-500' />;
    case 'DOWN':
    case 'DEMOTED':
      return <ArrowDownIcon className='w-4 h-4 text-red-500' />;
    case 'UNCHANGED':
      return <MinusIcon className='w-4 h-4 text-gray-400' />;
    case 'NEW':
      return <SparklesIcon className='w-4 h-4 text-blue-500' />;
    default:
      return null;
  }
}
