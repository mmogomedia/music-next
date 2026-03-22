'use client';

import { Avatar, type AvatarProps } from '@heroui/react';
import { cn } from '@/lib/utils/cn';

type FAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface FAvatarProps extends Omit<AvatarProps, 'size'> {
  size?: FAvatarSize;
}

const heroSizeMap: Record<FAvatarSize, AvatarProps['size']> = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg',
};

const overrideSizeClasses: Partial<Record<FAvatarSize, string>> = {
  xs: 'w-6 h-6 text-tiny',
  xl: 'w-20 h-20 text-xl',
};

export default function FAvatar({
  size = 'md',
  className,
  ...props
}: FAvatarProps) {
  return (
    <Avatar
      size={heroSizeMap[size]}
      className={cn(overrideSizeClasses[size], className)}
      {...props}
    />
  );
}
