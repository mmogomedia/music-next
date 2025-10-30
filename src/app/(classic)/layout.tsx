import React from 'react';
import AppLayout from '@/components/layout/AppLayout';

export default function ClassicGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
