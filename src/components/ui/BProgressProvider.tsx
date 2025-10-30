'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { BProgress } from '@bprogress/core';

export default function BProgressProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configure BProgress with custom settings
    BProgress.configure({
      minimum: 0.3,
      maximum: 1,
      easing: 'ease',
      speed: 500,
      trickle: true,
      trickleSpeed: 200,
      showSpinner: false,
      indeterminate: false,
      parent: 'body',
      direction: 'ltr',
    });

    // Start progress on route change
    BProgress.start();

    // Stop progress after a delay
    const timer = setTimeout(() => {
      BProgress.done();
    }, 800);

    return () => {
      clearTimeout(timer);
      BProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}
