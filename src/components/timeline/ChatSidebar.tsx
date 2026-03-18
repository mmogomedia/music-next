'use client';

import RecentConversations from '@/components/shared/RecentConversations';

interface ChatSidebarProps {
  onConversationSelect?: (_conversationId: string) => void;
  activeConversationId?: string | null;
  onConversationsUpdate?: () => void;
}

export default function ChatSidebar({
  onConversationSelect,
  activeConversationId,
  onConversationsUpdate,
}: ChatSidebarProps) {
  const handleNewChat = () => {
    onConversationSelect?.('new');
  };

  return (
    <div className='h-full flex flex-col overflow-hidden px-4 py-6'>
      <RecentConversations
        onConversationSelect={onConversationSelect}
        activeConversationId={activeConversationId}
        chatType='TIMELINE'
        onConversationsUpdate={onConversationsUpdate}
        showNewChatButton={true}
        onNewChat={handleNewChat}
        maxInitialConversations={3}
        showHeading={true}
      />
    </div>
  );
}
