'use client';

import React from 'react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import Sidebar from '@/components/layout/Sidebar';

export default function ClassicGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UnifiedLayout sidebar={<Sidebar />}>{children}</UnifiedLayout>;
}
