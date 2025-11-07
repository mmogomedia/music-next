'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  ChatBubbleLeftIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import SignInModal from '@/components/auth/SignInModal';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
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
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
  }, [session?.user?.id]);

  useEffect(() => {
    // Only fetch when authenticated and session is available
    if (status === 'authenticated' && session?.user?.id) {
      fetchConversations();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setConversations([]);
    }
  }, [status, session?.user?.id, fetchConversations]);

  const handleDeleteClick = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/ai/conversations/${conversationToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh conversations list
        await fetchConversations();
        setDeleteModalOpen(false);
        setConversationToDelete(null);
      } else {
        const error = await response.json();
        logger.error('Failed to delete conversation:', error);
        setDeleteError('Failed to delete conversation. Please try again.');
      }
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      setDeleteError('An error occurred while deleting the conversation.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setConversationToDelete(null);
    setDeleteError(null);
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

  if (status === 'loading' || loading) {
    return (
      <div className='flex justify-center py-4'>
        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  const displayConversations = showAll
    ? conversations
    : conversations.slice(0, 3);
  const hasMore = conversations.length > 3;

  return (
    <div className='flex-1 flex flex-col min-h-0'>
      {status !== 'authenticated' || !session ? (
        <div className='py-6 px-3 text-center'>
          <LockClosedIcon className='w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2' />
          <p className='text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5'>
            Sign in to view conversations
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
            Your conversation history will appear here once you&apos;re signed
            in.
          </p>
          <button
            onClick={() => setIsSignInModalOpen(true)}
            className='inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors duration-200'
          >
            Sign In
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className='py-8 text-center'>
          <ChatBubbleLeftIcon className='w-8 h-8 mx-auto text-gray-400 mb-2' />
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            No conversations yet
          </p>
        </div>
      ) : (
        <div className='flex-1 flex flex-col min-h-0'>
          {/* Scrollable conversations list */}
          <div className='flex-1 overflow-y-auto min-h-0 space-y-1'>
            {displayConversations.map(conversation => (
            <div
              key={conversation.id}
              className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                activeConversationId === conversation.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
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
                  className='flex-1 text-xs bg-white dark:bg-slate-700 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              ) : (
                <>
                  <button
                    onClick={() => {
                      onConversationSelect?.(conversation.id);
                    }}
                    className='flex-1 text-left min-w-0'
                  >
                    <div className='font-medium text-gray-900 dark:text-gray-100 text-sm truncate mb-0.5'>
                      {conversation.title || 'Untitled Conversation'}
                    </div>
                    <div className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400'>
                      <ClockIcon className='w-3 h-3 flex-shrink-0' />
                      <span>{formatDate(conversation.updatedAt)}</span>
                    </div>
                  </button>
                  <div className='flex-shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity'>
                    <Dropdown placement='bottom-end'>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          variant='light'
                          size='sm'
                          className='min-w-0 w-7 h-7 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          aria-label='Conversation options'
                        >
                          <EllipsisHorizontalIcon className='w-5 h-5' />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label='Conversation actions' variant='flat'>
                        <DropdownItem
                          key='edit'
                          startContent={<PencilIcon className='w-3.5 h-3.5' />}
                          onPress={() => handleEditStart(conversation)}
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          key='delete'
                          color='danger'
                          startContent={<TrashIcon className='w-3.5 h-3.5' />}
                          onPress={() => handleDeleteClick(conversation.id)}
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </>
              )}
            </div>
          ))}
          </div>
          
          {/* Load More button - always visible at bottom when there are more conversations */}
          {hasMore && !showAll && (
            <div className='flex-shrink-0 pt-2 border-t border-gray-200 dark:border-slate-700 mt-2'>
              <button
                onClick={() => setShowAll(true)}
                className='w-full px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200 text-center'
              >
                Load More ({conversations.length - 3} more)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        size='md'
        isDismissable={!deleting}
        isKeyboardDismissDisabled={deleting}
      >
        <ModalContent>
          <ModalHeader className='flex flex-col gap-1'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0'>
                <ExclamationTriangleIcon className='w-6 h-6 text-red-600 dark:text-red-400' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Delete Conversation
                </h3>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className='text-gray-600 dark:text-gray-400'>
              Are you sure you want to delete this conversation? This action
              cannot be undone and all messages in this conversation will be
              permanently deleted.
            </p>
            {deleteError && (
              <div className='mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                <p className='text-sm text-red-600 dark:text-red-400'>
                  {deleteError}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant='light'
              onPress={handleDeleteCancel}
              isDisabled={deleting}
            >
              Cancel
            </Button>
            <Button
              color='danger'
              onPress={handleDeleteConfirm}
              isLoading={deleting}
              startContent={
                !deleting ? <TrashIcon className='w-4 h-4' /> : undefined
              }
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
}
