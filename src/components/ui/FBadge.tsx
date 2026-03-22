'use client';

import React from 'react';
import { Chip, type ChipProps } from '@heroui/react';

type FBadgeVariant = 'status' | 'category' | 'count' | 'label';
type FBadgeColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';

interface FBadgeProps {
  variant?: FBadgeVariant;
  color?: FBadgeColor;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

const variantMap: Record<FBadgeVariant, ChipProps['variant']> = {
  status: 'dot',
  category: 'flat',
  count: 'solid',
  label: 'flat',
};

export default function FBadge({
  variant = 'label',
  color = 'default',
  size = 'sm',
  children,
  className,
  startContent,
  endContent,
}: FBadgeProps) {
  return (
    <Chip
      variant={variantMap[variant]}
      color={color}
      size={size}
      className={className}
      startContent={startContent}
      endContent={endContent}
    >
      {children}
    </Chip>
  );
}
