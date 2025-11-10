'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from '@heroui/react';
import {
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  LinkIcon,
  PencilSquareIcon,
  PlusIcon,
  PowerIcon,
  TagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/Toast';
import type { Track } from '@/types/track';
import type { ArtistProfile } from '@/types/artist-profile';

const QUICK_LINK_TYPE_LABELS: Record<QuickLinkTypeValue, string> = {
  TRACK: 'Track',
  ARTIST: 'Artist Profile',
  ALBUM: 'Album',
};

type QuickLinkTypeValue = 'TRACK' | 'ARTIST' | 'ALBUM';

type QuickLinkResponse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: QuickLinkTypeValue;
  trackId: string | null;
  artistProfileId: string | null;
  albumArtistId: string | null;
  albumName: string | null;
  isActive: boolean;
  isPrerelease: boolean;
  totalVisits: number;
  playCount: number;
  downloadCount: number;
  likeCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  track?: {
    id: string;
    title: string;
    artist: string | null;
    coverImageUrl: string | null;
    albumArtwork: string | null;
    album: string | null;
    isPublic: boolean;
  } | null;
  artistProfile?: {
    id: string;
    artistName: string;
    profileImage: string | null;
    slug: string | null;
  } | null;
  albumArtist?: {
    id: string;
    artistName: string;
    profileImage: string | null;
    slug: string | null;
  } | null;
};

type AlbumOption = {
  key: string;
  albumName: string;
  albumArtistId: string;
  artistName: string;
  trackCount: number;
};

interface QuickLinksManagerProps {
  tracks: Track[];
  profile?: ArtistProfile | null;
}

type FormState = {
  type: QuickLinkTypeValue;
  trackId?: string;
  artistProfileId?: string;
  albumArtistId?: string;
  albumName?: string;
  title: string;
  description: string;
  slug: string;
  isPrerelease: boolean;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);

