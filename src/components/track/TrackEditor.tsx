import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Switch,
  Tab,
  Tabs,
  Textarea,
  Progress,
  Chip,
  Tooltip,
} from '@heroui/react';
import {
  DocumentTextIcon,
  PhotoIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
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

    const FormContent = (
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`space-y-6 ${className ?? ''}`}
      >
        {/* Completion Display */}
        <div className='space-y-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Track Completion
                  </span>
                  <Chip
                    size='sm'
                    color={getCompletionColor(completionBreakdown.percentage)}
                    variant='flat'
                  >
                    {completionBreakdown.percentage}%
                  </Chip>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    {getCompletionStatus(completionBreakdown.percentage)}
                  </span>
                </div>
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  {completionBreakdown.isComplete
                    ? 'Track is complete!'
                    : `${100 - completionBreakdown.percentage}% remaining to complete`}
                </p>
              </div>
            </div>
            <Button
              size='sm'
              variant='light'
              onPress={() =>
                setShowCompletionBreakdown(!showCompletionBreakdown)
              }
              endContent={
                showCompletionBreakdown ? (
                  <ChevronUpIcon className='w-4 h-4' />
                ) : (
                  <ChevronDownIcon className='w-4 h-4' />
                )
              }
            >
              {showCompletionBreakdown ? 'Hide' : 'Show'} Details
            </Button>
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

        <Tabs
          aria-label='Track editor sections'
          className='w-full'
          selectedKey={selectedTab}
          onSelectionChange={key => setSelectedTab(key as string)}
        >
          <Tab
            key='basic'
            title={
              <div className='flex items-center gap-2'>
                <DocumentTextIcon className='w-4 h-4' />
                <span>Basic Info</span>
              </div>
            }
          >
            <div className='space-y-4 pt-4'>
              <div className='space-y-4'>
                <Input
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

                <Input
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
          </Tab>

          <Tab
            key='story'
            title={
              <div className='flex items-center gap-2'>
                <SparklesIcon className='w-4 h-4' />
                <span>Story & AI Tools</span>
              </div>
            }
          >
            <div className='space-y-6 pt-4'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Left Column: Lyrics */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <label
                      htmlFor='lyrics-textarea'
                      className='text-sm font-medium text-gray-700 dark:text-gray-300'
                    >
                      Lyrics
                    </label>
                    <Tooltip
                      content={
                        <div className='max-w-xs space-y-2 p-1'>
                          <p className='font-medium'>AI Metadata Assistant</p>
                          <p className='text-sm'>
                            Paste your lyrics here, then use the AI tools to
                            generate description, attributes, and mood tags. The
                            AI will auto-detect and translate languages when
                            needed.
                          </p>
                          <p className='text-xs opacity-90 mt-2'>
                            Supported languages: English, Zulu, Xhosa,
                            Afrikaans, French, Portuguese, Shona, Ndebele, and
                            more.
                          </p>
                        </div>
                      }
                      placement='top'
                      showArrow
                    >
                      <Button
                        isIconOnly
                        size='sm'
                        variant='light'
                        className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      >
                        <InformationCircleIcon className='w-5 h-5' />
                      </Button>
                    </Tooltip>
                  </div>
                  <Textarea
                    id='lyrics-textarea'
                    placeholder='Paste your song lyrics here...'
                    value={values.lyrics || ''}
                    onValueChange={value => updateValue('lyrics', value)}
                    rows={12}
                    className='font-mono text-sm'
                  />
                  <div className='flex items-center gap-2'>
                    <Button
                      size='sm'
                      variant='flat'
                      color='secondary'
                      startContent={<SparklesIcon className='w-4 h-4' />}
                      onPress={handleGenerateMetadata}
                      isLoading={isGeneratingMetadata}
                      isDisabled={
                        !values.lyrics || values.lyrics.trim().length === 0
                      }
                      className='flex-1'
                    >
                      {isGeneratingMetadata
                        ? 'Generating...'
                        : 'Generate Description & Attributes'}
                    </Button>
                  </div>
                  {metadataRateLimitInfo && (
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      {metadataRateLimitInfo.remaining} AI requests remaining
                      this hour
                    </p>
                  )}
                  {metadataError && (
                    <div className='flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400'>
                      <XCircleIcon className='w-4 h-4 flex-shrink-0' />
                      <span className='flex-1'>{metadataError}</span>
                      <Button
                        size='sm'
                        variant='light'
                        color='danger'
                        onPress={handleGenerateMetadata}
                        isDisabled={isGeneratingMetadata}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                  {generationNotice && (
                    <div className='p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-300'>
                      {generationNotice}
                    </div>
                  )}
                </div>

                {/* Right Column: Description, Attributes, Mood */}
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <label
                      htmlFor='description-textarea'
                      className='text-sm font-medium text-gray-700 dark:text-gray-300'
                    >
                      Description
                    </label>
                    <Textarea
                      id='description-textarea'
                      placeholder='Track description (auto-generated from lyrics or write your own)...'
                      value={values.description || ''}
                      onValueChange={value => updateValue('description', value)}
                      rows={4}
                    />
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between flex-wrap gap-2'>
                      <div>
                        <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                          Attributes
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          Themes & topics
                        </p>
                      </div>
                      <Button
                        variant='flat'
                        color='primary'
                        className='sm:w-auto'
                        onPress={handleAddAttribute}
                        isDisabled={!attributeInput.trim()}
                        size='sm'
                      >
                        Add Attribute
                      </Button>
                    </div>
                    <Input
                      placeholder='e.g. women empowerment'
                      value={attributeInput}
                      onValueChange={setAttributeInput}
                      onKeyDown={handleAttributeKeyDown}
                      className='flex-1'
                      size='sm'
                    />
                    <div className='flex flex-wrap gap-2 min-h-[60px] p-3 border border-gray-200 dark:border-slate-700 rounded-lg'>
                      {(values.attributes || []).length === 0 && (
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          Add at least 3 attributes to capture the song&apos;s
                          themes.
                        </p>
                      )}
                      {(values.attributes || []).map(attribute => (
                        <Chip
                          key={attribute}
                          variant='flat'
                          color='primary'
                          onClose={() =>
                            removeListValue('attributes', attribute)
                          }
                          size='sm'
                          className={`transition-all duration-300 ${
                            recentlyAddedAttribute === attribute
                              ? 'ring-2 ring-primary-500 ring-offset-2 scale-105 animate-pulse'
                              : ''
                          }`}
                        >
                          {attribute}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between flex-wrap gap-2'>
                      <div>
                        <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                          Mood
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          Displayed as pills in AI
                        </p>
                      </div>
                      <Button
                        variant='flat'
                        color='primary'
                        className='sm:w-auto'
                        onPress={handleAddMood}
                        isDisabled={!moodInput.trim()}
                        size='sm'
                      >
                        Add Mood
                      </Button>
                    </div>
                    <Input
                      placeholder='e.g. uplifting'
                      value={moodInput}
                      onValueChange={setMoodInput}
                      onKeyDown={handleMoodKeyDown}
                      className='flex-1'
                      size='sm'
                    />
                    <div className='flex flex-wrap gap-2 min-h-[60px] p-3 border border-gray-200 dark:border-slate-700 rounded-lg'>
                      {(values.mood || []).length === 0 && (
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          Add mood tags to help users discover your track.
                        </p>
                      )}
                      {(values.mood || []).map(mood => (
                        <Chip
                          key={mood}
                          variant='flat'
                          color='secondary'
                          onClose={() => removeListValue('mood', mood)}
                          size='sm'
                          className={`transition-all duration-300 ${
                            recentlyAddedMood === mood
                              ? 'ring-2 ring-secondary-500 ring-offset-2 scale-105 animate-pulse'
                              : ''
                          }`}
                        >
                          {mood}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tab>

          <Tab
            key='artwork'
            title={
              <div className='flex items-center gap-2'>
                <PhotoIcon className='w-4 h-4' />
                <span>Artwork</span>
              </div>
            }
          >
            <div className='pt-4'>
              <div className='flex items-start gap-4'>
                <div className='flex-shrink-0'>
                  <ImageUpload
                    label=''
                    preview={
                      values.albumArtwork
                        ? constructFileUrl(values.albumArtwork)
                        : undefined
                    }
                    onImageChange={handleArtworkUpload}
                    onError={error =>
                      setErrors(prev => ({
                        ...prev,
                        artwork: error,
                      }))
                    }
                    disabled={isUploadingArtwork || isSubmitting || isSaving}
                    aspectRatio={1}
                    minWidth={500}
                    minHeight={500}
                    maxWidth={2000}
                    maxHeight={2000}
                    maxFileSize={5}
                    previewSize='md'
                    showCropButton
                    showRemoveButton
                  />
                </div>
                <div className='flex-1 space-y-2'>
                  <div>
                    <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Album Artwork
                    </div>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                      Recommended: 1000x1000px or larger. Max 5MB.
                    </p>
                  </div>
                  {errors.artwork && (
                    <p className='text-sm text-red-600 dark:text-red-400'>
                      {errors.artwork}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Tab>

          <Tab
            key='metadata'
            title={
              <div className='flex items-center gap-2'>
                <CalendarIcon className='w-4 h-4' />
                <span>Metadata</span>
              </div>
            }
          >
            <div className='space-y-4 pt-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <Input
                  label='Composer'
                  placeholder='Composer name'
                  value={values.composer || ''}
                  onValueChange={value => updateValue('composer', value)}
                />

                <Input
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

                <Input
                  type='date'
                  label='Release Date'
                  value={values.releaseDate || ''}
                  onValueChange={value => updateValue('releaseDate', value)}
                />

                <Input
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

                <Input
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
          </Tab>

          <Tab
            key='privacy'
            title={
              <div className='flex items-center gap-2'>
                <ShieldCheckIcon className='w-4 h-4' />
                <span>Visibility</span>
              </div>
            }
          >
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
          </Tab>

          <Tab
            key='copyright'
            title={
              <div className='flex items-center gap-2'>
                <DocumentTextIcon className='w-4 h-4' />
                <span>Copyright</span>
              </div>
            }
          >
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

              <Textarea
                label='Copyright Information'
                placeholder='© 2024 Artist Name. All rights reserved.'
                value={values.copyrightInfo || ''}
                onValueChange={value => updateValue('copyrightInfo', value)}
                rows={2}
              />

              <Textarea
                label='Distribution Rights'
                placeholder='Describe distribution rights and restrictions...'
                value={values.distributionRights || ''}
                onValueChange={value =>
                  updateValue('distributionRights', value)
                }
                rows={3}
              />
            </div>
          </Tab>
        </Tabs>

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
              <Button
                variant='light'
                onPress={onCancel}
                disabled={isSubmitting || isSaving}
              >
                {cancelLabel || 'Cancel'}
              </Button>
            )}
            <Button
              type='submit'
              color='primary'
              isLoading={isSubmitting || isSaving || isUploadingArtwork}
              disabled={!values.title.trim() || isUploadingArtwork}
            >
              {isUploadingArtwork
                ? 'Uploading Artwork...'
                : effectiveSubmitLabel}
            </Button>
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
