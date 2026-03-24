'use client';

import { Button, type ButtonProps } from '@heroui/react';

/**
 * FButton — Flemoji button wrapper
 *
 * Visual hierarchy:
 *  primary        → purple solid   — THE main CTA on a section (1 per view max)
 *  secondary      → blue solid     — secondary CTA, balances purple with blue
 *  primary-outline → purple bordered — explicit purple outline when brand presence needed
 *  primary-ghost   → purple light  — explicit purple ghost (active nav, selected states)
 *  outline        → neutral gray bordered — management actions, form alternatives
 *  ghost          → neutral gray light   — utility actions (view all, cancel, back, nav links)
 *  danger         → rose solid     — destructive CTAs
 *  danger-ghost   → rose light     — inline destructive (remove, delete row)
 */
type FVariant =
  | 'primary'
  | 'secondary'
  | 'primary-outline'
  | 'primary-ghost'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'danger-ghost';

interface FButtonProps extends Omit<ButtonProps, 'color' | 'variant'> {
  variant?: FVariant;
}

const variantMap: Record<
  FVariant,
  { color: ButtonProps['color']; variant: ButtonProps['variant'] }
> = {
  // Brand — use sparingly
  primary: { color: 'primary', variant: 'solid' },
  secondary: { color: 'secondary', variant: 'solid' },
  'primary-outline': { color: 'primary', variant: 'bordered' },
  'primary-ghost': { color: 'primary', variant: 'light' },
  // Neutral — default for most utility/management actions
  outline: { color: 'default', variant: 'bordered' },
  ghost: { color: 'default', variant: 'light' },
  // Semantic
  danger: { color: 'danger', variant: 'solid' },
  'danger-ghost': { color: 'danger', variant: 'light' },
};

export default function FButton({
  variant = 'primary',
  ...props
}: FButtonProps) {
  const { color, variant: heroVariant } = variantMap[variant];
  return <Button color={color} variant={heroVariant} {...props} />;
}
