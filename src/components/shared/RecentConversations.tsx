'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  ChatBubbleLeftIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import SignInModal from '@/components/auth/SignInModal';
import FlemojiModal, {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/shared/FlemojiModal';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/components/ui/Toast';
import GhostLoader from '@/components/ui/GhostLoader';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
  chatType?: string;
}

export type ChatType = 'STREAMING' | 'TIMELINE' | undefined;

interface RecentConversationsProps {
  /** Callback when a conversation is selected */
  onConversationSelect?: (_conversationId: string) => void;
  /** Currently active conversation ID */
  activeConversationId?: string | null;
  /** Chat type filter - 'STREAMING' for landing page, 'TIMELINE' for timeline page */
  chatType?: ChatType;
  /** Callback when sign-in button is clicked */
  onSignInClick?: () => void;
  /** External control for sign-in modal open state */
  onSignInModalOpen?: (_open: boolean) => void;
  /** External sign-in modal open state */
  isSignInModalOpen?: boolean;
  /** Show "New Chat" button */
  showNewChatButton?: boolean;
  /** Callback when "New Chat" is clicked */
  onNewChat?: () => void;
  /** Maximum number of conversations to show initially (default: 3) */
  maxInitialConversations?: number;
  /** Callback when conversations are updated */
  onConversationsUpdate?: () => void;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Enable auto-refresh polling (default: true) */
  enablePolling?: boolean;
  /** Polling interval in milliseconds (default: 10000) */
  pollInterval?: number;
  /** Show heading (default: true) */
  showHeading?: boolean;
}

/**
 * Reusable RecentConversations component
 *
 * Displays a list of recent conversations with support for different chat types.
 * Can be used on both the landing page (STREAMING) and timeline page (TIMELINE).
 */
