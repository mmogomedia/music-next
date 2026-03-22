import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Card,
  CardBody,
  Select,
  SelectItem,
  Switch,
  Progress,
  Tooltip,
} from '@heroui/react';
import { FButton, FInput, FTextarea, FChip } from '@/components/ui';
import {
  DocumentTextIcon,
  PhotoIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import AIIcon from '@/components/icons/AIIcon';
import { cn } from '@/lib/utils/cn';
import ImageUpload from '@/components/ui/ImageUpload';
import { constructFileUrl } from '@/lib/url-utils';
import { uploadImageToR2 } from '@/lib/image-upload';
import ArtistLookupSelect, { ArtistOption } from './ArtistLookupSelect';
import { SUPPORTED_LANGUAGES } from '@/lib/config/languages';
import {
  calculateTrackCompletion,
  getCompletionColor,
  getCompletionStatus,
} from '@/lib/utils/track-completion';
import {
  calculateTrackCompletionDynamic,
  type TrackCompletionRule,
} from '@/lib/utils/track-completion-dynamic';
import {
  COMPLETION_CATEGORIES,
  type WeightCategory,
} from '@/lib/config/track-completion-config';

interface GenreOption {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  colorHex?: string | null;
}

export interface TrackEditorValues {
  id?: string;
  title: string;
  artist?: string; // Legacy field - kept for backward compatibility
  primaryArtistIds?: string[]; // Array of ArtistProfile IDs (ordered)
  featuredArtistIds?: string[]; // Array of ArtistProfile IDs
  album?: string;
  genre?: string;
  genreId?: string;
  composer?: string;
  year?: number;
  releaseDate?: string;
  bpm?: number;
  isrc?: string;
  description?: string;
  lyrics?: string;
  language?: string; // ISO 639-1 code (e.g., "en", "zu", "xh", "fr", "pt", "sn", "nd", "other" or "auto")
  isPublic: boolean;
  isDownloadable: boolean;
  isExplicit: boolean;
  copyrightInfo?: string;
  licenseType?: string;
  distributionRights?: string;
  albumArtwork?: string;
  attributes: string[];
  mood: string[];
  streamingLinks?: { platform: string; url: string }[];
}

export interface TrackEditorProps {
  initialValues?: Partial<TrackEditorValues>;
  mode?: 'create' | 'edit';
  isSaving?: boolean;
  wrapInCard?: boolean;
  showFooterActions?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  onCancel?: () => void;
  onSubmit: (_values: TrackEditorValues) => Promise<boolean> | boolean;
  onStateChange?: (_state: {
    isUploadingArtwork: boolean;
    canSubmit: boolean;
  }) => void;
}

const STREAMING_PLATFORMS = [
  {
    id: 'spotify',
    name: 'Spotify',
    placeholder: 'https://open.spotify.com/track/...',
  },
  {
    id: 'apple_music',
    name: 'Apple Music',
    placeholder: 'https://music.apple.com/...',
  },
  {
    id: 'youtube_music',
    name: 'YouTube Music',
    placeholder: 'https://music.youtube.com/...',
  },
  {
    id: 'amazon_music',
    name: 'Amazon Music',
    placeholder: 'https://music.amazon.com/...',
  },
  {
    id: 'deezer',
    name: 'Deezer',
    placeholder: 'https://www.deezer.com/track/...',
  },
  {
    id: 'tidal',
    name: 'Tidal',
    placeholder: 'https://tidal.com/browse/track/...',
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    placeholder: 'https://soundcloud.com/...',
  },
  {
    id: 'audiomack',
    name: 'Audiomack',
    placeholder: 'https://audiomack.com/song/...',
  },
  {
    id: 'boomplay',
    name: 'Boomplay',
    placeholder: 'https://www.boomplay.com/songs/...',
  },
];

const LICENSE_TYPES = [
  'All Rights Reserved',
  'Creative Commons BY',
  'Creative Commons BY-SA',
  'Creative Commons BY-NC',
  'Creative Commons BY-NC-SA',
  'Creative Commons BY-ND',
  'Creative Commons BY-NC-ND',
  'Public Domain',
];

const PRIMARY_TABS = [
  {
    key: 'basic',
    label: 'Basic Info',
    icon: (cls: string) => <DocumentTextIcon className={cls} />,
  },
  {
    key: 'story',
    label: 'Story & AI',
    icon: (cls: string) => <AIIcon className={cls} size={16} />,
  },
] as const;

const OVERFLOW_TABS = [
  {
    key: 'artwork',
    label: 'Artwork',
    icon: (cls: string) => <PhotoIcon className={cls} />,
  },
  {
    key: 'streaming',
    label: 'Streaming',
    icon: (cls: string) => <LinkIcon className={cls} />,
  },
  {
    key: 'metadata',
    label: 'Metadata',
    icon: (cls: string) => <CalendarIcon className={cls} />,
  },
  {
    key: 'privacy',
    label: 'Visibility',
    icon: (cls: string) => <ShieldCheckIcon className={cls} />,
  },
  {
    key: 'copyright',
    label: 'Copyright',
    icon: (cls: string) => <DocumentTextIcon className={cls} />,
  },
] as const;

const DEFAULT_VALUES: TrackEditorValues = {
  title: '',
  artist: '',
  primaryArtistIds: [],
  featuredArtistIds: [],
  album: '',
  genre: '',
  genreId: undefined,
  composer: '',
  year: new Date().getFullYear(),
  releaseDate: '',
  bpm: undefined,
  isrc: '',
  description: '',
  lyrics: '',
  language: 'auto', // Default to auto-detect
  isPublic: true,
  isDownloadable: false,
  isExplicit: false,
  copyrightInfo: '',
  licenseType: 'All Rights Reserved',
  distributionRights: '',
  albumArtwork: '',
  attributes: [],
  mood: [],
  streamingLinks: [],
};

const normalizeStringArray = (
  arr?: string[] | null,
  { unique = true }: { unique?: boolean } = {}
): string[] => {
  if (!Array.isArray(arr)) {
    return [];
  }

  const cleaned = arr
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  if (!unique) {
    return cleaned;
  }

  const seen = new Set<string>();
  const result: string[] = [];
  cleaned.forEach(item => {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  });
  return result;
};

const TrackEditor = forwardRef<HTMLFormElement, TrackEditorProps>(
  (
    {
      initialValues,
      mode = 'edit',
      isSaving = false,
      wrapInCard = true,
      showFooterActions = true,
      submitLabel,
      cancelLabel,
      className,
      onCancel,
      onSubmit,
      onStateChange,
    },
    ref
  ) => {
    const formRef = useRef<HTMLFormElement>(null);

    // Forward the form ref
    useImperativeHandle(ref, () => formRef.current as HTMLFormElement);
    const [values, setValues] = useState<TrackEditorValues>({
      ...DEFAULT_VALUES,
      ...initialValues,
      attributes: normalizeStringArray(initialValues?.attributes ?? []),
      mood: normalizeStringArray(initialValues?.mood ?? []),
      streamingLinks: initialValues?.streamingLinks ?? [],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [genres, setGenres] = useState<GenreOption[]>([]);
    const [loadingGenres, setLoadingGenres] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);

    // AI lyrics processing state
    const [attributeInput, setAttributeInput] = useState('');
    const [moodInput, setMoodInput] = useState('');
    const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
    const [metadataError, setMetadataError] = useState<string | null>(null);
    const [generationNotice, setGenerationNotice] = useState<string | null>(
      null
    );
    const [metadataRateLimitInfo, setMetadataRateLimitInfo] = useState<{
      remaining: number;
      resetAt: string;
    } | null>(null);

    // Track recently added items for visual feedback
    const [recentlyAddedAttribute, setRecentlyAddedAttribute] = useState<
      string | null
    >(null);
    const [recentlyAddedMood, setRecentlyAddedMood] = useState<string | null>(
      null
    );

    const [customPlatformName, setCustomPlatformName] = useState('');
    const [customPlatformUrl, setCustomPlatformUrl] = useState('');

    const getStreamingUrl = (platformId: string) =>
      values.streamingLinks?.find(l => l.platform === platformId)?.url ?? '';

    const setStreamingUrl = (platformId: string, url: string) => {
      const existing = (values.streamingLinks ?? []).filter(
        l => l.platform !== platformId
      );
      const updated = url.trim()
        ? [...existing, { platform: platformId, url: url.trim() }]
        : existing;
      updateValue('streamingLinks', updated);
    };

    const customLinks =
      values.streamingLinks?.filter(
        l => !STREAMING_PLATFORMS.some(p => p.id === l.platform)
      ) ?? [];

    const addCustomLink = () => {
      if (!customPlatformName.trim() || !customPlatformUrl.trim()) return;
      const existing = (values.streamingLinks ?? []).filter(
        l =>
          l.platform !== customPlatformName.toLowerCase().replace(/\s+/g, '_')
      );
      updateValue('streamingLinks', [
        ...existing,
        {
          platform: customPlatformName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_'),
          url: customPlatformUrl.trim(),
        },
      ]);
      setCustomPlatformName('');
      setCustomPlatformUrl('');
    };

    const removeCustomLink = (platformId: string) => {
      updateValue(
        'streamingLinks',
        (values.streamingLinks ?? []).filter(l => l.platform !== platformId)
      );
    };

    // Completion tracking - fetch rules dynamically
    const [completionRules, setCompletionRules] = useState<
      TrackCompletionRule[]
    >([]);
    const [rulesLoaded, setRulesLoaded] = useState(false);

    useEffect(() => {
      const fetchRules = async () => {
        try {
          const res = await fetch('/api/track-completion-rules');
          const data = await res.json();
          setCompletionRules(data.rules || []);
        } catch (error) {
          console.warn(
            'Failed to fetch completion rules, using defaults:',
            error
          );
          setCompletionRules([]);
        } finally {
          setRulesLoaded(true);
        }
      };
      fetchRules();
    }, []);

    const [showCompletionBreakdown, setShowCompletionBreakdown] =
      useState(false);
    const [completionBreakdown, setCompletionBreakdown] = useState(
      calculateTrackCompletion(values)
    );

    // Update completion when values or rules change
    useEffect(() => {
      if (!rulesLoaded) return;

      const updateCompletion = async () => {
        if (completionRules && completionRules.length > 0) {
          const breakdown = await calculateTrackCompletionDynamic(values);
          setCompletionBreakdown(breakdown);
        } else {
          // Fallback to static calculation
          setCompletionBreakdown(calculateTrackCompletion(values));
        }
      };
      updateCompletion();
    }, [values, completionRules, rulesLoaded]);

    // Tab management for navigation
    const [selectedTab, setSelectedTab] = useState<string>('basic');
    const [overflowOpen, setOverflowOpen] = useState(false);
    const overflowRef = useRef<HTMLDivElement>(null);

    const effectiveSubmitLabel = useMemo(() => {
      if (submitLabel) return submitLabel;
      return mode === 'create' ? 'Create Track' : 'Save Changes';
    }, [mode, submitLabel]);

    useEffect(() => {
      setValues(prev => ({
        ...prev,
        ...initialValues,
        attributes: normalizeStringArray(
          (initialValues?.attributes as string[] | undefined) ?? prev.attributes
        ),
        mood: normalizeStringArray(
          (initialValues?.mood as string[] | undefined) ?? prev.mood
        ),
      }));
    }, [initialValues]);

    useEffect(() => {
      let isMounted = true;
      const fetchGenres = async () => {
        try {
          setLoadingGenres(true);
          const response = await fetch('/api/genres');
          if (!response.ok) return;
          const data = await response.json();
          if (isMounted && Array.isArray(data.genres)) {
            setGenres(data.genres);
          }
        } catch (error) {
          console.error('Error fetching genres:', error);
        } finally {
          if (isMounted) {
            setLoadingGenres(false);
          }
        }
      };

      fetchGenres();
      return () => {
        isMounted = false;
      };
    }, []);

    const updateValue = (key: keyof TrackEditorValues, value: any) => {
      setValues(prev => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }

      if (key === 'isPublic' && !value) {
        setValues(prev => ({ ...prev, isDownloadable: false }));
      }
    };

    const addListValue = (
      field: 'attributes' | 'mood',
      rawValue: string
    ): void => {
      const cleaned = rawValue.trim();
      if (!cleaned) return;

      const existing =
        field === 'attributes'
          ? normalizeStringArray(values.attributes)
          : normalizeStringArray(values.mood);

      const alreadyExists = existing.some(
        item => item.toLowerCase() === cleaned.toLowerCase()
      );
      if (alreadyExists) return;

      updateValue(field, [...existing, cleaned]);
    };

    const removeListValue = (field: 'attributes' | 'mood', value: string) => {
      const existing =
        field === 'attributes'
          ? normalizeStringArray(values.attributes)
          : normalizeStringArray(values.mood);
      updateValue(
        field,
        existing.filter(item => item.toLowerCase() !== value.toLowerCase())
      );
    };

    const handleAddAttribute = () => {
      if (!attributeInput.trim()) return;
      const value = attributeInput.trim();
      addListValue('attributes', value);
      setAttributeInput('');
      // Visual feedback: highlight the newly added attribute
      setRecentlyAddedAttribute(value);
      setTimeout(() => setRecentlyAddedAttribute(null), 2000); // Clear after 2 seconds
    };

    const handleAddMood = () => {
      if (!moodInput.trim()) return;
      const value = moodInput.trim();
      addListValue('mood', value);
      setMoodInput('');
      // Visual feedback: highlight the newly added mood
      setRecentlyAddedMood(value);
      setTimeout(() => setRecentlyAddedMood(null), 2000); // Clear after 2 seconds
    };

    const handleAttributeKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleAddAttribute();
      }
    };

    const handleMoodKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleAddMood();
      }
    };

    const handleArtworkUpload = async (file: File | null) => {
      if (!file) {
        updateValue('albumArtwork', '');
        return;
      }
      setIsUploadingArtwork(true);
      setErrors(prev => {
        const next = { ...prev };
        delete next.artwork;
        return next;
      });

      try {
        const key = await uploadImageToR2(file);
        updateValue('albumArtwork', key);
      } catch (error) {
        console.error('Artwork upload error:', error);
        setErrors(prev => ({
          ...prev,
          artwork:
            error instanceof Error ? error.message : 'Failed to upload artwork',
        }));
      } finally {
        setIsUploadingArtwork(false);
      }
    };

    // Handle AI metadata generation (description, attributes, mood)
    const handleGenerateMetadata = async () => {
      if (!values.lyrics || values.lyrics.trim().length === 0) {
        setMetadataError(
          'Add lyrics on the Metadata tab to generate metadata.'
        );
        setSelectedTab('metadata');
        return;
      }

      setIsGeneratingMetadata(true);
      setMetadataError(null);
      setGenerationNotice(null);

      try {
        const response = await fetch('/api/tracks/derive-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lyrics: values.lyrics,
            language: values.language === 'auto' ? undefined : values.language,
            description: values.description,
            attributes: values.attributes,
            mood: values.mood,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            setMetadataError(
              data.message ||
                'You have reached the metadata generation limit. Try again later.'
            );
            setMetadataRateLimitInfo(data.rateLimit || null);
          } else {
            setMetadataError(
              data.message || data.error || 'Failed to generate metadata'
            );
          }
          return;
        }

        setMetadataRateLimitInfo(data.rateLimit || null);

        if (
          data.detectedLanguage &&
          (!values.language || values.language === 'auto')
        ) {
          updateValue('language', data.detectedLanguage);
        }

        if (data.description) {
          updateValue('description', data.description.trim());
        }

        if (Array.isArray(data.attributes)) {
          updateValue('attributes', normalizeStringArray(data.attributes));
        }

        if (Array.isArray(data.mood)) {
          updateValue('mood', normalizeStringArray(data.mood));
        }

        setGenerationNotice(
          'Metadata generated. Feel free to refine anything.'
        );
      } catch (error) {
        console.error('Error generating metadata:', error);
        setMetadataError(
          error instanceof Error ? error.message : 'Failed to generate metadata'
        );
      } finally {
        setIsGeneratingMetadata(false);
      }
    };

    const handleCreateArtist = async (
      name: string
    ): Promise<ArtistOption | null> => {
      try {
        const response = await fetch('/api/artists/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.artist;
        } else if (response.status === 409) {
          // Artist already exists
          const data = await response.json();

          // If it's unclaimed and can be claimed, offer to claim it
          if (data.canClaim && data.artist) {
            const shouldClaim = window.confirm(
              `An unclaimed artist profile "${data.artist.name}" already exists. Would you like to claim it?`
            );

            if (shouldClaim) {
              // Claim the existing profile
              const claimResponse = await fetch('/api/artists/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artistId: data.artist.id }),
              });

              if (claimResponse.ok) {
                // Fetch the claimed artist details
                const fetchResponse = await fetch(
                  `/api/artists/by-ids?ids=${data.artist.id}`
                );
                if (fetchResponse.ok) {
                  const fetchData = await fetchResponse.json();
                  return fetchData.artists[0] || null;
                }
              } else {
                const claimError = await claimResponse.json();
                alert(claimError.error || 'Failed to claim artist profile');
                return null;
              }
            } else {
              // User chose not to claim, return null
              return null;
            }
          } else if (data.artist) {
            // Artist exists but can't be claimed, just return it
            const fetchResponse = await fetch(
              `/api/artists/by-ids?ids=${data.artist.id}`
            );
            if (fetchResponse.ok) {
              const fetchData = await fetchResponse.json();
              return fetchData.artists[0] || null;
            }
          }
        }
        return null;
      } catch (error) {
        console.error('Error creating artist:', error);
        return null;
      }
    };

    const validate = (): boolean => {
      const validationErrors: Record<string, string> = {};

      if (!values.title.trim()) {
        validationErrors.title = 'Title is required';
      }

      // Require at least one primary artist
      if (!values.primaryArtistIds || values.primaryArtistIds.length === 0) {
        validationErrors.primaryArtists =
          'At least one primary artist is required';
      }

      // Check for duplicates between primary and featured
      if (values.primaryArtistIds && values.featuredArtistIds) {
        const duplicates = values.primaryArtistIds.filter(id =>
          values.featuredArtistIds?.includes(id)
        );
        if (duplicates.length > 0) {
          validationErrors.artists =
            'An artist cannot be both primary and featured';
        }
      }

      if (
        values.year &&
        (values.year < 1900 || values.year > new Date().getFullYear() + 1)
      ) {
        validationErrors.year = 'Please enter a valid year';
      }

      if (values.bpm && (values.bpm < 60 || values.bpm > 200)) {
        validationErrors.bpm = 'BPM should be between 60 and 200';
      }

      if (values.isrc && !/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(values.isrc)) {
        validationErrors.isrc =
          'ISRC format: 2 letters, 3 alphanumeric, 7 digits (e.g., USRC17607839)';
      }

      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      if (!validate()) return;
      setIsSubmitting(true);
      try {
        const result = await onSubmit(values);
        if (!result) {
          setErrors(prev => ({
            ...prev,
            submit: 'Failed to save track. Please try again.',
          }));
        }
      } catch (error) {
        console.error('Track save error:', error);
        setErrors(prev => ({
          ...prev,
          submit: 'An unexpected error occurred.',
        }));
      } finally {
        setIsSubmitting(false);
      }
    };

    // Notify parent of state changes
    useEffect(() => {
      if (onStateChange) {
        onStateChange({
          isUploadingArtwork,
          canSubmit:
            values.title.trim().length > 0 &&
            (values.primaryArtistIds?.length || 0) > 0,
        });
      }
    }, [
      isUploadingArtwork,
      values.title,
      values.primaryArtistIds,
      onStateChange,
    ]);

    // Close overflow menu on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (
          overflowRef.current &&
          !overflowRef.current.contains(e.target as Node)
        ) {
          setOverflowOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const FormContent = (
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`space-y-6 ${className ?? ''}`}
      >
        {/* Completion Display */}
        <div className='space-y-3 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Track Completion
              </span>
              <FChip
                size='xs'
                color={
                  getCompletionColor(completionBreakdown.percentage) as
                    | 'success'
                    | 'warning'
                    | 'danger'
                    | 'default'
                }
                variant='flat'
              >
                {completionBreakdown.percentage}%
              </FChip>
              <span className='hidden sm:inline text-xs text-gray-400 dark:text-gray-500'>
                {getCompletionStatus(completionBreakdown.percentage)}
              </span>
            </div>
            <FButton
              variant='ghost'
              size='sm'
              onPress={() =>
                setShowCompletionBreakdown(!showCompletionBreakdown)
              }
              endContent={
                showCompletionBreakdown ? (
                  <ChevronUpIcon className='w-3.5 h-3.5' />
                ) : (
                  <ChevronDownIcon className='w-3.5 h-3.5' />
                )
              }
            >
              {showCompletionBreakdown ? 'Hide' : 'Details'}
            </FButton>
          </div>

          <Progress
            value={completionBreakdown.percentage}
            color={getCompletionColor(completionBreakdown.percentage)}
            className='w-full'
            aria-label='Track completion progress'
            showValueLabel={false}
          />

          {showCompletionBreakdown && (
            <div className='space-y-3 pt-2 border-t border-gray-200 dark:border-slate-700'>
              {Object.entries(COMPLETION_CATEGORIES).map(
                ([category, config]) => {
                  const categoryData =
                    completionBreakdown.byCategory[category as WeightCategory];
                  return (
                    <div key={category} className='space-y-2'>
                      <div className='flex items-center justify-between text-xs mb-1'>
                        <span className='font-medium text-gray-700 dark:text-gray-300'>
                          {config.name} ({config.totalWeight}%)
                        </span>
                        <span className='text-gray-500 dark:text-gray-400'>
                          {categoryData.completed}/{categoryData.total} (
                          {categoryData.percentage}%)
                        </span>
                      </div>
                      <Progress
                        value={categoryData.percentage}
                        color={getCompletionColor(categoryData.percentage)}
                        size='sm'
                        className='w-full mb-2'
                        aria-label={`${config.name} completion`}
                        showValueLabel={false}
                      />
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                        {completionBreakdown.fields
                          .filter(f => f.category === category)
                          .map(field => (
                            <div
                              key={field.field}
                              className='flex items-center gap-2 text-xs p-2 rounded bg-white dark:bg-slate-700'
                            >
                              {field.completed ? (
                                <CheckCircleIcon className='w-4 h-4 text-green-600 flex-shrink-0' />
                              ) : (
                                <XCircleIcon className='w-4 h-4 text-gray-400 flex-shrink-0' />
                              )}
                              <span className='flex-1 text-gray-700 dark:text-gray-300'>
                                {field.label}
                              </span>
                              <span className='text-gray-500 dark:text-gray-400'>
                                {field.weight}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* ── Custom tab bar ─────────────────────────────────── */}
        <div className='border-b border-gray-100 dark:border-slate-700'>
          <div className='flex items-center'>
            {/* Primary tabs */}
            {PRIMARY_TABS.map(tab => (
              <button
                key={tab.key}
                type='button'
                onClick={() => setSelectedTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                  selectedTab === tab.key
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-200 dark:hover:border-slate-600'
                )}
              >
                {tab.icon('w-4 h-4')}
                {tab.label}
              </button>
            ))}

            {/* 3-dot overflow */}
            <div className='relative ml-auto' ref={overflowRef}>
              <button
                type='button'
                onClick={() => setOverflowOpen(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  OVERFLOW_TABS.some(t => t.key === selectedTab)
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                {(() => {
                  const active = OVERFLOW_TABS.find(t => t.key === selectedTab);
                  return active ? (
                    <>
                      {active.icon('w-4 h-4')}
                      <span>{active.label}</span>
                    </>
                  ) : null;
                })()}
                <EllipsisHorizontalIcon className='w-5 h-5' />
              </button>

              {overflowOpen && (
                <div className='absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 z-50'>
                  {OVERFLOW_TABS.map(tab => (
                    <button
                      key={tab.key}
                      type='button'
                      onClick={() => {
                        setSelectedTab(tab.key);
                        setOverflowOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                        selectedTab === tab.key
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      )}
                    >
                      {tab.icon('w-4 h-4')}
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab content ─────────────────────────────────────── */}
        <div>
          {selectedTab === 'basic' && (
            <div className='space-y-4 pt-4'>
              <div className='space-y-4'>
                <FInput
                  label='Title *'
                  placeholder='Enter track title'
                  value={values.title}
                  onValueChange={value => updateValue('title', value)}
                  isInvalid={!!errors.title}
                  errorMessage={errors.title}
                  isRequired
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <ArtistLookupSelect
                    label='Primary Artists *'
                    selectedArtistIds={values.primaryArtistIds || []}
                    onSelectionChange={ids =>
                      updateValue('primaryArtistIds', ids)
                    }
                    placeholder='Search for primary artists...'
                    isRequired
                    allowMultiple
                    showOrder
                    excludeArtistIds={values.featuredArtistIds || []}
                    onCreateNew={handleCreateArtist}
                  />

                  <ArtistLookupSelect
                    label='Featured Artists'
                    selectedArtistIds={values.featuredArtistIds || []}
                    onSelectionChange={ids =>
                      updateValue('featuredArtistIds', ids)
                    }
                    placeholder='Search for featured artists...'
                    allowMultiple
                    excludeArtistIds={values.primaryArtistIds || []}
                    onCreateNew={handleCreateArtist}
                  />
                </div>

                {errors.primaryArtists && (
                  <p className='text-sm text-red-600 dark:text-red-400'>
                    {errors.primaryArtists}
                  </p>
                )}
                {errors.artists && (
                  <p className='text-sm text-red-600 dark:text-red-400'>
                    {errors.artists}
                  </p>
                )}

                <FInput
                  label='Album'
                  placeholder='Album name'
                  value={values.album || ''}
                  onValueChange={value => updateValue('album', value)}
                />

                <Select
                  label='Genre'
                  placeholder={
                    loadingGenres ? 'Loading genres...' : 'Select genre'
                  }
                  selectedKeys={values.genreId ? [values.genreId] : []}
                  onSelectionChange={keys => {
                    const selectedId = Array.from(keys)[0] as
                      | string
                      | undefined;
                    const genreOption = genres.find(g => g.id === selectedId);
                    updateValue('genreId', selectedId || undefined);
                    updateValue('genre', genreOption?.name || '');
                  }}
                  isLoading={loadingGenres}
                  disabled={loadingGenres}
                >
                  {genres.map(genre => (
                    <SelectItem key={genre.id}>{genre.name}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {selectedTab === 'story' && (
            <div className='space-y-6 pt-4'>
              {/* AI banner */}
              <div className='rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-violet-100 dark:border-violet-900/50 px-4 py-3.5 flex items-center gap-3'>
                <div className='rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 p-1.5 flex-shrink-0'>
                  <AIIcon className='w-4 h-4 text-white' size={16} />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-semibold text-violet-900 dark:text-violet-200'>
                    AI Metadata Assistant
                  </p>
                  <p className='text-xs text-violet-700 dark:text-violet-400 mt-0.5 leading-relaxed'>
                    Paste your lyrics and click &quot;Generate&quot; — the AI
                    will write a description and suggest attributes &amp; mood
                    tags. Supports English, Zulu, Xhosa, Shona, Ndebele, and
                    more.
                  </p>
                </div>
              </div>

              {/* ── Lyrics — full width ─────────────────────────────────── */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <label
                    htmlFor='lyrics-textarea'
                    className='text-sm font-semibold text-gray-700 dark:text-gray-200'
                  >
                    Lyrics
                  </label>
                  <div className='flex items-center gap-2'>
                    {values.lyrics && values.lyrics.length > 0 && (
                      <FChip size='xs' color='default' variant='flat'>
                        {values.lyrics.length.toLocaleString()} chars
                      </FChip>
                    )}
                    <Tooltip
                      content={
                        <div className='max-w-xs space-y-1 p-1 text-xs'>
                          <p>Paste the full lyrics for the best AI results.</p>
                        </div>
                      }
                      placement='top'
                      showArrow
                    >
                      <span>
                        <InformationCircleIcon className='w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help' />
                      </span>
                    </Tooltip>
                  </div>
                </div>
                <FTextarea
                  id='lyrics-textarea'
                  placeholder='Paste your song lyrics here...'
                  value={values.lyrics || ''}
                  onValueChange={value => updateValue('lyrics', value)}
                  minRows={18}
                  className='font-mono text-sm'
                />
              </div>

              {/* ── Generate button + feedback ──────────────────────────── */}
              <div className='space-y-2'>
                <FButton
                  variant='primary'
                  startContent={
                    !isGeneratingMetadata && (
                      <AIIcon className='w-4 h-4' size={16} />
                    )
                  }
                  onPress={handleGenerateMetadata}
                  isLoading={isGeneratingMetadata}
                  isDisabled={
                    !values.lyrics || values.lyrics.trim().length === 0
                  }
                  className='w-full'
                >
                  {isGeneratingMetadata
                    ? 'Generating metadata…'
                    : 'Generate Description & Attributes'}
                </FButton>

                {metadataRateLimitInfo && (
                  <p className='text-xs text-gray-400 dark:text-gray-500 text-center'>
                    {metadataRateLimitInfo.remaining} AI requests remaining this
                    hour
                  </p>
                )}
                {metadataError && (
                  <div className='flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-700 dark:text-rose-400'>
                    <XCircleIcon className='w-4 h-4 flex-shrink-0 mt-0.5' />
                    <span className='flex-1 leading-relaxed'>
                      {metadataError}
                    </span>
                    <FButton
                      size='sm'
                      variant='danger-ghost'
                      onPress={handleGenerateMetadata}
                      isDisabled={isGeneratingMetadata}
                      className='flex-shrink-0'
                    >
                      Retry
                    </FButton>
                  </div>
                )}
                {generationNotice && (
                  <div className='flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300'>
                    <CheckCircleIcon className='w-4 h-4 flex-shrink-0' />
                    {generationNotice}
                  </div>
                )}
              </div>

              {/* ── Divider ─────────────────────────────────────────────── */}
              <div className='border-t border-gray-100 dark:border-slate-700/60' />

              {/* ── Metadata: Description | Attributes | Mood ───────────── */}
              <div className='grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5'>
                {/* Description */}
                <div className='space-y-1.5'>
                  <label
                    htmlFor='description-textarea'
                    className='text-sm font-semibold text-gray-700 dark:text-gray-200'
                  >
                    Description
                  </label>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    AI-generated from lyrics, or write your own.
                  </p>
                  <FTextarea
                    id='description-textarea'
                    placeholder='A compelling description of your track…'
                    value={values.description || ''}
                    onValueChange={value => updateValue('description', value)}
                    minRows={7}
                  />
                </div>

                {/* Attributes */}
                <div className='space-y-2.5 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 p-3.5'>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <p className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                        Attributes
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        Themes &amp; topics that define the song
                      </p>
                    </div>
                    <FChip
                      size='xs'
                      color={
                        values.attributes.length >= 3 ? 'success' : 'default'
                      }
                      variant='flat'
                    >
                      {values.attributes.length}/3+
                    </FChip>
                  </div>
                  <div className='space-y-2'>
                    <FInput
                      placeholder='e.g. women empowerment'
                      value={attributeInput}
                      onValueChange={setAttributeInput}
                      onKeyDown={handleAttributeKeyDown}
                      size='sm'
                    />
                    <FButton
                      variant='primary-outline'
                      onPress={handleAddAttribute}
                      isDisabled={!attributeInput.trim()}
                      size='sm'
                      className='w-full'
                    >
                      Add
                    </FButton>
                  </div>
                  <div className='flex flex-wrap gap-1.5 min-h-[40px] content-start'>
                    {(values.attributes || []).length === 0 ? (
                      <p className='text-xs text-gray-400 dark:text-gray-500 italic w-full text-center pt-2'>
                        Add 3 or more for best AI results.
                      </p>
                    ) : (
                      (values.attributes || []).map(attribute => (
                        <FChip
                          key={attribute}
                          variant='flat'
                          color='primary'
                          onClose={() =>
                            removeListValue('attributes', attribute)
                          }
                          size='sm'
                          className={`transition-all duration-300 ${
                            recentlyAddedAttribute === attribute
                              ? 'ring-2 ring-primary-500 ring-offset-1 scale-105'
                              : ''
                          }`}
                        >
                          {attribute}
                        </FChip>
                      ))
                    )}
                  </div>
                </div>

                {/* Mood */}
                <div className='space-y-2.5 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 p-3.5'>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <p className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                        Mood
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        Shown as discovery chips in AI chat
                      </p>
                    </div>
                    <FChip
                      size='xs'
                      color={values.mood.length > 0 ? 'info' : 'default'}
                      variant='flat'
                    >
                      {values.mood.length} tag
                      {values.mood.length !== 1 ? 's' : ''}
                    </FChip>
                  </div>
                  <div className='space-y-2'>
                    <FInput
                      placeholder='e.g. uplifting, chill'
                      value={moodInput}
                      onValueChange={setMoodInput}
                      onKeyDown={handleMoodKeyDown}
                      size='sm'
                    />
                    <FButton
                      variant='primary-outline'
                      onPress={handleAddMood}
                      isDisabled={!moodInput.trim()}
                      size='sm'
                      className='w-full'
                    >
                      Add
                    </FButton>
                  </div>
                  <div className='flex flex-wrap gap-1.5 min-h-[40px] content-start'>
                    {(values.mood || []).length === 0 ? (
                      <p className='text-xs text-gray-400 dark:text-gray-500 italic w-full text-center pt-2'>
                        No mood tags yet.
                      </p>
                    ) : (
                      (values.mood || []).map(mood => (
                        <FChip
                          key={mood}
                          variant='flat'
                          color='info'
                          onClose={() => removeListValue('mood', mood)}
                          size='sm'
                          className={`transition-all duration-300 ${
                            recentlyAddedMood === mood
                              ? 'ring-2 ring-sky-500 ring-offset-1 scale-105'
                              : ''
                          }`}
                        >
                          {mood}
                        </FChip>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'artwork' && (
            <div className='pt-4'>
              <div className='flex flex-col lg:flex-row gap-8 items-start'>
                {/* Left: artwork display + upload controls */}
                <div className='flex-shrink-0 w-full lg:w-80 space-y-3'>
                  <ImageUpload
                    label=''
                    preview={
                      values.albumArtwork
                        ? constructFileUrl(values.albumArtwork)
                        : undefined
                    }
                    onImageChange={handleArtworkUpload}
                    onError={error =>
                      setErrors(prev => ({ ...prev, artwork: error }))
                    }
                    disabled={isUploadingArtwork || isSubmitting || isSaving}
                    aspectRatio={1}
                    minWidth={500}
                    minHeight={500}
                    maxWidth={2000}
                    maxHeight={2000}
                    maxFileSize={5}
                    previewSize='xl'
                    showCropButton
                    showRemoveButton
                  />
                  {isUploadingArtwork && (
                    <p className='text-xs text-primary-600 dark:text-primary-400 animate-pulse text-center'>
                      Uploading artwork…
                    </p>
                  )}
                  {errors.artwork && (
                    <div className='flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400'>
                      <XCircleIcon className='w-4 h-4 flex-shrink-0' />
                      {errors.artwork}
                    </div>
                  )}
                </div>

                {/* Right: info + specs */}
                <div className='flex-1 space-y-5 min-w-0'>
                  <div>
                    <h3 className='text-sm font-semibold text-gray-800 dark:text-gray-100'>
                      Album Artwork
                    </h3>
                    <p className='mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed'>
                      A high-quality square image used across the platform and
                      in streaming services. Upload the best version you have —
                      you can crop it after selecting.
                    </p>
                  </div>

                  {/* Specs table */}
                  <div className='rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 overflow-hidden'>
                    {[
                      { label: 'Format', value: 'JPG or PNG' },
                      { label: 'Minimum', value: '500 × 500 px' },
                      { label: 'Recommended', value: '1000 × 1000 px' },
                      { label: 'Max file size', value: '5 MB' },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className='px-4 py-2.5 flex items-center justify-between text-sm border-b border-gray-100 dark:border-slate-700/60 last:border-b-0'
                      >
                        <span className='text-gray-500 dark:text-gray-400'>
                          {label}
                        </span>
                        <span className='font-medium text-gray-700 dark:text-gray-200'>
                          {value}
                        </span>
                      </div>
                    ))}
                    <div className='px-4 py-2.5 flex items-center justify-between text-sm'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        Aspect ratio
                      </span>
                      <FChip size='xs' color='primary' variant='flat'>
                        1:1 square
                      </FChip>
                    </div>
                  </div>

                  {/* Pro tip */}
                  <div className='flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40'>
                    <span className='text-amber-500 text-base leading-none mt-0.5'>
                      💡
                    </span>
                    <p className='text-xs text-amber-700 dark:text-amber-300 leading-relaxed'>
                      Use <strong>1000 × 1000 px or larger</strong> for the best
                      appearance on Apple Music, Spotify, and other streaming
                      services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'streaming' && (
            <div className='space-y-5 pt-4'>
              {/* Header */}
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
                    Streaming &amp; Distribution Links
                  </h3>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                    Add links where fans can stream or buy your track on other
                    platforms.
                  </p>
                </div>
                {(values.streamingLinks?.length ?? 0) > 0 && (
                  <FChip size='sm' color='success' variant='flat'>
                    {values.streamingLinks?.length} link
                    {values.streamingLinks?.length !== 1 ? 's' : ''}
                  </FChip>
                )}
              </div>

              {/* Known platforms */}
              <div className='space-y-2'>
                {STREAMING_PLATFORMS.map(platform => (
                  <div
                    key={platform.id}
                    className='flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60'
                  >
                    <div className='w-28 flex-shrink-0'>
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                        {platform.name}
                      </span>
                    </div>
                    <FInput
                      placeholder={platform.placeholder}
                      value={getStreamingUrl(platform.id)}
                      onValueChange={url => setStreamingUrl(platform.id, url)}
                      size='sm'
                      classNames={{ base: 'flex-1' }}
                      startContent={
                        <LinkIcon className='w-3.5 h-3.5 text-gray-400 flex-shrink-0' />
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Custom platforms */}
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500'>
                  Custom Platforms
                </p>

                {customLinks.length > 0 && (
                  <div className='space-y-2'>
                    {customLinks.map(link => (
                      <div
                        key={link.platform}
                        className='flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60'
                      >
                        <div className='w-28 flex-shrink-0'>
                          <span className='text-sm font-medium text-gray-700 dark:text-gray-200 capitalize'>
                            {link.platform.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className='flex-1 text-sm text-gray-500 dark:text-gray-400 truncate'>
                          {link.url}
                        </div>
                        <button
                          type='button'
                          onClick={() => removeCustomLink(link.platform)}
                          className='flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors'
                          aria-label={`Remove ${link.platform}`}
                        >
                          <TrashIcon className='w-4 h-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add custom row */}
                <div className='rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-3.5 space-y-2.5'>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Add a platform not in the list above:
                  </p>
                  <div className='flex gap-2'>
                    <FInput
                      placeholder='Platform name'
                      value={customPlatformName}
                      onValueChange={setCustomPlatformName}
                      size='sm'
                      classNames={{ base: 'w-36 flex-shrink-0' }}
                    />
                    <FInput
                      placeholder='https://...'
                      value={customPlatformUrl}
                      onValueChange={setCustomPlatformUrl}
                      size='sm'
                      classNames={{ base: 'flex-1' }}
                      startContent={
                        <LinkIcon className='w-3.5 h-3.5 text-gray-400 flex-shrink-0' />
                      }
                    />
                    <FButton
                      variant='primary-outline'
                      size='sm'
                      isIconOnly
                      onPress={addCustomLink}
                      isDisabled={
                        !customPlatformName.trim() || !customPlatformUrl.trim()
                      }
                      aria-label='Add custom platform'
                    >
                      <PlusIcon className='w-4 h-4' />
                    </FButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'metadata' && (
            <div className='space-y-4 pt-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <FInput
                  label='Composer'
                  placeholder='Composer name'
                  value={values.composer || ''}
                  onValueChange={value => updateValue('composer', value)}
                />

                <FInput
                  type='number'
                  label='Year'
                  placeholder='2024'
                  value={values.year?.toString() || ''}
                  onValueChange={value =>
                    updateValue('year', value ? parseInt(value) : undefined)
                  }
                  isInvalid={!!errors.year}
                  errorMessage={errors.year}
                />

                <FInput
                  type='date'
                  label='Release Date'
                  value={values.releaseDate || ''}
                  onValueChange={value => updateValue('releaseDate', value)}
                />

                <FInput
                  type='number'
                  label='BPM'
                  placeholder='120'
                  value={values.bpm?.toString() || ''}
                  onValueChange={value =>
                    updateValue('bpm', value ? parseInt(value) : undefined)
                  }
                  isInvalid={!!errors.bpm}
                  errorMessage={errors.bpm}
                />

                <FInput
                  label='ISRC'
                  placeholder='USRC17607839'
                  value={values.isrc || ''}
                  onValueChange={value => updateValue('isrc', value)}
                  isInvalid={!!errors.isrc}
                  errorMessage={errors.isrc}
                  description='International Standard Recording Code'
                />

                <Select
                  label='Language'
                  placeholder='Select language'
                  selectedKeys={values.language ? [values.language] : ['auto']}
                  onSelectionChange={keys => {
                    const selected = Array.from(keys)[0] as string;
                    updateValue('language', selected || 'auto');
                  }}
                  description='Primary language of the track'
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.code}>
                      {lang.nativeName || lang.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {selectedTab === 'privacy' && (
            <div className='space-y-4 pt-4'>
              <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                <div className='flex items-center gap-3'>
                  {values.isPublic ? (
                    <EyeIcon className='w-5 h-5 text-green-600' />
                  ) : (
                    <EyeSlashIcon className='w-5 h-5 text-gray-400' />
                  )}
                  <div>
                    <p className='font-medium text-gray-900 dark:text-white'>
                      Public Track
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {values.isPublic
                        ? 'Visible to everyone'
                        : 'Only visible to you'}
                    </p>
                  </div>
                </div>
                <Switch
                  isSelected={values.isPublic}
                  onValueChange={value => updateValue('isPublic', value)}
                />
              </div>

              <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <ArrowDownTrayIcon className='w-5 h-5 text-blue-600' />
                  <div>
                    <p className='font-medium text-gray-900 dark:text-white'>
                      Allow Downloads
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {values.isDownloadable
                        ? 'Users can download this track'
                        : 'Download disabled'}
                    </p>
                  </div>
                </div>
                <Switch
                  isSelected={values.isDownloadable}
                  onValueChange={value => updateValue('isDownloadable', value)}
                  isDisabled={!values.isPublic}
                />
              </div>

              <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <ExclamationTriangleIcon className='w-5 h-5 text-orange-600' />
                  <div>
                    <p className='font-medium text-gray-900 dark:text-white'>
                      Explicit Content
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Mark if this track contains explicit content
                    </p>
                  </div>
                </div>
                <Switch
                  isSelected={values.isExplicit}
                  onValueChange={value => updateValue('isExplicit', value)}
                />
              </div>
            </div>
          )}

          {selectedTab === 'copyright' && (
            <div className='space-y-4 pt-4'>
              <Select
                label='License Type'
                placeholder='Select license type'
                selectedKeys={values.licenseType ? [values.licenseType] : []}
                onSelectionChange={keys => {
                  const selected = Array.from(keys)[0] as string | undefined;
                  updateValue('licenseType', selected || '');
                }}
              >
                {LICENSE_TYPES.map(license => (
                  <SelectItem key={license}>{license}</SelectItem>
                ))}
              </Select>

              <FTextarea
                label='Copyright Information'
                placeholder='© 2024 Artist Name. All rights reserved.'
                value={values.copyrightInfo || ''}
                onValueChange={value => updateValue('copyrightInfo', value)}
                minRows={2}
              />

              <FTextarea
                label='Distribution Rights'
                placeholder='Describe distribution rights and restrictions...'
                value={values.distributionRights || ''}
                onValueChange={value =>
                  updateValue('distributionRights', value)
                }
                minRows={3}
              />
            </div>
          )}
        </div>

        {errors.submit && (
          <div className='p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <p className='text-red-600 dark:text-red-400 text-sm'>
              {errors.submit}
            </p>
          </div>
        )}

        {showFooterActions && (
          <div className='flex gap-3 justify-end'>
            {onCancel && (
              <FButton
                variant='ghost'
                onPress={onCancel}
                isDisabled={isSubmitting || isSaving}
              >
                {cancelLabel || 'Cancel'}
              </FButton>
            )}
            <FButton
              variant='primary'
              type='submit'
              isLoading={isSubmitting || isSaving || isUploadingArtwork}
              isDisabled={!values.title.trim() || isUploadingArtwork}
            >
              {isUploadingArtwork
                ? 'Uploading Artwork...'
                : effectiveSubmitLabel}
            </FButton>
          </div>
        )}
      </form>
    );

    if (!wrapInCard) {
      return FormContent;
    }

    return (
      <Card>
        <CardBody className='p-6'>{FormContent}</CardBody>
      </Card>
    );
  }
);

TrackEditor.displayName = 'TrackEditor';

export default TrackEditor;
