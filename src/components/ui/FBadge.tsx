import React from 'react';
import FChip from './FChip';

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

const chipColorMap: Record<
  FBadgeColor,
  'default' | 'primary' | 'success' | 'warning' | 'danger'
> = {
  default: 'default',
  primary: 'primary',
  secondary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

const chipVariantMap: Record<FBadgeVariant, 'flat' | 'solid' | 'dot'> = {
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
    <FChip
      variant={chipVariantMap[variant]}
      color={chipColorMap[color]}
      size={size}
      className={className}
      startContent={startContent}
      endContent={endContent}
    >
      {children}
    </FChip>
  );
}
