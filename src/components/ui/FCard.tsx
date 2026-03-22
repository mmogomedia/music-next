import { Card, CardBody, type CardProps, cn } from '@heroui/react';

type FCardVariant = 'default' | 'elevated' | 'flat';
type FCardPadding = 'none' | 'sm' | 'md' | 'lg';

interface FCardProps extends Omit<CardProps, 'shadow'> {
  variant?: FCardVariant;
  padding?: FCardPadding;
  bodyClassName?: string;
}

const variantClasses: Record<FCardVariant, string> = {
  default:
    'border border-gray-200 dark:border-slate-700 shadow-none rounded-xl',
  elevated:
    'border border-gray-200 dark:border-slate-700 shadow-none hover:shadow-md transition-shadow duration-200 rounded-xl',
  flat: 'bg-gray-50 dark:bg-slate-800/50 border-0 shadow-none rounded-xl',
};

const paddingClasses: Record<FCardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function FCard({
  variant = 'default',
  padding = 'md',
  className,
  bodyClassName,
  children,
  ...cardProps
}: FCardProps) {
  return (
    <Card
      className={cn(variantClasses[variant], className)}
      shadow='none'
      {...cardProps}
    >
      <CardBody className={cn(paddingClasses[padding], bodyClassName)}>
        {children}
      </CardBody>
    </Card>
  );
}
