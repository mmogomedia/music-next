import React from 'react';
import ChatLayout from '@/components/layout/ChatLayout';

export default function ChatGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatLayout>{children}</ChatLayout>;
}
