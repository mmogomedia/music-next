'use client';

import { Textarea, type TextAreaProps } from '@heroui/react';

type FTextareaProps = Omit<TextAreaProps, 'variant' | 'radius'>;

export default function FTextarea(props: FTextareaProps) {
  return <Textarea variant='bordered' radius='lg' {...props} />;
}
