'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useSession } from 'next-auth/react';
import ChatNavigation from './ChatNavigation';
import UnifiedLayout from './UnifiedLayout';
import AIChat, { AIChatHandle } from '@/components/ai/AIChat';

interface ChatLayoutProps {
  children?: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { data: session } = useSession();
  const chatRef = useRef<AIChatHandle>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >();

  useEffect(() => {
    return () => {
      // Component unmounting
    };
  }, []);

  // Track session changes
  useEffect(() => {
    // Session changed
  }, [session]);

  // Track conversation ID changes
  useEffect(() => {
    // activeConversationId changed
  }, [activeConversationId]);

  // Memoize context to prevent AIChat remounts
  const aiContext = useMemo(
    () => ({ userId: session?.user?.id }),
    [session?.user?.id]
  );

  const handleQuickLinkClick = useCallback((message: string) => {
    if (chatRef.current) {
      chatRef.current.setMessage(message);
    }
  }, []);

  const handleConversationSelect = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  const handleConversationIdChange = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  return (
    <UnifiedLayout
      sidebar={
        <ChatNavigation
          onQuickLinkClick={handleQuickLinkClick}
          onConversationSelect={handleConversationSelect}
          getConversationId={() => activeConversationId}
        />
      }
      contentClassName=''
      disableBottomPadding
    >
      {children || (
        <AIChat
          ref={chatRef}
          conversationId={activeConversationId}
          onConversationIdChange={handleConversationIdChange}
          context={aiContext}
        />
      )}
    </UnifiedLayout>
  );
}
