'use client';

import { Select, type SelectProps } from '@heroui/react';

type FSelectProps = Omit<SelectProps, 'variant' | 'radius'>;

export default function FSelect(props: FSelectProps) {
  return <Select variant='bordered' radius='lg' {...props} />;
}
