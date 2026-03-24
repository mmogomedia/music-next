'use client';

import { useEffect, useMemo, useState } from 'react';
import { Switch, SelectItem } from '@heroui/react';
import {
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  LinkIcon,
  PencilSquareIcon,
  PlayIcon,
  PlusIcon,
  PowerIcon,
  TagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/Toast';
import {
  FCard,
  FButton,
  FChip,
  FEmptyState,
  FStat,
  FInput,
  FTextarea,
  FSelect,
  FModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FSpinner,
} from '@/components/ui';
import ArtistDisplay from '@/components/track/ArtistDisplay';
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

function formatCount(n?: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function QuickLinksManager({
  tracks,
  profile,
}: QuickLinksManagerProps) {
  const { showToast } = useToast();
  const [quickLinks, setQuickLinks] = useState<QuickLinkResponse[]>([]);
  const [loading, setLoading] = useState(true);
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
      try {
        const res = await fetch('/api/dashboard/quick-links');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Failed to load quick links');
        }
        const body = await res.json();
        setQuickLinks(body.data || []);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to load quick links',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuickLinks();
  }, [showToast]);

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
      showToast(
        err instanceof Error ? err.message : 'Failed to refresh quick links',
        'error'
      );
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
      showToast(
        err instanceof Error ? err.message : 'Failed to copy link',
        'error'
      );
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

  const totalVisits = quickLinks.reduce((s, l) => s + l.totalVisits, 0);
  const totalPlays = quickLinks.reduce((s, l) => s + l.playCount, 0);
  const activeCount = quickLinks.filter(l => l.isActive).length;

  return (
    <div className='space-y-4'>
      {/* Stats row */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <FCard padding='sm'>
          <FStat
            label='Total Links'
            value={quickLinks.length}
            icon={LinkIcon}
            color='purple'
          />
        </FCard>
        <FCard padding='sm'>
          <FStat
            label='Active Links'
            value={activeCount}
            icon={CheckCircleIcon}
            color='emerald'
          />
        </FCard>
        <FCard padding='sm'>
          <FStat
            label='Total Visits'
            value={formatCount(totalVisits)}
            icon={EyeIcon}
            color='blue'
          />
        </FCard>
        <FCard padding='sm'>
          <FStat
            label='Total Plays'
            value={formatCount(totalPlays)}
            icon={PlayIcon}
            color='amber'
          />
        </FCard>
      </div>

      {/* Main card */}
      <FCard
        padding='none'
        title='Quick Links'
        action={
          <FButton
            variant='primary'
            size='sm'
            startContent={<PlusIcon className='w-4 h-4' />}
            onPress={() => openCreateModal('TRACK')}
          >
            Create Link
          </FButton>
        }
      >
        {loading ? (
          <div className='flex justify-center py-12'>
            <FSpinner size='lg' />
          </div>
        ) : quickLinks.length === 0 ? (
          <div className='px-5 py-8'>
            <FEmptyState
              icon={LinkIcon}
              title='No quick links yet'
              description='Create your first quick link to share a track, album, or your artist profile directly with listeners.'
              action={{
                label: 'Create Link',
                onPress: () => openCreateModal('TRACK'),
              }}
            />
          </div>
        ) : (
          <div className='divide-y divide-gray-50 dark:divide-slate-700/50'>
            {quickLinks.map(link => (
              <div
                key={link.id}
                className='group px-5 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors'
              >
                {/* Left icon slot */}
                <div className='flex-shrink-0 w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center'>
                  <LinkIcon className='w-4 h-4 text-blue-500' />
                </div>

                {/* Main content */}
                <div className='flex-1 min-w-0 space-y-0.5'>
                  {/* Row 1: title + type chip + prerelease chip */}
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
                      {link.title}
                    </span>
                    <FChip size='xs' color='primary' variant='flat'>
                      {QUICK_LINK_TYPE_LABELS[link.type]}
                    </FChip>
                    {link.isPrerelease && (
                      <FChip size='xs' color='warning' variant='flat'>
                        Pre-release
                      </FChip>
                    )}
                  </div>

                  {/* Row 2: slug + target */}
                  <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                    <TagIcon className='w-3 h-3 flex-shrink-0' />
                    <span>{link.slug}</span>
                    <span className='mx-1'>·</span>
                    <span className='truncate'>{renderTarget(link)}</span>
                  </div>

                  {/* Row 3: stats */}
                  <div className='flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500'>
                    <span className='flex items-center gap-1'>
                      <EyeIcon className='w-3 h-3' />
                      {link.totalVisits.toLocaleString()} visits
                    </span>
                    <span className='flex items-center gap-1'>
                      <PlayIcon className='w-3 h-3' />
                      {link.playCount.toLocaleString()} plays
                    </span>
                    <span className='flex items-center gap-1'>
                      <BoltIcon className='w-3 h-3' />
                      {link.downloadCount.toLocaleString()} dl
                    </span>
                    <span className='flex items-center gap-1'>
                      <BoltIcon className='w-3 h-3' />
                      {link.shareCount.toLocaleString()} shares
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className='flex-shrink-0 flex items-center gap-1'>
                  <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <FButton
                      isIconOnly
                      size='sm'
                      variant='ghost'
                      onPress={() =>
                        window.open(`/quick/${link.slug}`, '_blank')
                      }
                      aria-label='Preview'
                    >
                      <EyeIcon className='w-4 h-4' />
                    </FButton>
                    <FButton
                      isIconOnly
                      size='sm'
                      variant='ghost'
                      onPress={() => copyLink(link.slug)}
                      aria-label='Copy link'
                    >
                      <ClipboardDocumentIcon className='w-4 h-4' />
                    </FButton>
                    <FButton
                      isIconOnly
                      size='sm'
                      variant='ghost'
                      onPress={() => openEditModal(link)}
                      aria-label='Edit'
                    >
                      <PencilSquareIcon className='w-4 h-4' />
                    </FButton>
                    <FButton
                      isIconOnly
                      size='sm'
                      variant={link.isActive ? 'ghost' : 'primary-ghost'}
                      onPress={() => toggleActive(link)}
                      aria-label='Toggle status'
                    >
                      <PowerIcon className='w-4 h-4' />
                    </FButton>
                    <FButton
                      isIconOnly
                      size='sm'
                      variant='danger-ghost'
                      onPress={() => deleteLink(link)}
                      aria-label='Delete'
                    >
                      <TrashIcon className='w-4 h-4' />
                    </FButton>
                  </div>
                  <FChip
                    size='xs'
                    color={link.isActive ? 'success' : 'default'}
                    variant='dot'
                  >
                    {link.isActive ? 'Active' : 'Off'}
                  </FChip>
                </div>
              </div>
            ))}
          </div>
        )}
      </FCard>

      {/* Modal */}
      <FModal
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
                {/* Type picker */}
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Quick Link Type
                  </p>
                  <div className='grid grid-cols-3 gap-2'>
                    {(['TRACK', 'ARTIST', 'ALBUM'] as QuickLinkTypeValue[]).map(
                      option => (
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
                      )
                    )}
                  </div>
                </div>

                {/* Target selector */}
                {formState.type === 'TRACK' && (
                  <FSelect
                    label='Track'
                    placeholder='Select a track'
                    selectedKeys={formState.trackId ? [formState.trackId] : []}
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
                            <ArtistDisplay track={track} />
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </FSelect>
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
                  <FSelect
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
                        handleFormChange('albumArtistId', option.albumArtistId);
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
                              {option.artistName} • {option.trackCount} tracks
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </FSelect>
                )}

                {/* Title + Slug */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FInput
                    label='Title'
                    placeholder='Quick link title'
                    value={formState.title}
                    onValueChange={value => {
                      handleFormChange('title', value);
                      setIsTitleDirty(true);
                    }}
                    isRequired
                    className='flex-1'
                  />
                  <FInput
                    label='Slug'
                    placeholder='custom-slug'
                    value={formState.slug}
                    onValueChange={value => {
                      handleFormChange('slug', slugify(value));
                      setIsSlugDirty(true);
                    }}
                    description='/quick/slug'
                    className='flex-1'
                  />
                </div>

                {/* Description */}
                <FTextarea
                  label='Description (optional)'
                  placeholder='Add a short description or call to action'
                  value={formState.description}
                  onValueChange={value =>
                    handleFormChange('description', value)
                  }
                  minRows={2}
                  maxRows={4}
                />

                {/* Pre-release toggle */}
                <div className='flex items-center justify-between rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3'>
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
                <FButton variant='ghost' onPress={() => onClose()}>
                  Cancel
                </FButton>
                <FButton
                  variant='primary'
                  isLoading={isSaving}
                  onPress={submitForm}
                >
                  {editingId ? 'Save Changes' : 'Create Link'}
                </FButton>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </FModal>
    </div>
  );
}
