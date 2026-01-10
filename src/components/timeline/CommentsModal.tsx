'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { TimelinePostRenderer } from './renderers';
import type { TimelinePostWithAuthor } from '@/lib/services/timeline-service';
import type { Session } from 'next-auth';
import GhostLoader from '@/components/ui/GhostLoader';
import { logger } from '@/lib/utils/logger';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  replies?: Comment[];
  isLiked?: boolean;
}

interface CommentsModalProps {
  post: TimelinePostWithAuthor | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (_postId: string) => Promise<void>;
  onShare?: (_postId: string, _platform?: string) => Promise<void>;
  onPlayTrack?: (_trackId: string) => void;
}

export default function CommentsModal({
  post,
  isOpen,
  onClose,
  onLike,
  onShare,
  onPlayTrack,
}: CommentsModalProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [_nextCursor, setNextCursor] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen && post) {
      fetchComments();
    } else {
      setComments([]);
      setCommentText('');
      setNextCursor(null);
    }
  }, [isOpen, post?.id]);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom when new comment is added
  useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length]);

  const fetchComments = async () => {
    if (!post) return;
    try {
      setLoading(true);
      const response = await fetch(
        `/api/timeline/posts/${post.id}/comments?limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match our Comment interface
        const transformedComments: Comment[] = (data.comments || []).map(
          (c: any) => ({
            id: c.id,
            content: c.content,
            createdAt: new Date(c.createdAt),
            likeCount: c.likeCount || c._count?.likes || 0,
            user: c.user,
            replies: (c.replies || []).map((r: any) => ({
              id: r.id,
              content: r.content,
              createdAt: new Date(r.createdAt),
              likeCount: r.likeCount || r._count?.likes || 0,
              user: r.user,
              replies: [],
              isLiked: r.isLikedByCurrentUser || false,
            })),
            isLiked: c.isLikedByCurrentUser || false,
          })
        );
        setComments(transformedComments);
        setNextCursor(data.nextCursor || null);
      }
    } catch (error) {
      logger.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!post || !commentText.trim() || submitting || !session?.user) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/timeline/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        const newComment: Comment = {
          id: data.comment.id,
          content: data.comment.content,
          createdAt: new Date(data.comment.createdAt),
          likeCount: data.comment.likeCount || 0,
          user: {
            id: session.user.id,
            name: session.user.name || null,
            email: session.user.email || '',
            image: session.user.image || null,
          },
          replies: [],
          isLiked: false,
        };
        setComments(prev => [newComment, ...prev]);
        setCommentText('');
        // Update post comment count
        if (post) {
          post.commentCount = (post.commentCount || 0) + 1;
        }
      }
    } catch (error) {
      logger.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/timeline/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setComments(prev =>
          prev.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: data.liked,
                likeCount: data.likeCount,
              };
            }
            // Also update in replies
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        isLiked: data.liked,
                        likeCount: data.likeCount,
                      }
                    : reply
                ),
              };
            }
            return comment;
          })
        );
      }
    } catch (error) {
      logger.error('Error toggling comment like:', error);
    }
  };

  const handleReply = async (content: string, parentId: string) => {
    if (!post || !session?.user) return;

    try {
      const response = await fetch(`/api/timeline/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId }),
      });

      if (response.ok) {
        const data = await response.json();
        const newReply: Comment = {
          id: data.comment.id,
          content: data.comment.content,
          createdAt: new Date(data.comment.createdAt),
          likeCount: 0,
          user: {
            id: session.user.id,
            name: session.user.name || null,
            email: session.user.email || '',
            image: session.user.image || null,
          },
          replies: [],
          isLiked: false,
        };
        setComments(prev =>
          prev.map(c =>
            c.id === parentId
              ? {
                  ...c,
                  replies: [...(c.replies || []), newReply],
                }
              : c
          )
        );
      }
    } catch (error) {
      logger.error('Error submitting reply:', error);
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        role='button'
        tabIndex={0}
        aria-label='Close modal'
      />

      {/* Modal */}
      <div className='relative w-full max-w-6xl h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex overflow-hidden'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 transition-colors'
          aria-label='Close'
        >
          <XMarkIcon className='w-5 h-5 text-gray-600 dark:text-gray-300' />
        </button>

        {/* Left Side - Post Content */}
        <div className='w-1/2 border-r border-gray-200 dark:border-slate-700 overflow-y-auto scrollbar-subtle p-6'>
          <div className='max-w-md mx-auto'>
            <TimelinePostRenderer
              post={post}
              onLike={onLike}
              onShare={onShare}
              onPlayTrack={onPlayTrack}
            />
          </div>
        </div>

        {/* Right Side - Comments */}
        <div className='w-1/2 flex flex-col bg-gray-50 dark:bg-slate-800/50'>
          {/* Comments Header */}
          <div className='flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
              Comments ({post.commentCount || post._count?.comments || 0})
            </h2>
          </div>

          {/* Comments List */}
          <div className='flex-1 overflow-y-auto scrollbar-subtle px-6 py-4 space-y-4'>
            {loading ? (
              <GhostLoader variant='comment' count={3} />
            ) : comments.length === 0 ? (
              <div className='text-center py-12'>
                <ChatBubbleLeftIcon className='w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3' />
                <p className='text-gray-500 dark:text-gray-400'>
                  No comments yet. Be the first to comment!
                </p>
              </div>
            ) : (
              <>
                {comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onLike={handleLikeComment}
                    session={session}
                    onReply={handleReply}
                  />
                ))}
                <div ref={commentsEndRef} />
              </>
            )}
          </div>

          {/* Comment Input */}
          {session?.user ? (
            <div className='flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'>
              <form onSubmit={handleSubmitComment} className='flex gap-3'>
                <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden'>
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || session.user.email || ''}
                      width={32}
                      height={32}
                      className='rounded-full'
                    />
                  ) : (
                    <span className='text-white text-xs font-semibold'>
                      {(session.user.name ||
                        session.user.email ||
                        'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className='flex-1 flex gap-2'>
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder='Write a comment...'
                    disabled={submitting}
                    rows={1}
                    className='flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500'
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const form = e.currentTarget.closest('form');
                        if (form) {
                          form.requestSubmit();
                        }
                      }
                    }}
                  />
                  <button
                    type='submit'
                    disabled={!commentText.trim() || submitting}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      !commentText.trim() || submitting
                        ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    <PaperAirplaneIcon className='w-4 h-4' />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className='flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center'>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                <a
                  href='/login'
                  className='text-blue-600 dark:text-blue-400 hover:underline'
                >
                  Sign in
                </a>{' '}
                to comment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Comment Item Component with nested replies support