export default function RecentConversations({
  onConversationSelect,
  activeConversationId,
  chatType,
  onSignInClick,
  onSignInModalOpen,
  isSignInModalOpen: externalIsSignInModalOpen,
  showNewChatButton = false,
  onNewChat,
  maxInitialConversations = 3,
  onConversationsUpdate,
  emptyMessage,
  enablePolling = true,
  pollInterval = 10000,
  showHeading = true,
}: RecentConversationsProps) {
  const { data: session, status } = useSession();
  const { error: showErrorToast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [internalIsSignInModalOpen, setInternalIsSignInModalOpen] =
    useState(false);

  // Use external state if provided, otherwise use internal state
  const isSignInModalOpen =
    externalIsSignInModalOpen !== undefined
      ? externalIsSignInModalOpen
      : internalIsSignInModalOpen;

  const setIsSignInModalOpen = (open: boolean) => {
    if (onSignInModalOpen) {
      onSignInModalOpen(open);
    } else {
      setInternalIsSignInModalOpen(open);
    }
  };

  // Store onConversationsUpdate in a ref to avoid recreating fetchConversations
  const onConversationsUpdateRef = useRef(onConversationsUpdate);

  useEffect(() => {
    onConversationsUpdateRef.current = onConversationsUpdate;
  }, [onConversationsUpdate]);

  const fetchConversations = useCallback(
    async (skipLoading = false) => {
      if (!session?.user?.id) {
        setLoading(false);
        setConversations([]);
        return;
      }

      try {
        // Only set loading state on initial fetch, not on polling updates
        if (!skipLoading) {
          setLoading(true);
        }

        // When chatType is undefined, fetch all conversations (no filter)
        // When chatType is provided, filter by that type
        const url = chatType
          ? `/api/ai/conversations?chatType=${chatType}`
          : '/api/ai/conversations';

        logger.debug('[RecentConversations] Fetching conversations:', {
          url,
          chatType: chatType || 'ALL',
          userId: session.user.id,
          skipLoading,
        });

        const response = await fetch(url, {
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorText = await response.text();
          const errorMessage = `Failed to load conversations: ${response.statusText}`;
          logger.error('[RecentConversations] Failed to fetch conversations:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });
          if (!skipLoading) {
            setConversations([]);
            showErrorToast(errorMessage, 5000);
          }
          return;
        }

        const data = await response.json();
        const fetchedConversations = Array.isArray(data.conversations)
          ? data.conversations
          : [];

        logger.info('[RecentConversations] ✅ Fetched conversations:', {
          count: fetchedConversations.length,
          chatType: chatType || 'ALL',
          userId: session.user.id,
          skipLoading,
        });

        // Only update state if conversations actually changed to prevent unnecessary re-renders
        setConversations(prev => {
          // Compare by IDs and updatedAt timestamps
          const prevIds = new Set<string>(prev.map((c: Conversation) => c.id));
          const newIds = new Set<string>(
            fetchedConversations.map((c: Conversation) => c.id)
          );

          // If IDs are different, update
          if (prevIds.size !== newIds.size) {
            return fetchedConversations;
          }

          // Check if IDs match
          for (const id of prevIds) {
            if (!newIds.has(id)) {
              return fetchedConversations;
            }
          }
          for (const id of newIds) {
            if (!prevIds.has(id)) {
              return fetchedConversations;
            }
          }

          // Check if any updatedAt timestamps changed
          const hasChanged = prev.some(prevConv => {
            const newConv = fetchedConversations.find(
              (c: Conversation) => c.id === prevConv.id
            );
            if (!newConv) return true;
            const prevTime = new Date(prevConv.updatedAt).getTime();
            const newTime = new Date(newConv.updatedAt).getTime();
            return prevTime !== newTime;
          });

          return hasChanged ? fetchedConversations : prev;
        });

        // Only call update callback if this wasn't a polling update
        if (!skipLoading) {
          onConversationsUpdateRef.current?.();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? `Error loading conversations: ${error.message}`
            : 'An unexpected error occurred while loading conversations';
        logger.error('[RecentConversations] Error fetching conversations:', {
          error,
          chatType: chatType || 'ALL',
          userId: session?.user?.id,
        });
        if (!skipLoading) {
          setConversations([]);
          showErrorToast(errorMessage, 5000);
        }
      } finally {
        if (!skipLoading) {
          setLoading(false);
        }
      }
    },
    [session?.user?.id, chatType, showErrorToast]
  );

  // Store polling config in refs to prevent effect re-runs
  const enablePollingRef = useRef(enablePolling);
  const pollIntervalRef = useRef(pollInterval);

  useEffect(() => {
    enablePollingRef.current = enablePolling;
    pollIntervalRef.current = pollInterval;
  }, [enablePolling, pollInterval]);

  useEffect(() => {
    // Only fetch when authenticated and session is available
    if (status === 'authenticated' && session?.user?.id) {
      // Initial fetch with loading state
      fetchConversations(false);

      // Poll for conversation updates if enabled (skip loading state for polling)
      if (enablePollingRef.current) {
        const pollIntervalId = setInterval(() => {
          fetchConversations(true); // Skip loading state for polling
        }, pollIntervalRef.current);

        return () => clearInterval(pollIntervalId);
      }
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setConversations([]);
    } else if (status === 'loading') {
      // Keep loading state while session is loading
      setLoading(true);
    }
    // Only re-run when status or session user id changes, not when fetchConversations changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id, chatType]);

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
      const response = await fetch(
        `/api/ai/conversations/${conversationToDelete}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        // Refresh conversations list
        await fetchConversations();
        setDeleteModalOpen(false);
        setConversationToDelete(null);

        // If the deleted conversation was active, select "new"
        if (activeConversationId === conversationToDelete) {
          onConversationSelect?.('new');
        }
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
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
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

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className='flex-1 flex flex-col min-h-0'>
        {/* Heading */}
        {showHeading && (
          <div className='flex-shrink-0 mb-4 px-3'>
            <div className='flex items-center justify-between'>
              <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                Recent Conversations
              </h3>
              {showNewChatButton && onNewChat && (
                <button
                  onClick={onNewChat}
                  className='p-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-slate-800/50 transition-colors'
                  title='New chat'
                >
                  <PlusIcon className='w-4 h-4 text-gray-600 dark:text-gray-400' />
                </button>
              )}
            </div>
          </div>
        )}
        <div className='flex justify-start px-3 py-4'>
          <GhostLoader variant='conversation' count={3} />
        </div>
      </div>
    );
  }

  // Determine which conversations to display
  // When !showAll, show only first 3 conversations (no scrolling)
  // When showAll is true, show all conversations but still constrain height to 3 conversations (with scrolling)
  const displayConversations = showAll
    ? conversations
    : conversations.slice(0, maxInitialConversations);
  const hasMore = conversations.length > maxInitialConversations;

  // Sign-in required state
  if (status !== 'authenticated' || !session) {
    return (
      <div className='flex flex-col h-full'>
        {/* Heading */}
        {showHeading && (
          <div className='flex-shrink-0 mb-4 px-3'>
            <div className='flex items-center justify-between'>
              <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                Recent Conversations
              </h3>
              {showNewChatButton && onNewChat && (
                <button
                  onClick={onNewChat}
                  className='p-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-slate-800/50 transition-colors'
                  title='New chat'
                >
                  <PlusIcon className='w-4 h-4 text-gray-600 dark:text-gray-400' />
                </button>
              )}
            </div>
          </div>
        )}
        <div className='py-6 text-center'>
          <LockClosedIcon className='w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2' />
          <p className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5'>
            Sign in to view conversations
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
            Your conversation history will appear here once you&apos;re signed
            in.
          </p>
          <button
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              setIsSignInModalOpen(true);
              if (onSignInClick) {
                setTimeout(() => {
                  onSignInClick();
                }, 100);
              }
            }}
            className='px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors duration-200 inline-flex items-center gap-1.5'
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className='flex-1 flex flex-col min-h-0'>
        {/* Heading */}
        {showHeading && (
          <div className='flex-shrink-0 mb-4 px-3'>
            <div className='flex items-center justify-between'>
              <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                Recent Conversations
              </h3>
              {showNewChatButton && onNewChat && (
                <button
                  onClick={onNewChat}
                  className='p-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-slate-800/50 transition-colors'
                  title='New chat'
                >
                  <PlusIcon className='w-4 h-4 text-gray-600 dark:text-gray-400' />
                </button>
              )}
            </div>
          </div>
        )}
        <div className='py-8 text-center'>
          <ChatBubbleLeftIcon className='w-8 h-8 mx-auto text-gray-400 mb-2' />
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            {emptyMessage || 'No conversations yet'}
          </p>
        </div>
      </div>
    );
  }

  // Note: Errors are now shown via toast notifications, not inline

  // Main conversations list with modals
  return (
    <>
      <div className='flex-1 flex flex-col min-h-0'>
        {/* Heading */}
        {showHeading && (
          <div className='flex-shrink-0 mb-4 px-3'>
            <div className='flex items-center justify-between'>
              <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                Recent Conversations
              </h3>
              {showNewChatButton && onNewChat && (
                <button
                  onClick={onNewChat}
                  className='p-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-slate-800/50 transition-colors'
                  title='New chat'
                >
                  <PlusIcon className='w-4 h-4 text-gray-600 dark:text-gray-400' />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversations list container with Load More */}
        <div className='flex-1 flex flex-col min-h-0'>
          {/* Conversations list - Always fixed height to show ~3 conversations, scrollable when showAll is true */}
          <div
            className={`space-y-1 scrollbar-subtle flex-1 min-h-0 ${
              showAll ? 'overflow-y-auto' : 'overflow-hidden'
            }`}
            style={{
              height: showAll ? 'auto' : 'calc(3 * 4rem)', // Fixed height for exactly 3 conversations when not showing all
            }}
          >
            <div className='space-y-1'>
              {displayConversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    activeConversationId === conversation.id
                      ? 'bg-blue-50/60 dark:bg-blue-900/15 border border-blue-200/40 dark:border-blue-800/40'
                      : 'hover:bg-gray-50/40 dark:hover:bg-slate-800/20 border border-transparent'
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
                      className='flex-1 text-xs bg-white dark:bg-slate-700 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500'
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onConversationSelect?.(conversation.id);
                        }}
                        className='flex-1 text-left min-w-0'
                      >
                        <div className='flex items-center gap-2'>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-gray-900 dark:text-white truncate mb-0.5'>
                              {conversation.title || 'New Conversation'}
                            </p>
                            <div className='flex items-center gap-1.5'>
                              <ClockIcon className='w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0' />
                              <span className='text-xs text-gray-500 dark:text-gray-400'>
                                {formatDate(conversation.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                      <div className='flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100'>
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
                          <DropdownMenu
                            aria-label='Conversation actions'
                            variant='flat'
                          >
                            <DropdownItem
                              key='edit'
                              startContent={
                                <PencilIcon className='w-3.5 h-3.5' />
                              }
                              onPress={() => handleEditStart(conversation)}
                            >
                              Edit
                            </DropdownItem>
                            <DropdownItem
                              key='delete'
                              color='danger'
                              startContent={
                                <TrashIcon className='w-3.5 h-3.5' />
                              }
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
          </div>

          {/* Load More button - Fixed at bottom of conversations container, before Legal Links */}
          {hasMore && !showAll && (
            <div className='flex-shrink-0 pt-2 mt-2 border-t border-gray-200/30 dark:border-slate-700/30 px-3'>
              <button
                onClick={() => setShowAll(true)}
                className='w-full px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200 text-center'
              >
                Load More ({conversations.length - maxInitialConversations}{' '}
                more)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <FlemojiModal
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
      </FlemojiModal>

      {/* Sign In Modal - Only render if state is managed internally */}
      {externalIsSignInModalOpen === undefined && (
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
        />
      )}
    </>
  );
}
