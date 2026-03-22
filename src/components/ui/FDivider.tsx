import { Divider, type DividerProps, cn } from '@heroui/react';

type FDividerSpacing = 'sm' | 'md' | 'lg';

interface FDividerProps {
  spacing?: FDividerSpacing;
  orientation?: DividerProps['orientation'];
  className?: string;
}

const spacingClasses: Record<FDividerSpacing, string> = {
  sm: 'my-3',
  md: 'my-4',
  lg: 'my-6',
};

export default function FDivider({
  spacing = 'md',
  orientation = 'horizontal',
  className,
}: FDividerProps) {
  return (
    <Divider
      orientation={orientation}
      className={cn(spacingClasses[spacing], className)}
    />
  );
}