export default function QuickLinksManager({
  tracks,
  profile,
}: QuickLinksManagerProps) {
  const { showToast } = useToast();
  const [quickLinks, setQuickLinks] = useState<QuickLinkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTitleDirty, setIsTitleDirty] = useState(false);
  const [isSlugDirty, setIsSlugDirty] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(() => ({
    type: 'TRACK',
    trackId: undefined,
    artistProfileId: profile?.id,
    albumArtistId: profile?.id,
    albumName: undefined,
    title: '',
    description: '',
    slug: '',
    isPrerelease: false,
  }));

  const albumOptions = useMemo<AlbumOption[]>(() => {
    const map = new Map<string, AlbumOption>();

    tracks
      .filter(track => Boolean(track.album) && track.artistProfileId)
      .forEach(track => {
        const key = `${track.artistProfileId}::${(track.album || '').toLowerCase()}`;
        const existing = map.get(key);
        if (existing) {
          existing.trackCount += 1;
        } else {
          map.set(key, {
            key,
            albumArtistId: track.artistProfileId!,
            artistName: track.artist || profile?.artistName || 'Artist',
            albumName: track.album || 'Untitled Album',
            trackCount: 1,
          });
        }
      });

    return Array.from(map.values()).sort((a, b) =>
      a.albumName.localeCompare(b.albumName)
    );
  }, [tracks, profile?.artistName]);

  useEffect(() => {
    const fetchQuickLinks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/dashboard/quick-links');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Failed to load quick links');
        }
        const body = await res.json();
        setQuickLinks(body.data || []);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : 'Failed to load quick links'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuickLinks();
  }, []);

  const resetForm = (type: QuickLinkTypeValue = 'TRACK') => {
    setEditingId(null);
    setFormState({
      type,
      trackId: undefined,
      artistProfileId: profile?.id,
      albumArtistId: profile?.id,
      albumName: undefined,
      title: '',
      description: '',
      slug: '',
      isPrerelease: false,
    });
    setIsTitleDirty(false);
    setIsSlugDirty(false);
  };

  const openCreateModal = (type: QuickLinkTypeValue = 'TRACK') => {
    resetForm(type);
    setIsModalOpen(true);
  };

  const handleFormChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (editingId) {
      return;
    }

    if (formState.type === 'TRACK' && formState.trackId) {
      const track = tracks.find(t => t.id === formState.trackId);
      if (track) {
        if (!isTitleDirty) {
          handleFormChange(
            'title',
            `${track.title}${track.artist ? ` – ${track.artist}` : ''}`.trim()
          );
        }
        if (!isSlugDirty) {
          const base = `${track.title} ${track.artist ?? ''}`.trim();
          handleFormChange('slug', slugify(base));
        }
      }
    } else if (formState.type === 'ARTIST' && profile) {
      if (!isTitleDirty) {
        handleFormChange('title', profile.artistName);
      }
      if (!isSlugDirty) {
        handleFormChange('slug', slugify(profile.artistName));
      }
    } else if (
      formState.type === 'ALBUM' &&
      formState.albumArtistId &&
      formState.albumName
    ) {
      const artistName =
        tracks.find(
          track =>
            track.artistProfileId === formState.albumArtistId &&
            track.album?.toLowerCase() === formState.albumName?.toLowerCase()
        )?.artist ||
        profile?.artistName ||
        'Artist';

      if (!isTitleDirty) {
        handleFormChange(
          'title',
          `${artistName} – ${formState.albumName}`.trim()
        );
      }
      if (!isSlugDirty) {
        handleFormChange(
          'slug',
          slugify(`${artistName} ${formState.albumName}`)
        );
      }
    }
  }, [
    formState.type,
    formState.trackId,
    formState.albumArtistId,
    formState.albumName,
    editingId,
    isTitleDirty,
    isSlugDirty,
    profile,
    tracks,
  ]);

  const refreshQuickLinks = async () => {
    try {
      const res = await fetch('/api/dashboard/quick-links');
      if (!res.ok) {
        throw new Error('Failed to refresh quick links');
      }
      const body = await res.json();
      setQuickLinks(body.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to refresh quick links', 'error');
    }
  };

  const submitForm = async () => {
    setIsSaving(true);
    try {
      if (!formState.slug) {
        handleFormChange('slug', slugify(formState.title));
      }

      const payload: Record<string, unknown> = {
        type: formState.type,
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        slug: formState.slug.trim() || undefined,
        isPrerelease: formState.isPrerelease,
      };

      if (formState.type === 'TRACK') {
        if (!formState.trackId) {
          showToast('Select a track to continue', 'error');
          setIsSaving(false);
          return;
        }
        payload.trackId = formState.trackId;
      }

      if (formState.type === 'ARTIST') {
        if (!profile?.id) {
          showToast('Artist profile not found', 'error');
          setIsSaving(false);
          return;
        }
        payload.artistProfileId = profile.id;
      }

      if (formState.type === 'ALBUM') {
        if (!formState.albumArtistId || !formState.albumName) {
          showToast('Select an album to continue', 'error');
          setIsSaving(false);
          return;
        }
        payload.albumArtistId = formState.albumArtistId;
        payload.albumName = formState.albumName;
      }

      let response: Response;

      if (editingId) {
        response = await fetch(`/api/dashboard/quick-links/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/dashboard/quick-links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to save quick link');
      }

      showToast(
        editingId
          ? 'Quick link updated successfully'
          : 'Quick link created successfully'
      );
      setIsModalOpen(false);
      await refreshQuickLinks();
    } catch (err) {
      console.error(err);
      showToast(
        err instanceof Error ? err.message : 'Failed to save quick link',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (link: QuickLinkResponse) => {
    try {
      const res = await fetch(`/api/dashboard/quick-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.isActive }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to update link status');
      }

      await refreshQuickLinks();
      showToast(
        !link.isActive ? 'Quick link enabled' : 'Quick link disabled',
        'info'
      );
    } catch (err) {
      console.error(err);
      showToast(
        err instanceof Error ? err.message : 'Failed to update link status',
        'error'
      );
    }
  };

  const deleteLink = async (link: QuickLinkResponse) => {
    if (!window.confirm('Are you sure you want to delete this quick link?')) {
      return;
    }

    try {
      const res = await fetch(`/api/dashboard/quick-links/${link.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to delete link');
      }

      await refreshQuickLinks();
      showToast('Quick link deleted');
    } catch (err) {
      console.error(err);
      showToast(
        err instanceof Error ? err.message : 'Failed to delete link',
        'error'
      );
    }
  };

  const copyLink = async (slug: string) => {
    try {
      const url = `${window.location.origin}/quick/${slug}`;
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to copy link', 'error');
    }
  };

  const openEditModal = (link: QuickLinkResponse) => {
    setEditingId(link.id);
    setIsTitleDirty(true);
    setIsSlugDirty(true);
    setFormState({
      type: link.type,
      trackId: link.trackId ?? undefined,
      artistProfileId: link.artistProfileId ?? profile?.id,
      albumArtistId: link.albumArtistId ?? profile?.id,
      albumName: link.albumName ?? undefined,
      title: link.title,
      description: link.description ?? '',
      slug: link.slug,
      isPrerelease: link.isPrerelease,
    });
    setIsModalOpen(true);
  };

  const renderTarget = (link: QuickLinkResponse) => {
    if (link.type === 'TRACK') {
      return link.track?.title ?? 'Track';
    }
    if (link.type === 'ARTIST') {
      return link.artistProfile?.artistName ?? profile?.artistName ?? 'Artist';
    }
    return `${link.albumArtist?.artistName ?? profile?.artistName ?? 'Artist'} – ${link.albumName ?? ''}`.trim();
  };

  return (
    <Card>
      <CardBody className='p-6 space-y-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Quick Links
            </h3>
            <p className='text-gray-500 dark:text-gray-400 max-w-2xl'>
              Generate shareable URLs that deep-link fans directly to your
              tracks, profile, or albums. Track visits and engagement for every
              link.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              color='primary'
              startContent={<PlusIcon className='w-4 h-4' />}
              onPress={() => openCreateModal('TRACK')}
            >
              Create Quick Link
            </Button>
          </div>
        </div>

        {error && (
          <div className='p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm'>
            {error}
          </div>
        )}

        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent'></div>
          </div>
        ) : quickLinks.length === 0 ? (
          <div className='border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center bg-gray-50/50 dark:bg-slate-800/30'>
            <div className='mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center'>
              <LinkIcon className='w-8 h-8 text-blue-600 dark:text-blue-400' />
            </div>
            <h4 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
              No quick links yet
            </h4>
            <p className='text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto'>
              Create your first quick link to share a track, album, or your
              artist profile directly with listeners.
            </p>
            <Button
              color='primary'
              startContent={<PlusIcon className='w-4 h-4' />}
              onPress={() => openCreateModal('TRACK')}
            >
              Create Quick Link
            </Button>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-slate-700'>
              <thead className='bg-gray-50 dark:bg-slate-800/50'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Title
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Target
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Analytics
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-slate-700'>
                {quickLinks.map(link => (
                  <tr
                    key={link.id}
                    className='hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors'
                  >
                    <td className='px-4 py-4 align-top'>
                      <div className='space-y-1'>
                        <div className='text-sm font-semibold text-gray-900 dark:text-white'>
                          {link.title}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                          <TagIcon className='w-3 h-3' />
                          {link.slug}
                        </div>
                        {link.isPrerelease && (
                          <Chip size='sm' color='warning' variant='flat'>
                            Pre-release
                          </Chip>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-4 align-top'>
                      <Chip size='sm' color='primary' variant='flat'>
                        {QUICK_LINK_TYPE_LABELS[link.type]}
                      </Chip>
                    </td>
                    <td className='px-4 py-4 align-top text-sm text-gray-700 dark:text-gray-200'>
                      {renderTarget(link)}
                    </td>
                    <td className='px-4 py-4 align-top text-sm text-gray-700 dark:text-gray-200'>
                      <div className='flex flex-wrap gap-2'>
                        <AnalyticsBadge
                          label='Visits'
                          value={link.totalVisits}
                        />
                        <AnalyticsBadge label='Plays' value={link.playCount} />
                        <AnalyticsBadge
                          label='Downloads'
                          value={link.downloadCount}
                        />
                        <AnalyticsBadge
                          label='Shares'
                          value={link.shareCount}
                        />
                        <AnalyticsBadge label='Likes' value={link.likeCount} />
                      </div>
                    </td>
                    <td className='px-4 py-4 align-top'>
                      <Chip
                        size='sm'
                        color={link.isActive ? 'success' : 'default'}
                        variant={link.isActive ? 'flat' : 'bordered'}
                      >
                        {link.isActive ? 'Active' : 'Disabled'}
                      </Chip>
                    </td>
                    <td className='px-4 py-4 align-top'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          isIconOnly
                          size='sm'
                          variant='light'
                          onPress={() =>
                            window.open(`/quick/${link.slug}`, '_blank')
                          }
                          aria-label='Preview'
                        >
                          <EyeIcon className='w-4 h-4' />
                        </Button>
                        <Button
                          isIconOnly
                          size='sm'
                          variant='light'
                          onPress={() => copyLink(link.slug)}
                          aria-label='Copy link'
                        >
                          <ClipboardDocumentIcon className='w-4 h-4' />
                        </Button>
                        <Button
                          isIconOnly
                          size='sm'
                          variant='light'
                          onPress={() => openEditModal(link)}
                          aria-label='Edit'
                        >
                          <PencilSquareIcon className='w-4 h-4' />
                        </Button>
                        <Button
                          isIconOnly
                          size='sm'
                          variant='light'
                          onPress={() => toggleActive(link)}
                          aria-label='Toggle status'
                        >
                          <PowerIcon className='w-4 h-4' />
                        </Button>
                        <Button
                          isIconOnly
                          size='sm'
                          variant='light'
                          className='text-red-500'
                          onPress={() => deleteLink(link)}
                          aria-label='Delete'
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
        )}

        <Modal
          isOpen={isModalOpen}
          onOpenChange={open => {
            if (!open) {
              setIsModalOpen(false);
              resetForm(formState.type);
            }
          }}
          size='xl'
          backdrop='blur'
        >
          <ModalContent>
            {onClose => (
              <>
                <ModalHeader className='flex flex-col items-start gap-1'>
                  <span className='text-sm uppercase text-gray-400 dark:text-gray-500'>
                    {editingId ? 'Edit Quick Link' : 'Create Quick Link'}
                  </span>
                  <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                    {editingId
                      ? 'Update quick link details'
                      : 'Generate a new quick link'}
                  </h3>
                </ModalHeader>
                <ModalBody className='space-y-4'>
                  <div className='space-y-2'>
                    <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Smart Link Type
                    </p>
                    <div className='grid grid-cols-3 gap-2'>
                      {(
                        ['TRACK', 'ARTIST', 'ALBUM'] as QuickLinkTypeValue[]
                      ).map(option => (
                        <button
                          key={option}
                          type='button'
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            formState.type === option
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
                              : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500'
                          }`}
                          onClick={() => {
                            handleFormChange('type', option);
                            if (option === 'TRACK') {
                              handleFormChange('trackId', undefined);
                            }
                            if (option === 'ALBUM') {
                              handleFormChange('albumArtistId', profile?.id);
                              handleFormChange('albumName', undefined);
                            }
                            if (option === 'ARTIST' && profile?.id) {
                              handleFormChange('artistProfileId', profile.id);
                            }
                            setIsTitleDirty(false);
                            setIsSlugDirty(false);
                          }}
                        >
                          {QUICK_LINK_TYPE_LABELS[option]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formState.type === 'TRACK' && (
                    <div className='space-y-2'>
                      <Select
                        label='Track'
                        placeholder='Select a track'
                        selectedKeys={
                          formState.trackId ? [formState.trackId] : []
                        }
                        onSelectionChange={keys => {
                          const id = Array.from(keys)[0] as string | undefined;
                          handleFormChange('trackId', id);
                        }}
                      >
                        {tracks.map(track => (
                          <SelectItem key={track.id} textValue={track.title}>
                            <div className='flex flex-col gap-1'>
                              <span className='font-medium text-gray-900 dark:text-white'>
                                {track.title}
                              </span>
                              <span className='text-xs text-gray-500 dark:text-gray-400'>
                                {track.artist || 'Unknown artist'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  )}

                  {formState.type === 'ARTIST' && (
                    <div className='space-y-1 text-sm text-gray-600 dark:text-gray-300'>
                      <div className='flex items-center gap-2'>
                        <CheckCircleIcon className='w-4 h-4 text-blue-500' />
                        {profile?.artistName || 'Artist profile'} will be used.
                      </div>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        The quick link will open your public artist profile with
                        social links and top songs.
                      </p>
                    </div>
                  )}

                  {formState.type === 'ALBUM' && (
                    <div className='space-y-2'>
                      <Select
                        label='Album'
                        placeholder='Select an album'
                        selectedKeys={
                          formState.albumArtistId && formState.albumName
                            ? [
                                `${formState.albumArtistId}::${formState.albumName.toLowerCase()}`,
                              ]
                            : []
                        }
                        onSelectionChange={keys => {
                          const key = Array.from(keys)[0] as string | undefined;
                          if (!key) {
                            handleFormChange('albumArtistId', undefined);
                            handleFormChange('albumName', undefined);
                            return;
                          }
                          const option = albumOptions.find(
                            item => item.key === key
                          );
                          if (option) {
                            handleFormChange(
                              'albumArtistId',
                              option.albumArtistId
                            );
                            handleFormChange('albumName', option.albumName);
                          }
                        }}
                      >
                        {albumOptions.length === 0 ? (
                          <SelectItem key='empty' isDisabled>
                            No albums found. Add album metadata to your tracks
                            first.
                          </SelectItem>
                        ) : (
                          albumOptions.map(option => (
                            <SelectItem
                              key={option.key}
                              textValue={option.albumName}
                            >
                              <div className='flex flex-col gap-1'>
                                <span className='font-medium text-gray-900 dark:text-white'>
                                  {option.albumName}
                                </span>
                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                  {option.artistName} • {option.trackCount}{' '}
                                  tracks
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </Select>
                    </div>
                  )}

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Input
                      label='Title'
                      placeholder='Quick link title'
                      value={formState.title}
                      onValueChange={value => {
                        handleFormChange('title', value);
                        setIsTitleDirty(true);
                      }}
                      isRequired
                    />
                    <Input
                      label='Slug'
                      placeholder='custom-slug'
                      value={formState.slug}
                      onValueChange={value => {
                        handleFormChange('slug', slugify(value));
                        setIsSlugDirty(true);
                      }}
                      description='/quick/slug'
                    />
                  </div>

                  <Textarea
                    label='Description (optional)'
                    placeholder='Add a short description or call to action'
                    value={formState.description}
                    onValueChange={value =>
                      handleFormChange('description', value)
                    }
                    minRows={2}
                    maxRows={4}
                  />

                  <div className='flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3'>
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium text-gray-900 dark:text-white'>
                        Mark as pre-release
                      </span>
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        Indicate that this link leads to upcoming content.
                      </span>
                    </div>
                    <Switch
                      isSelected={formState.isPrerelease}
                      onValueChange={value =>
                        handleFormChange('isPrerelease', value)
                      }
                      aria-label='Toggle prerelease'
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant='light' onPress={() => onClose()}>
                    Cancel
                  </Button>
                  <Button
                    color='primary'
                    isLoading={isSaving}
                    onPress={submitForm}
                  >
                    {editingId ? 'Save Changes' : 'Create Link'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </CardBody>
    </Card>
  );
}

function AnalyticsBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex items-center gap-1 rounded-full border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300'>
      <BoltIcon className='w-3.5 h-3.5 text-blue-500' />
      <span className='font-medium'>{label}:</span>
      <span>{value.toLocaleString()}</span>
    </div>
  );
}