interface CommentItemProps {
  comment: Comment;
  onLike: (_commentId: string) => void;
  session: Session | null;
  onReply: (_content: string, _parentId: string) => Promise<void>;
}

function CommentItem({ comment, onLike, session, onReply }: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;

    try {
      setSubmitting(true);
      await onReply(replyText.trim(), comment.id);
      setReplyText('');
      setShowReplyInput(false);
    } catch (error) {
      logger.error('Error submitting reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='flex gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors'>
      {/* Avatar */}
      <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden'>
        {comment.user.image ? (
          <Image
            src={comment.user.image}
            alt={comment.user.name || comment.user.email}
            width={32}
            height={32}
            className='rounded-full'
          />
        ) : (
          <span className='text-white text-xs font-semibold'>
            {(comment.user.name || comment.user.email)[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Comment Content */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2 mb-1'>
          <p className='text-sm font-semibold text-gray-900 dark:text-white'>
            {comment.user.name || comment.user.email.split('@')[0]}
          </p>
          <span className='text-xs text-gray-500 dark:text-gray-400'>
            {new Date(comment.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
        <p className='text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap'>
          {comment.content}
        </p>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              comment.isLiked
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            {comment.isLiked ? (
              <HeartSolidIcon className='w-4 h-4' />
            ) : (
              <HeartIcon className='w-4 h-4' />
            )}
            <span>{comment.likeCount || 0}</span>
          </button>
          {session?.user && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
            >
              <ArrowUturnLeftIcon className='w-4 h-4' />
              <span>Reply</span>
            </button>
          )}
        </div>

        {/* Reply Input */}
        {showReplyInput && session?.user && (
          <form onSubmit={handleSubmitReply} className='mt-3 flex gap-2'>
            <div className='w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden'>
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || session.user.email || ''}
                  width={24}
                  height={24}
                  className='rounded-full'
                />
              ) : (
                <span className='text-white text-[10px] font-semibold'>
                  {(session.user.name ||
                    session.user.email ||
                    'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className='flex-1 flex gap-2'>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder='Write a reply...'
                disabled={submitting}
                rows={1}
                className='flex-1 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500'
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.currentTarget.closest('form');
                    if (form) {
                      form.requestSubmit();
                    }
                  }
                }}
              />
              <button
                type='submit'
                disabled={!replyText.trim() || submitting}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  !replyText.trim() || submitting
                    ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                <PaperAirplaneIcon className='w-3.5 h-3.5' />
              </button>
            </div>
          </form>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className='mt-3 ml-4 space-y-3 border-l-2 border-gray-200 dark:border-slate-700 pl-4'>
            {comment.replies.map(reply => (
              <div key={reply.id} className='flex gap-2'>
                <div className='w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden'>
                  {reply.user.image ? (
                    <Image
                      src={reply.user.image}
                      alt={reply.user.name || reply.user.email}
                      width={24}
                      height={24}
                      className='rounded-full'
                    />
                  ) : (
                    <span className='text-white text-[10px] font-semibold'>
                      {(reply.user.name || reply.user.email)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-0.5'>
                    <p className='text-xs font-semibold text-gray-900 dark:text-white'>
                      {reply.user.name || reply.user.email.split('@')[0]}
                    </p>
                    <span className='text-[10px] text-gray-500 dark:text-gray-400'>
                      {new Date(reply.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className='text-xs text-gray-700 dark:text-gray-300 mb-1 whitespace-pre-wrap'>
                    {reply.content}
                  </p>
                  <button
                    onClick={() => onLike(reply.id)}
                    className={`flex items-center gap-1 text-[10px] transition-colors ${
                      reply.isLiked
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    {reply.isLiked ? (
                      <HeartSolidIcon className='w-3 h-3' />
                    ) : (
                      <HeartIcon className='w-3 h-3' />
                    )}
                    <span>{reply.likeCount || 0}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
