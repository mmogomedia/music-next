'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/components/ui/Toast';
import type { PostType, PostStatus } from '@prisma/client';

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

export default function TimelinePostsManagement() {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'ALL'>(
    'PUBLISHED'
  );
  const [typeFilter, setTypeFilter] = useState<PostType | 'ALL'>('ALL');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('postType', typeFilter);

      const response = await fetch(
        `/api/admin/timeline-posts?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      logger.error('Error fetching timeline posts:', err);
      showError('Failed to load timeline posts');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter, showError]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async () => {
    if (!postToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/timeline/posts/${postToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      showSuccess('Post deleted successfully');
      setDeleteModalOpen(false);
      setPostToDelete(null);
      fetchPosts();
    } catch (err) {
      logger.error('Error deleting post:', err);
      showError('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'default';
      case 'PENDING':
        return 'warning';
      case 'ARCHIVED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: PostType) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between'>
        <div className='flex-1 w-full sm:w-auto'>
          <Input
            placeholder='Search posts...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            startContent={
              <MagnifyingGlassIcon className='w-4 h-4 text-gray-400' />
            }
            className='max-w-sm'
            size='sm'
          />
        </div>
        <div className='flex gap-2'>
          <Dropdown>
            <DropdownTrigger>
              <Button variant='bordered' size='sm'>
                Status: {statusFilter === 'ALL' ? 'All' : statusFilter}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[statusFilter]}
              onAction={key => setStatusFilter(key as PostStatus | 'ALL')}
            >
              <DropdownItem key='ALL'>All Status</DropdownItem>
              <DropdownItem key='DRAFT'>Draft</DropdownItem>
              <DropdownItem key='PENDING'>Pending</DropdownItem>
              <DropdownItem key='PUBLISHED'>Published</DropdownItem>
              <DropdownItem key='ARCHIVED'>Archived</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button variant='bordered' size='sm'>
                Type: {typeFilter === 'ALL' ? 'All' : getTypeLabel(typeFilter)}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[typeFilter]}
              onAction={key => setTypeFilter(key as PostType | 'ALL')}
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
          <Button
            color='primary'
            size='sm'
            startContent={<PlusIcon className='w-4 h-4' />}
            onClick={() =>
              router.push('/admin/dashboard/timeline-posts/create')
            }
          >
            New Post
          </Button>
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center items-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      ) : posts.length === 0 ? (
        <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700'>
          <SparklesIcon className='w-12 h-12 text-gray-400 mx-auto mb-3' />
          <p className='text-gray-500 dark:text-gray-400'>No posts found</p>
        </div>
      ) : (
        <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    Post
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    Author
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    Engagement
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-slate-700'>
                {posts.map(post => (
                  <tr
                    key={post.id}
                    className='hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'
                  >
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        {post.isFeatured && (
                          <SparklesIcon className='w-4 h-4 text-yellow-500 flex-shrink-0' />
                        )}
                        <div className='min-w-0'>
                          <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                            {post.title || 'Untitled Post'}
                          </p>
                          {post.description && (
                            <p className='text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                              {post.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <Chip size='sm' variant='flat'>
                        {getTypeLabel(post.postType)}
                      </Chip>
                    </td>
                    <td className='px-4 py-3'>
                      <Chip
                        size='sm'
                        color={getStatusColor(post.status)}
                        variant='flat'
                      >
                        {post.status}
                      </Chip>
                    </td>
                    <td className='px-4 py-3'>
                      <p className='text-sm text-gray-900 dark:text-white'>
                        {post.author.name || post.author.email}
                      </p>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400'>
                        <span>❤️ {post.likeCount}</span>
                        <span>💬 {post.commentCount}</span>
                        <span>👁️ {post.viewCount}</span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='text-xs text-gray-500 dark:text-gray-400'>
                        {post.publishedAt ? (
                          <div>
                            <div>{formatDate(post.publishedAt)}</div>
                            {post.scheduledFor && (
                              <div className='flex items-center gap-1 mt-1'>
                                <ClockIcon className='w-3 h-3' />
                                <span>Scheduled</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span>Not published</span>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          isIconOnly
                          variant='light'
                          size='sm'
                          aria-label='View post'
                        >
                          <EyeIcon className='w-4 h-4' />
                        </Button>
                        <Button
                          isIconOnly
                          variant='light'
                          size='sm'
                          aria-label='Edit post'
                        >
                          <PencilIcon className='w-4 h-4' />
                        </Button>
                        <Button
                          isIconOnly
                          variant='light'
                          color='danger'
                          size='sm'
                          aria-label='Delete post'
                          onClick={() => {
                            setPostToDelete(post.id);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <TrashIcon className='w-4 h-4' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
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
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant='light'
              onPress={() => {
                setDeleteModalOpen(false);
                setPostToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button color='danger' onPress={handleDelete} isLoading={deleting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
