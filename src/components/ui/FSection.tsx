import React from 'react';
import { cn } from '@/lib/utils/cn';

type FMaxWidth = 'narrow' | 'default' | 'wide' | 'full';
type FSectionPadding = 'none' | 'sm' | 'md' | 'lg';

interface FSectionProps {
  maxWidth?: FMaxWidth;
  padding?: FSectionPadding;
  children: React.ReactNode;
  className?: string;
}

const maxWidthClasses: Record<FMaxWidth, string> = {
  narrow: 'max-w-3xl mx-auto',
  default: 'max-w-5xl mx-auto',
  wide: 'max-w-7xl mx-auto',
  full: 'w-full',
};

const paddingClasses: Record<FSectionPadding, string> = {
  none: '',
  sm: 'px-4 py-4',
  md: 'px-4 sm:px-5 lg:px-6 py-4',
  lg: 'px-4 sm:px-6 lg:px-8 py-8',
};

export default function FSection({
  maxWidth = 'default',
  padding = 'md',
  children,
  className,
}: FSectionProps) {
  return (
    <div
      className={cn(
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
