import { Spinner, type SpinnerProps } from '@heroui/react';

interface FSpinnerProps {
  size?: SpinnerProps['size'];
  label?: string;
  fullScreen?: boolean;
}

export default function FSpinner({
  size = 'md',
  label,
  fullScreen = false,
}: FSpinnerProps) {
  const spinner = (
    <div className='flex flex-col items-center gap-2'>
      <Spinner size={size} color='primary' />
      {label && (
        <p className='text-sm text-gray-500 dark:text-gray-400'>{label}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        {spinner}
      </div>
    );
  }

  return spinner;
}
