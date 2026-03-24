'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  StarIcon,
  ClockIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  FButton,
  FCard,
  FBadge,
  FChip,
  FInput,
  FStat,
  FSpinner,
  FEmptyState,
  FModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/components/ui/Toast';
import type { PostType, PostStatus } from '@prisma/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimelinePost {
  id: string;
  postType: PostType;
  title: string | null;
  description: string | null;
  status: PostStatus;
  isFeatured: boolean;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTypeLabel(type: PostType): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; color: 'success' | 'warning' | 'default' | 'danger' }
> = {
  PUBLISHED: { label: 'Published', color: 'success' },
  DRAFT: { label: 'Draft', color: 'default' },
  PENDING: { label: 'Pending', color: 'warning' },
  ARCHIVED: { label: 'Archived', color: 'default' },
  DELETED: { label: 'Deleted', color: 'danger' },
  FLAGGED: { label: 'Flagged', color: 'warning' },
};

const PAGE_SIZE = 20;

// ── Component ─────────────────────────────────────────────────────────────────

export default function TimelinePostsManagement() {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();

  // Data
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'ALL'>(
    'PUBLISHED'
  );
  const [typeFilter, setTypeFilter] = useState<PostType | 'ALL'>('ALL');

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(
    async (pageNum = page) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          page: String(pageNum),
        });
        if (searchQuery) params.append('searchQuery', searchQuery);
        if (statusFilter !== 'ALL') params.append('status', statusFilter);
        if (typeFilter !== 'ALL') params.append('postType', typeFilter);

        const response = await fetch(
          `/api/admin/timeline-posts?${params.toString()}`
        );
        if (!response.ok) throw new Error('Failed to fetch posts');

        const data = await response.json();
        setPosts(data.posts || []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        logger.error('Error fetching timeline posts:', err);
        showError('Failed to load timeline posts');
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter, typeFilter, page, showError]
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    fetchPosts(page);
  }, [fetchPosts]);

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/timeline/posts/${postToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete post');

      showSuccess('Post deleted');
      setDeleteModalOpen(false);
      setPostToDelete(null);
      const newPage = posts.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      fetchPosts(newPage);
    } catch (err) {
      logger.error('Error deleting post:', err);
      showError('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────

  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
  const featuredCount = posts.filter(p => p.isFeatured).length;
  const scheduledCount = posts.filter(p => p.scheduledFor).length;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className='space-y-5'>
      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <FCard padding='sm'>
          <FStat
            label='Total Posts'
            value={formatCount(total)}
            icon={DocumentTextIcon}
            color='purple'
          />
        </FCard>
        <FCard padding='sm'>
          <FStat
            label='Published'
            value={formatCount(publishedCount)}
            icon={CheckCircleIcon}
            color='emerald'
          />
        </FCard>
        <FCard padding='sm'>
          <FStat
            label='Featured'
            value={formatCount(featuredCount)}
            icon={StarIcon}
            color='amber'
          />
        </FCard>
        <FCard padding='sm'>
          <FStat
            label='Scheduled'
            value={formatCount(scheduledCount)}
            icon={ClockIcon}
            color='indigo'
          />
        </FCard>
      </div>

      {/* ── Main card ──────────────────────────────────────────────────── */}
      <FCard
        padding='none'
        title='Timeline Posts'
        titleIcon={<SparklesIcon className='w-4 h-4' />}
        action={
          <FButton
            variant='primary'
            size='sm'
            startContent={<PlusIcon className='w-4 h-4' />}
            onPress={() =>
              router.push('/admin/dashboard/timeline-posts/create')
            }
          >
            New Post
          </FButton>
        }
      >
        {/* ── Toolbar ────────────────────────────────────────────────── */}
        <div className='px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-gray-100 dark:border-slate-700'>
          <FInput
            placeholder='Search posts…'
            size='sm'
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={
              <MagnifyingGlassIcon className='w-4 h-4 text-gray-400 flex-shrink-0' />
            }
            classNames={{ base: 'flex-1 max-w-xs' }}
          />

          <div className='flex items-center gap-2 flex-wrap'>
            {/* Status filter */}
            <Dropdown>
              <DropdownTrigger>
                <FButton variant='outline' size='sm'>
                  {statusFilter === 'ALL'
                    ? 'All Statuses'
                    : (STATUS_CONFIG[statusFilter as PostStatus]?.label ??
                      statusFilter)}
                </FButton>
              </DropdownTrigger>
              <DropdownMenu
                selectedKeys={[statusFilter]}
                selectionMode='single'
                onSelectionChange={keys =>
                  setStatusFilter([...keys][0] as PostStatus | 'ALL')
                }
              >
                <DropdownItem key='ALL'>All Statuses</DropdownItem>
                <DropdownItem key='PUBLISHED'>Published</DropdownItem>
                <DropdownItem key='DRAFT'>Draft</DropdownItem>
                <DropdownItem key='PENDING'>Pending</DropdownItem>
                <DropdownItem key='ARCHIVED'>Archived</DropdownItem>
                <DropdownItem key='FLAGGED'>Flagged</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* Type filter */}
            <Dropdown>
              <DropdownTrigger>
                <FButton variant='outline' size='sm'>
                  {typeFilter === 'ALL'
                    ? 'All Types'
                    : getTypeLabel(typeFilter)}
                </FButton>
              </DropdownTrigger>
              <DropdownMenu
                selectedKeys={[typeFilter]}
                selectionMode='single'
                onSelectionChange={keys =>
                  setTypeFilter([...keys][0] as PostType | 'ALL')
                }
              >
                <DropdownItem key='ALL'>All Types</DropdownItem>
                <DropdownItem key='MUSIC_POST'>Music Post</DropdownItem>
                <DropdownItem key='SONG'>Song</DropdownItem>
                <DropdownItem key='NEWS_ARTICLE'>News Article</DropdownItem>
                <DropdownItem key='VIDEO_CONTENT'>Video</DropdownItem>
                <DropdownItem key='RELEASE_PROMO'>Release Promo</DropdownItem>
                <DropdownItem key='EVENT_ANNOUNCEMENT'>Event</DropdownItem>
                <DropdownItem key='ADVERTISEMENT'>Advertisement</DropdownItem>
                <DropdownItem key='POLL'>Poll</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* Active filter chips */}
            {statusFilter !== 'ALL' && (
              <FChip size='sm' onClose={() => setStatusFilter('ALL')}>
                {STATUS_CONFIG[statusFilter as PostStatus]?.label}
              </FChip>
            )}
            {typeFilter !== 'ALL' && (
              <FChip size='sm' onClose={() => setTypeFilter('ALL')}>
                {getTypeLabel(typeFilter)}
              </FChip>
            )}
          </div>

          {!loading && (
            <span className='text-xs text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0'>
              {total} post{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Table header ───────────────────────────────────────────── */}
        <div className='hidden md:grid grid-cols-[1fr_10rem_7rem_8rem_auto] px-5 py-2.5 gap-4 border-b border-gray-50 dark:border-slate-700/50'>
          {['Post', 'Type', 'Status', 'Engagement', ''].map(h => (
            <span
              key={h}
              className='text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider'
            >
              {h}
            </span>
          ))}
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        {loading ? (
          <div className='flex items-center justify-center py-16'>
            <FSpinner size='md' />
          </div>
        ) : posts.length === 0 ? (
          <div className='px-5 py-4'>
            <FEmptyState
              icon={SparklesIcon}
              title='No posts found'
              description={
                searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Create your first timeline post to engage your audience'
              }
              size='md'
              action={
                !searchQuery && statusFilter === 'ALL' && typeFilter === 'ALL'
                  ? {
                      label: 'New Post',
                      onPress: () =>
                        router.push('/admin/dashboard/timeline-posts/create'),
                      variant: 'primary',
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className='divide-y divide-gray-50 dark:divide-slate-700/50'>
            {posts.map(post => {
              const statusCfg =
                STATUS_CONFIG[post.status] ?? STATUS_CONFIG.DRAFT;
              return (
                <div
                  key={post.id}
                  className='group px-5 py-3.5 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_10rem_7rem_8rem_auto] gap-4 items-center hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors'
                >
                  {/* Post info */}
                  <div className='flex items-start gap-3 min-w-0'>
                    {post.isFeatured && (
                      <StarIcon className='w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5' />
                    )}
                    <div className='min-w-0 overflow-hidden'>
                      <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                        {post.title || 'Untitled Post'}
                      </p>
                      <div className='flex items-center gap-2 mt-0.5 flex-wrap'>
                        <span className='text-xs text-gray-400 dark:text-gray-500'>
                          {post.author.name || post.author.email}
                        </span>
                        <span className='text-gray-300 dark:text-gray-600'>
                          ·
                        </span>
                        <span className='text-xs text-gray-400 dark:text-gray-500'>
                          {formatDate(post.publishedAt ?? post.createdAt)}
                        </span>
                        {post.scheduledFor && (
                          <>
                            <span className='text-gray-300 dark:text-gray-600'>
                              ·
                            </span>
                            <span className='flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400'>
                              <ClockIcon className='w-3 h-3' />
                              Scheduled
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Type */}
                  <div className='hidden md:block'>
                    <FChip size='sm'>{getTypeLabel(post.postType)}</FChip>
                  </div>

                  {/* Status */}
                  <div className='hidden md:block'>
                    <FBadge variant='status' color={statusCfg.color}>
                      {statusCfg.label}
                    </FBadge>
                  </div>

                  {/* Engagement */}
                  <div className='hidden md:flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 tabular-nums'>
                    <span title='Likes' className='flex items-center gap-1'>
                      <span className='text-rose-400'>♥</span>
                      {formatCount(post.likeCount)}
                    </span>
                    <span title='Comments' className='flex items-center gap-1'>
                      <span className='text-indigo-400'>💬</span>
                      {formatCount(post.commentCount)}
                    </span>
                    <span title='Views' className='flex items-center gap-1'>
                      <EyeIcon className='w-3.5 h-3.5 text-gray-400' />
                      {formatCount(post.viewCount)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center justify-end'>
                    <Dropdown placement='bottom-end'>
                      <DropdownTrigger>
                        <FButton
                          isIconOnly
                          size='sm'
                          variant='ghost'
                          className='opacity-0 group-hover:opacity-100 transition-opacity'
                          aria-label='Post options'
                        >
                          <EllipsisVerticalIcon className='w-4 h-4' />
                        </FButton>
                      </DropdownTrigger>
                      <DropdownMenu aria-label='Post actions'>
                        <DropdownItem
                          key='view'
                          startContent={<EyeIcon className='w-4 h-4' />}
                        >
                          View Post
                        </DropdownItem>
                        <DropdownItem
                          key='edit'
                          startContent={<PencilIcon className='w-4 h-4' />}
                        >
                          Edit Post
                        </DropdownItem>
                        <DropdownItem
                          key='archive'
                          startContent={<ArchiveBoxIcon className='w-4 h-4' />}
                        >
                          Archive
                        </DropdownItem>
                        <DropdownItem
                          key='delete'
                          className='text-danger'
                          color='danger'
                          startContent={<TrashIcon className='w-4 h-4' />}
                          onPress={() => {
                            setPostToDelete(post.id);
                            setDeleteModalOpen(true);
                          }}
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className='px-5 py-3.5 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between gap-4'>
            <p className='text-xs text-gray-400 dark:text-gray-500'>
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className='flex items-center gap-2'>
              <FButton
                size='sm'
                variant='outline'
                isDisabled={page <= 1}
                onPress={() => setPage(p => p - 1)}
              >
                Previous
              </FButton>
              <span className='text-xs text-gray-500 dark:text-gray-400 tabular-nums min-w-[4rem] text-center'>
                {page} / {totalPages}
              </span>
              <FButton
                size='sm'
                variant='outline'
                isDisabled={page >= totalPages}
                onPress={() => setPage(p => p + 1)}
              >
                Next
              </FButton>
            </div>
          </div>
        )}
      </FCard>

      {/* ── Delete confirmation ─────────────────────────────────────────── */}
      <FModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPostToDelete(null);
        }}
        size='sm'
      >
        <ModalContent>
          <ModalHeader>Delete Post</ModalHeader>
          <ModalBody>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              This post will be permanently deleted. This action cannot be
              undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <FButton
              variant='ghost'
              onPress={() => {
                setDeleteModalOpen(false);
                setPostToDelete(null);
              }}
            >
              Cancel
            </FButton>
            <FButton
              variant='danger'
              onPress={handleDelete}
              isLoading={deleting}
            >
              Delete
            </FButton>
          </ModalFooter>
        </ModalContent>
      </FModal>
    </div>
  );
}
