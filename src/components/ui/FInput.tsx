'use client';

import { Input, type InputProps } from '@heroui/react';

type FInputProps = Omit<InputProps, 'variant' | 'radius'>;

export default function FInput(props: FInputProps) {
  return <Input variant='bordered' radius='lg' {...props} />;
}
