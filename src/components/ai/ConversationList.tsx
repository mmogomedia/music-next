'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  ChatBubbleLeftIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
}

interface ConversationListProps {
  onConversationSelect?: (_conversationId: string) => void;
  activeConversationId?: string;
}

export default function ConversationList({
  onConversationSelect,
  activeConversationId,
}: ConversationListProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [session]);

  const fetchConversations = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ai/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      logger.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (conversationId: string) => {
    // TODO: Implement deletion
    logger.log('Delete conversation:', conversationId);
  };

  const handleEditStart = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title || '');
  };

  const handleEditSave = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle }),
      });

      if (response.ok) {
        await fetchConversations();
        setEditingId(null);
        setEditTitle('');
      }
    } catch (error) {
      logger.error('Failed to update title:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return new Date(date).toLocaleDateString();
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className='flex justify-center py-4'>
        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-1'>
      {conversations.length === 0 ? (
        <div className='py-8 text-center'>
          <ChatBubbleLeftIcon className='w-8 h-8 mx-auto text-gray-400 mb-2' />
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            No conversations yet
          </p>
        </div>
      ) : (
        conversations.map(conversation => (
          <div
            key={conversation.id}
            className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
              activeConversationId === conversation.id
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            {editingId === conversation.id ? (
              <input
                type='text'
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleEditSave(conversation.id);
                  } else if (e.key === 'Escape') {
                    handleEditCancel();
                  }
                }}
                onBlur={() => handleEditSave(conversation.id)}
                className='flex-1 text-sm bg-white dark:bg-slate-700 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            ) : (
              <>
                <button
                  onClick={() => onConversationSelect?.(conversation.id)}
                  className='flex-1 text-left text-sm truncate'
                >
                  <div className='font-medium text-gray-900 dark:text-gray-100'>
                    {conversation.title || 'Untitled Conversation'}
                  </div>
                  <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                    <ClockIcon className='w-3 h-3' />
                    {formatDate(conversation.updatedAt)}
                  </div>
                </button>
                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <button
                    onClick={() => handleEditStart(conversation)}
                    className='p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded'
                    aria-label='Edit title'
                  >
                    <PencilIcon className='w-4 h-4 text-gray-500 dark:text-gray-400' />
                  </button>
                  <button
                    onClick={() => handleDelete(conversation.id)}
                    className='p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded'
                    aria-label='Delete conversation'
                  >
                    <TrashIcon className='w-4 h-4 text-red-500 dark:text-red-400' />
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
