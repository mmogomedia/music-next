'use client';

import React, { useRef } from 'react';
import { useSession } from 'next-auth/react';
import ChatNavigation from './ChatNavigation';
import AIChat, { AIChatHandle } from '@/components/ai/AIChat';

interface ChatLayoutProps {
  children?: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { data: session } = useSession();
  const chatRef = useRef<AIChatHandle>(null);

  const handleQuickLinkClick = (message: string) => {
    if (chatRef.current) {
      chatRef.current.setMessage(message);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex relative'>
      {/* Left Navigation */}
      <ChatNavigation onQuickLinkClick={handleQuickLinkClick} />

      {/* Main Content Area */}
      <div className='flex-1 ml-0 lg:ml-32'>
        {/* Mobile Header Spacing (for ChatNavigation mobile drawer) */}
        <div className='h-16 lg:hidden flex-shrink-0' />

        {/* Content - ChatTopBar will render inside AIChat component */}
        <main className='w-full min-h-screen pb-24 pt-0'>
          <div className='w-full pt-6'>
            {children || (
              <AIChat ref={chatRef} context={{ userId: session?.user?.id }} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
