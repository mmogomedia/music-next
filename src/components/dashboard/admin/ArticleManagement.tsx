'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  lazy,
  Suspense,
  useMemo,
} from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  FolderIcon,
  InformationCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import type {
  Article,
  ArticleCluster,
  ClusterWithCount,
  CreateArticleInput,
  CreateClusterInput,
} from '@/types/articles';
import { useImageUpload } from '@/lib/image-upload';
import { constructFileUrl } from '@/lib/url-utils';
import { getToolBySlug } from '@/lib/tools/registry';
import { ToolSummaryCard } from '@/components/tools/ToolSummaryCard';

const ArticleEditor = lazy(() => import('@/components/articles/ArticleEditor'));
const ArticleCreatorPage = lazy(() => import('./ArticleCreatorPage'));

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const INPUT =
  'w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

const LABEL =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL}>
        {label}
        {required && <span className='text-red-500 ml-0.5'>*</span>}
        {hint && (
          <span className='ml-2 text-gray-400 normal-case font-normal tracking-normal'>
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function KeywordInput({
  keywords,
  onChange,
}: {
  keywords: string[];
  onChange: (_kw: string[]) => void;
}) {
  const [input, setInput] = useState('');
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const kw = input.trim().replace(/,$/, '');
      if (kw && !keywords.includes(kw)) onChange([...keywords, kw]);
      setInput('');
    }
  };
  return (
    <div className='flex flex-wrap gap-1.5 p-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 min-h-[38px]'>
      {keywords.map(kw => (
        <span
          key={kw}
          className='flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium'
        >
          {kw}
          <button
            type='button'
            onClick={() => onChange(keywords.filter(k => k !== kw))}
            className='hover:text-red-500 transition-colors'
          >
            <XMarkIcon className='w-3 h-3' />
          </button>
        </span>
      ))}
      <input
        type='text'
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className='flex-1 min-w-[120px] outline-none bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400'
        placeholder={keywords.length === 0 ? 'Type keyword + Enter' : ''}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    DRAFT: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400',
    PUBLISHED:
      'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    ARCHIVED: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cls[status] ?? cls.DRAFT}`}
    >
      {status}
    </span>
  );
}

// ── Inline section help (collapsible) ────────────────────────────────────────

function HelpBlock({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type='button'
        onClick={() => setOpen(v => !v)}
        className='inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-medium transition-colors'
      >
        <InformationCircleIcon className='w-3.5 h-3.5' />
        {open ? 'Hide guidance' : 'Guidance'}
      </button>
      {open && (
        <div className='mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-200 leading-relaxed space-y-1.5'>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Full article writing guide ────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
function ArticleHelpGuide() {
  function GuideSection({
    num,
    title,
    children,
  }: {
    num: number;
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <span className='w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0'>
            {num}
          </span>
          <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
            {title}
          </h3>
        </div>
        <div className='ml-7 space-y-1.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed'>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300 leading-relaxed'>
        This guide explains every field so you can create SEO-optimised articles
        that help Flemoji rank for music industry keywords. All new articles are
        saved as <strong>Draft</strong> — publish them from the article list
        when ready.
      </div>

      <GuideSection num={1} title='Title & Slug'>
        <p>
          <strong className='text-gray-800 dark:text-gray-200'>Title</strong> —
          The article headline. Include your primary keyword naturally. Keep
          under 60 characters for best search results.
          <br />
          <span className='italic'>
            Example: &ldquo;How Much Does Spotify Pay Per Stream&rdquo;
          </span>
        </p>
        <p>
          <strong className='text-gray-800 dark:text-gray-200'>Slug</strong> —
          Auto-generated URL path (editable). Keep it short and keyword-rich.
          <br />
          <span className='italic'>
            Example:{' '}
            <code className='bg-gray-100 dark:bg-slate-700 px-1 rounded'>
              /articles/spotify-pay-per-stream
            </code>
          </span>
        </p>
      </GuideSection>

      <GuideSection num={2} title='Cluster & Role'>
        <p>
          <strong className='text-gray-800 dark:text-gray-200'>Cluster</strong>{' '}
          — The topic group this article belongs to (e.g., &ldquo;Music
          Royalties for Independent Artists&rdquo;). Clusters build topical
          authority — Google rewards sites that cover a topic comprehensively.
        </p>
        <p>
          <strong className='text-gray-800 dark:text-gray-200'>
            PILLAR role
          </strong>{' '}
          — The main comprehensive guide for the cluster. Aim for 2,000–3,000
          words. One per cluster. Links out to all spoke articles.
          <br />
          <span className='italic'>
            Example: &ldquo;Complete Guide to Music Royalties&rdquo;
          </span>
        </p>
        <p>
          <strong className='text-gray-800 dark:text-gray-200'>
            SPOKE role
          </strong>{' '}
          — A focused article targeting one specific search intent. Aim for
          1,000–1,500 words. Always links back to the pillar article.
          <br />
          <span className='italic'>
            Example: &ldquo;How Much Does Spotify Pay Per Stream&rdquo;
          </span>
        </p>
      </GuideSection>

      <GuideSection num={3} title='Excerpt'>
        <p>
          Appears as a subtitle on the article page and in search result
          previews. Write 1–2 sentences. Include your primary keyword.
        </p>
        <p className='italic'>
          Example: &ldquo;Learn exactly how much Spotify pays per stream and how
          to calculate your royalty earnings as an independent artist.&rdquo;
        </p>
      </GuideSection>

      <GuideSection num={4} title='Cover Image'>
        <p>
          Shown at the top of the article and as the social share image (OG
          image). Recommended size: <strong>1200 × 630 px</strong>. Also appears
          on the Timeline feed when the article is published.
        </p>
      </GuideSection>

      <GuideSection num={5} title='SEO Fields'>
        <p>
          <strong className='text-gray-800 dark:text-gray-200'>
            Primary Keyword
          </strong>{' '}
          — The single most important search phrase for this article (e.g.,{' '}
          <code className='bg-gray-100 dark:bg-slate-700 px-1 rounded'>
            spotify pay per stream
          </code>
          ). Place it in: the title, the first 100 words of your article, and at
          least one H2 heading.
        </p>
        <p>
          <strong className='text-gray-800 dark:text-gray-200'>
            Secondary Keywords
          </strong>{' '}
          — Related phrases and long-tail variations (e.g., &ldquo;spotify
          royalties per stream&rdquo;, &ldquo;how much spotify pays
          artists&rdquo;). Use them naturally throughout the body.
        </p>
        <p>
          <strong className='text-gray-800 dark:text-gray-200'>
            SEO Title
          </strong>{' '}
          — What Google shows in search results. 55–60 characters max. Defaults
          to the article title if left blank.
        </p>
        <p>
          <strong className='text-gray-800 dark:text-gray-200'>
            Meta Description
          </strong>{' '}
          — The snippet below your title in search results. 150–160 characters.
          Include the primary keyword and a clear benefit statement.
          <br />
          <span className='italic'>
            Example: &ldquo;Discover exactly how much Spotify pays per stream in
            2025 and what it means for independent artists.&rdquo;
          </span>
        </p>
      </GuideSection>

      <GuideSection num={6} title='Internal Links'>
        <p>
          Cross-linking between articles is critical for SEO. Each article
          should link to:
        </p>
        <ul className='list-disc list-inside space-y-0.5 ml-1'>
          <li>
            The{' '}
            <strong className='text-gray-800 dark:text-gray-200'>PILLAR</strong>{' '}
            article (from every spoke)
          </li>
          <li>
            <strong className='text-gray-800 dark:text-gray-200'>
              2–3 related spoke
            </strong>{' '}
            articles
          </li>
        </ul>
        <p>
          These appear in a &ldquo;See Also&rdquo; section at the bottom of the
          published article. They help Google understand content relationships
          and keep readers on Flemoji longer.
        </p>
      </GuideSection>

      <GuideSection num={7} title='Call to Action'>
        <p>
          Appears at the bottom of every article as a branded card. Leave both
          fields blank to use the Flemoji default CTA. Customise when writing
          about a specific tool or campaign.
        </p>
        <p className='italic'>
          Example headline: &ldquo;Calculate your streaming royalties&rdquo;
          <br />
          Example link: flemoji.com/calculator
        </p>
      </GuideSection>

      <GuideSection num={8} title='Article Body'>
        <p>Recommended structure:</p>
        <ol className='list-decimal list-inside space-y-0.5 ml-1'>
          <li>
            <strong className='text-gray-800 dark:text-gray-200'>
              Introduction
            </strong>{' '}
            — Hook the reader. State what they&apos;ll learn. Include primary
            keyword in the first 100 words.
          </li>
          <li>
            <strong className='text-gray-800 dark:text-gray-200'>
              H2 Sections
            </strong>{' '}
            — 3–5 sections with keyword-rich headings. Each H2 should answer a
            reader question.
          </li>
          <li>
            <strong className='text-gray-800 dark:text-gray-200'>
              Data / Examples
            </strong>{' '}
            — Real numbers, comparisons, or step-by-step guides.
          </li>
          <li>
            <strong className='text-gray-800 dark:text-gray-200'>
              Conclusion
            </strong>{' '}
            — Summarise key points. Add an action step.
          </li>
        </ol>
        <p className='mt-1 font-medium text-gray-700 dark:text-gray-300'>
          Target length: PILLAR = 2,000–3,000 words · SPOKE = 1,000–1,500 words
        </p>
      </GuideSection>

      <GuideSection num={9} title='Publishing Workflow'>
        <p>
          Save as{' '}
          <strong className='text-gray-800 dark:text-gray-200'>Draft</strong> →
          Review the article in the list → Click the{' '}
          <strong className='text-gray-800 dark:text-gray-200'>
            ✓ publish button
          </strong>{' '}
          on the article row when it&apos;s ready.
        </p>
        <p>When published, the article automatically:</p>
        <ul className='list-disc list-inside space-y-0.5 ml-1'>
          <li>
            Goes live at{' '}
            <code className='bg-gray-100 dark:bg-slate-700 px-1 rounded'>
              /articles/your-slug
            </code>
          </li>
          <li>Appears on the Timeline feed</li>
          <li>Gets indexed for AI semantic search</li>
        </ul>
      </GuideSection>
    </div>
  );
}

// ── Article Form ──────────────────────────────────────────────────────────────

interface ArticleFormProps {
  initial?: Partial<Article>;
  clusters: ArticleCluster[];
  allArticles: Article[];
  prefillClusterId?: string;
  onSave: (_data: CreateArticleInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

// ── Cover image upload field ───────────────────────────────────────────────────

function CoverImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (_url: string) => void;
}) {
  const { uploadImage, isUploading, error, clearError } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    clearError();
    const key = await uploadImage(file);
    if (key) onChange(key);
  };

  const previewUrl = value ? constructFileUrl(value) : '';

  return (
    <div>
      {previewUrl ? (
        <div className='relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 group'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt='Cover preview'
            className='w-full h-44 object-cover'
          />
          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100'>
            <button
              type='button'
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
              className='px-3 py-1.5 text-xs font-semibold bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors shadow'
            >
              {isUploading ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type='button'
              onClick={() => onChange('')}
              className='px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow'
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type='button'
          disabled={isUploading}
          onClick={() => fileRef.current?.click()}
          className='w-full h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors bg-gray-50 dark:bg-slate-800/40'
        >
          {isUploading ? (
            <span className='text-sm'>Uploading…</span>
          ) : (
            <>
              <svg
                className='w-7 h-7'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <span className='text-sm font-medium'>Upload cover image</span>
              <span className='text-xs text-gray-400'>
                PNG, JPG, WebP — max 5 MB
              </span>
            </>
          )}
        </button>
      )}
      <input
        ref={fileRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {error && (
        <p className='mt-2 text-xs text-red-500 dark:text-red-400'>{error}</p>
      )}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function ArticleForm({
  initial,
  clusters,
  allArticles,
  prefillClusterId,
  onSave,
  onCancel,
  saving,
}: ArticleFormProps) {
  const DRAFT_KEY = `flemoji_article_draft_${initial?.id ?? 'new'}`;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(
    initial?.coverImageUrl ?? ''
  );
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(
    initial?.metaDescription ?? ''
  );
  const [keywords, setKeywords] = useState<string[]>(
    initial?.targetKeywords ?? []
  );
  const [primaryKeyword, setPrimaryKeyword] = useState(
    initial?.primaryKeyword ?? ''
  );
  const [internalLinks, setInternalLinks] = useState<string[]>(
    initial?.internalLinks ?? []
  );
  const [ctaText, setCtaText] = useState(initial?.ctaText ?? '');
  const [ctaLink, setCtaLink] = useState(initial?.ctaLink ?? '');
  const [clusterId, setClusterId] = useState(
    initial?.clusterId ?? prefillClusterId ?? ''
  );
  const [clusterRole, setClusterRole] = useState<'PILLAR' | 'SPOKE'>(
    initial?.clusterRole ?? 'SPOKE'
  );
  const [slugEdited, setSlugEdited] = useState(!!initial?.slug);
  const [editorKey, setEditorKey] = useState(0);
  const mdFileRef = useRef<HTMLInputElement>(null);

  const handleMdUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const text = (ev.target?.result as string) ?? '';
        // Extract first # heading as title if title field is empty
        const firstHeading = text.match(/^#\s+(.+)/m);
        if (firstHeading && !title) {
          const extracted = firstHeading[1].trim();
          setTitle(extracted);
          if (!slugEdited) setSlug(slugify(extracted));
        }
        // Strip the heading from body so it doesn't duplicate
        const bodyText = text.replace(/^#[^\n]+\n?/, '').trimStart();
        setBody(bodyText);
        setEditorKey(k => k + 1);
      };
      reader.readAsText(file);
      // Reset input so the same file can be re-uploaded
      e.target.value = '';
    },
    [title, slugEdited]
  );

  // ── Autosave ──────────────────────────────────────────────────────────────
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: check for a saved draft newer than the last server save
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { _savedAt: string };
      const savedAt = new Date(saved._savedAt);
      const serverAt = initial?.updatedAt ? new Date(initial.updatedAt) : null;
      if (!serverAt || savedAt > serverAt) setShowRestoreBanner(true);
    } catch {
      /* ignore corrupt data */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave — fires 5 s after the last field change
  useEffect(() => {
    if (!title && !body) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      const snapshot = {
        title,
        slug,
        body,
        excerpt,
        coverImageUrl,
        seoTitle,
        metaDescription,
        targetKeywords: keywords,
        primaryKeyword,
        internalLinks,
        ctaText,
        ctaLink,
        clusterId,
        clusterRole,
        _savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
      setLastSavedAt(new Date());
    }, 5000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    slug,
    body,
    excerpt,
    coverImageUrl,
    seoTitle,
    metaDescription,
    keywords,
    primaryKeyword,
    internalLinks,
    ctaText,
    ctaLink,
    clusterId,
    clusterRole,
  ]);

  const restoreDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.title !== undefined) setTitle(saved.title);
      if (saved.slug !== undefined) {
        setSlug(saved.slug);
        setSlugEdited(true);
      }
      if (saved.body !== undefined) setBody(saved.body);
      if (saved.excerpt !== undefined) setExcerpt(saved.excerpt ?? '');
      if (saved.coverImageUrl !== undefined)
        setCoverImageUrl(saved.coverImageUrl ?? '');
      if (saved.seoTitle !== undefined) setSeoTitle(saved.seoTitle ?? '');
      if (saved.metaDescription !== undefined)
        setMetaDescription(saved.metaDescription ?? '');
      if (saved.targetKeywords !== undefined)
        setKeywords(saved.targetKeywords ?? []);
      if (saved.primaryKeyword !== undefined)
        setPrimaryKeyword(saved.primaryKeyword ?? '');
      if (saved.internalLinks !== undefined)
        setInternalLinks(saved.internalLinks ?? []);
      if (saved.ctaText !== undefined) setCtaText(saved.ctaText ?? '');
      if (saved.ctaLink !== undefined) setCtaLink(saved.ctaLink ?? '');
      if (saved.clusterId !== undefined) setClusterId(saved.clusterId ?? '');
      if (saved.clusterRole !== undefined)
        setClusterRole(saved.clusterRole ?? 'SPOKE');
    } catch {
      /* ignore */
    }
    setShowRestoreBanner(false);
  }, [DRAFT_KEY]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setShowRestoreBanner(false);
  }, [DRAFT_KEY]);

  const handleSave = useCallback(async () => {
    await onSave(buildData());
    localStorage.removeItem(DRAFT_KEY);
    setLastSavedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    onSave,
    DRAFT_KEY,
    title,
    slug,
    body,
    excerpt,
    coverImageUrl,
    seoTitle,
    metaDescription,
    keywords,
    primaryKeyword,
    internalLinks,
    ctaText,
    ctaLink,
    clusterId,
    clusterRole,
  ]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!slugEdited && title) setSlug(slugify(title));
  }, [title, slugEdited]);

  // Articles available for internal-link selection (same cluster, excluding self)
  const linkCandidates = useMemo(() => {
    if (!clusterId) return [];
    return allArticles.filter(
      a => a.clusterId === clusterId && a.id !== initial?.id
    );
  }, [allArticles, clusterId, initial?.id]);

  const buildData = (): CreateArticleInput => ({
    title,
    slug,
    body,
    excerpt: excerpt || undefined,
    coverImageUrl: coverImageUrl || undefined,
    seoTitle: seoTitle || undefined,
    metaDescription: metaDescription || undefined,
    targetKeywords: keywords,
    primaryKeyword: primaryKeyword || undefined,
    internalLinks,
    ctaText: ctaText || undefined,
    ctaLink: ctaLink || undefined,
    clusterId: clusterId || undefined,
    clusterRole,
  });

  const canSubmit = !saving && !!title && !!body;

  return (
    <div className='space-y-5'>
      {/* Autosave restore banner */}
      {showRestoreBanner && (
        <div className='flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm'>
          <p className='text-amber-800 dark:text-amber-300 font-medium'>
            You have an unsaved draft from a previous session.
          </p>
          <div className='flex items-center gap-2 flex-shrink-0'>
            <button
              type='button'
              onClick={restoreDraft}
              className='px-3 py-1 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors'
            >
              Restore
            </button>
            <button
              type='button'
              onClick={discardDraft}
              className='px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-lg transition-colors'
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Title + Slug */}
      <Field label='Title' required>
        <input
          type='text'
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={INPUT}
          placeholder='Article title'
        />
      </Field>
      <Field label='Slug'>
        <input
          type='text'
          value={slug}
          onChange={e => {
            setSlug(e.target.value);
            setSlugEdited(true);
          }}
          className={`${INPUT} font-mono text-xs`}
          placeholder='auto-generated-from-title'
        />
      </Field>

      {/* Cluster + Role — visually linked */}
      <div className='space-y-3 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700'>
        <div className='flex items-center justify-between'>
          <p className='text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
            Cluster &amp; Role
          </p>
          <HelpBlock>
            <p>
              <strong>Cluster</strong> — Groups this article with related
              content for topical authority. Select one before setting the role.
            </p>
            <p>
              <strong>PILLAR</strong> — The main comprehensive guide
              (2,000–3,000 words). One per cluster. Links to all spoke articles.
              Example: &ldquo;Complete Guide to Music Royalties.&rdquo;
            </p>
            <p>
              <strong>SPOKE</strong> — Focused article targeting one search
              intent (1,000–1,500 words). Always link back to the pillar.
              Example: &ldquo;How Much Does Spotify Pay Per Stream.&rdquo;
            </p>
          </HelpBlock>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <Field label='Cluster'>
            <div className='relative'>
              <select
                value={clusterId}
                onChange={e => setClusterId(e.target.value)}
                className={`${INPUT} pr-8 appearance-none`}
              >
                <option value=''>No cluster</option>
                {clusters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className='w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
            </div>
          </Field>

          <Field label='Role in cluster'>
            <div className='grid grid-cols-2 gap-2 pt-0.5'>
              {(['SPOKE', 'PILLAR'] as const).map(role => (
                <button
                  key={role}
                  type='button'
                  onClick={() => setClusterRole(role)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    clusterRole === role
                      ? role === 'PILLAR'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {role === 'PILLAR' ? (
                    <StarSolid className='w-3.5 h-3.5 text-amber-400' />
                  ) : (
                    <DocumentTextIcon className='w-3.5 h-3.5' />
                  )}
                  {role === 'PILLAR' ? 'Pillar' : 'Spoke'}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      {/* Excerpt */}
      <Field label='Excerpt'>
        <textarea
          value={excerpt}
          onChange={e => setExcerpt(e.target.value)}
          rows={2}
          className={INPUT}
          placeholder='Short description shown in previews'
        />
      </Field>

      {/* Cover Image */}
      <Field label='Cover Image'>
        <CoverImageField value={coverImageUrl} onChange={setCoverImageUrl} />
      </Field>

      {/* SEO section */}
      <div className='space-y-4 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700'>
        <div className='flex items-center justify-between'>
          <p className='text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
            SEO
          </p>
          <HelpBlock>
            <p>
              <strong>Primary Keyword</strong> — The single phrase you want to
              rank for. Use it in the title, first 100 words, and at least one
              H2. Example:{' '}
              <code className='bg-blue-100 dark:bg-blue-800 px-1 rounded'>
                spotify pay per stream
              </code>
            </p>
            <p>
              <strong>Secondary Keywords</strong> — Long-tail variations used
              naturally in the body. Example: &ldquo;spotify royalties per
              stream&rdquo;, &ldquo;how much spotify pays artists.&rdquo;
            </p>
            <p>
              <strong>SEO Title</strong> — What Google shows in results. 55–60
              characters. Defaults to the article title.
            </p>
            <p>
              <strong>Meta Description</strong> — 150–160 characters shown under
              your title in search results. Include the primary keyword and a
              clear benefit.
            </p>
          </HelpBlock>
        </div>
        <Field label='Primary Keyword' hint='Single most important keyword'>
          <input
            type='text'
            value={primaryKeyword}
            onChange={e => setPrimaryKeyword(e.target.value)}
            className={INPUT}
            placeholder='e.g. spotify pay per stream'
          />
        </Field>
        <Field label='Secondary Keywords' hint='Long-tail keywords'>
          <KeywordInput keywords={keywords} onChange={setKeywords} />
        </Field>
        <Field label='SEO Title'>
          <input
            type='text'
            value={seoTitle}
            onChange={e => setSeoTitle(e.target.value)}
            className={INPUT}
            placeholder='Defaults to article title'
          />
        </Field>
        <Field label='Meta Description' hint={`${metaDescription.length}/160`}>
          <textarea
            value={metaDescription}
            onChange={e => setMetaDescription(e.target.value.slice(0, 160))}
            rows={2}
            className={INPUT}
            placeholder='SEO meta description'
          />
        </Field>
      </div>

      {/* Internal Links */}
      <div className='space-y-3 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
              Internal Links
            </p>
            <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
              Select 2–3 related articles. Pick a cluster first.
            </p>
          </div>
          <HelpBlock>
            <p>
              Internal links are critical for SEO. Each article should link to:
            </p>
            <ul className='list-disc list-inside space-y-0.5 ml-1'>
              <li>
                The <strong>PILLAR</strong> article (from every spoke)
              </li>
              <li>
                <strong>2–3 related spoke</strong> articles
              </li>
            </ul>
            <p>
              These appear as a &ldquo;See Also&rdquo; card section at the
              bottom of the published article. They help Google understand your
              content relationships and keep readers on Flemoji longer.
            </p>
          </HelpBlock>
        </div>
        {linkCandidates.length === 0 ? (
          <p className='text-xs text-gray-400 italic'>
            {clusterId
              ? 'No other articles in this cluster yet.'
              : 'Select a cluster above to see candidates.'}
          </p>
        ) : (
          <div className='space-y-1 max-h-44 overflow-y-auto'>
            {linkCandidates.map(a => (
              <label
                key={a.id}
                aria-label={`Link to: ${a.title}`}
                className='flex items-start gap-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition-colors'
              >
                <input
                  type='checkbox'
                  checked={internalLinks.includes(a.slug)}
                  onChange={e => {
                    if (e.target.checked)
                      setInternalLinks(prev => [...prev, a.slug]);
                    else
                      setInternalLinks(prev => prev.filter(s => s !== a.slug));
                  }}
                  className='mt-0.5 rounded border-gray-300 text-blue-600 flex-shrink-0'
                />
                <div className='min-w-0'>
                  <p className='text-sm text-gray-800 dark:text-gray-200 leading-snug'>
                    {a.title}
                  </p>
                  <p className='text-[10px] text-gray-400 font-mono truncate'>
                    /{a.slug}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className='space-y-4 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700'>
        <div className='flex items-center justify-between'>
          <p className='text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
            Call to Action
          </p>
          <HelpBlock>
            <p>
              Appears at the bottom of every article as a branded blue gradient
              card. Leave both fields blank to show the Flemoji default CTA.
            </p>
            <p>
              Customise when writing about a specific tool or campaign.
              <br />
              Example headline:{' '}
              <em>&ldquo;Calculate your streaming royalties&rdquo;</em>
              <br />
              Example link:{' '}
              <code className='bg-blue-100 dark:bg-blue-800 px-1 rounded'>
                flemoji.com/calculator
              </code>
            </p>
          </HelpBlock>
        </div>
        <Field label='CTA Headline' hint='Leave blank for default'>
          <input
            type='text'
            value={ctaText}
            onChange={e => setCtaText(e.target.value)}
            className={INPUT}
            placeholder='e.g. Use the Flemoji Streaming Revenue Estimator'
          />
        </Field>
        <Field label='CTA Link' hint='Defaults to /'>
          <input
            type='url'
            value={ctaLink}
            onChange={e => setCtaLink(e.target.value)}
            className={INPUT}
            placeholder='https://flemoji.com/...'
          />
        </Field>
      </div>

      {/* Body editor */}
      <div>
        <div className='flex items-center justify-between mb-1.5'>
          <p className={LABEL}>
            Body <span className='text-red-500 ml-0.5'>*</span>
          </p>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => mdFileRef.current?.click()}
              className='inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg border border-gray-200 dark:border-slate-600 transition-colors'
              title='Import a .md file into the editor'
            >
              <svg
                className='w-3.5 h-3.5'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4m0 0l4-4m-4 4V4'
                />
              </svg>
              Import .md
            </button>
            <input
              ref={mdFileRef}
              type='file'
              accept='.md,text/markdown'
              className='hidden'
              onChange={handleMdUpload}
            />
            <HelpBlock>
              <p>Recommended structure:</p>
              <ol className='list-decimal list-inside space-y-0.5 ml-1'>
                <li>
                  <strong>Introduction</strong> — Hook + primary keyword in the
                  first 100 words
                </li>
                <li>
                  <strong>3–5 H2 sections</strong> — Keyword-rich headings that
                  each answer a reader question
                </li>
                <li>
                  <strong>Data / Examples</strong> — Real numbers, comparisons,
                  or steps
                </li>
                <li>
                  <strong>Conclusion</strong> — Summary + action step
                </li>
              </ol>
              <p className='mt-1 font-semibold text-blue-700 dark:text-blue-300'>
                Target length: PILLAR = 2,000–3,000 words · SPOKE = 1,000–1,500
                words
              </p>
            </HelpBlock>
          </div>
        </div>
        <Suspense
          fallback={
            <div className='h-64 flex items-center justify-center border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-800 text-sm text-gray-400'>
              Loading editor…
            </div>
          }
        >
          <ArticleEditor
            key={editorKey}
            initialMarkdown={body}
            onChange={setBody}
          />
        </Suspense>
      </div>

      {/* Actions */}
      <div className='flex items-center justify-between gap-2 pt-4 border-t border-gray-200 dark:border-slate-700'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1'>
            <span className='inline-block w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600' />
            Saves as Draft — publish from the article list
          </p>
          {lastSavedAt && (
            <p className='text-[11px] text-emerald-500 dark:text-emerald-400'>
              ✓ Autosaved at{' '}
              {lastSavedAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={onCancel}
            disabled={saving}
            className='px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSave}
            disabled={!canSubmit}
            className='px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40'
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cluster Form ──────────────────────────────────────────────────────────────

interface ClusterFormProps {
  initial?: Partial<ArticleCluster>;
  onSave: (_data: CreateClusterInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function ExampleKeywords({ examples }: { examples: string[] }) {
  return (
    <div className='flex flex-wrap gap-1.5 mt-2'>
      <span className='text-[10px] text-gray-400 dark:text-gray-500 self-center mr-0.5'>
        e.g.
      </span>
      {examples.map(ex => (
        <span
          key={ex}
          className='px-2 py-0.5 rounded-md text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-700/60 border border-dashed border-gray-200 dark:border-slate-600'
        >
          {ex}
        </span>
      ))}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className='flex items-center gap-3 pt-2'>
      <span className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap'>
        {label}
      </span>
      <div className='flex-1 h-px bg-gray-100 dark:bg-slate-700' />
    </div>
  );
}

function ClusterForm({ initial, onSave, onCancel, saving }: ClusterFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [about, setAbout] = useState(initial?.about ?? '');
  const [goal, setGoal] = useState(initial?.goal ?? '');
  const [audience, setAudience] = useState(initial?.audience ?? '');
  const [primaryKeywords, setPrimaryKeywords] = useState<string[]>(
    initial?.primaryKeywords ?? []
  );
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>(
    initial?.secondaryKeywords ?? []
  );
  const [longTailKeywords, setLongTailKeywords] = useState<string[]>(
    initial?.longTailKeywords ?? []
  );

  return (
    <div className='space-y-7'>
      {/* ── Identity ── */}
      <SectionDivider label='Identity' />
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div className='sm:col-span-2'>
          <Field label='Cluster Title' required>
            <input
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              className={INPUT}
              placeholder='e.g. Music Royalties for Independent Artists'
            />
          </Field>
        </div>
        <Field label='Target Audience' hint='Who is this for?'>
          <input
            type='text'
            value={audience}
            onChange={e => setAudience(e.target.value)}
            className={INPUT}
            placeholder='e.g. Independent artists'
          />
        </Field>
      </div>

      {/* ── Description ── */}
      <SectionDivider label='Description' />
      <div className='space-y-4'>
        <Field label='Short Description' hint='Shown in sidebars and listings'>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className={INPUT}
            placeholder='This cluster explains how music royalties work for independent artists and songwriters…'
          />
        </Field>
        <Field
          label='What is this cluster about?'
          hint='Full editorial context — guides your article plan'
        >
          <textarea
            value={about}
            onChange={e => setAbout(e.target.value)}
            rows={5}
            className={INPUT}
            placeholder='This cluster focuses on educating independent artists about how music income works in the streaming era. Many artists receive royalty statements without understanding how the numbers are calculated…'
          />
        </Field>
      </div>

      {/* ── Keywords ── */}
      <SectionDivider label='Target Keywords' />
      <div className='space-y-5 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700'>
        <div>
          <Field
            label='Primary Keywords'
            hint='High-volume, broad terms — the main topics'
          >
            <KeywordInput
              keywords={primaryKeywords}
              onChange={setPrimaryKeywords}
            />
          </Field>
          <ExampleKeywords
            examples={[
              'music royalties explained',
              'how music royalties work',
              'types of music royalties',
            ]}
          />
        </div>
        <div>
          <Field
            label='Secondary Keywords'
            hint='Related terms with supporting intent'
          >
            <KeywordInput
              keywords={secondaryKeywords}
              onChange={setSecondaryKeywords}
            />
          </Field>
          <ExampleKeywords
            examples={[
              'how artists get paid from streaming',
              'mechanical royalties explained',
              'music publishing royalties',
            ]}
          />
        </div>
        <div>
          <Field
            label='Long-tail Keywords'
            hint='Specific questions and niche phrases'
          >
            <KeywordInput
              keywords={longTailKeywords}
              onChange={setLongTailKeywords}
            />
          </Field>
          <ExampleKeywords
            examples={[
              'how much does spotify pay per stream',
              'how to register songs for royalties',
              'music royalties south africa',
            ]}
          />
        </div>
      </div>

      {/* ── Goal ── */}
      <SectionDivider label='Cluster Goal' />
      <Field
        label='Goal'
        hint='What should this cluster achieve for artists and Flemoji?'
      >
        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          rows={3}
          className={INPUT}
          placeholder='Educate independent artists about the royalty system and position Flemoji as a trusted source of knowledge about music income, publishing, and streaming revenue…'
        />
      </Field>

      <div className='flex items-center justify-end gap-2 pt-4 border-t border-gray-200 dark:border-slate-700'>
        <button
          type='button'
          onClick={onCancel}
          disabled={saving}
          className='px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors'
        >
          Cancel
        </button>
        <button
          type='button'
          onClick={() =>
            onSave({
              name,
              description: description || undefined,
              about: about || undefined,
              goal: goal || undefined,
              audience: audience || undefined,
              primaryKeywords,
              secondaryKeywords,
              longTailKeywords,
            })
          }
          disabled={saving || !name}
          className='px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40'
        >
          {saving ? 'Saving…' : 'Save Cluster'}
        </button>
      </div>
    </div>
  );
}

// ── Article row (spoke) ───────────────────────────────────────────────────────

interface ArticleRowProps {
  article: Article;
  isLast: boolean;
  onEdit: (_a: Article) => void;
  onPublish: (_id: string) => void;
  onArchive: (_id: string) => void;
  onPreview: (_a: Article) => void;
  onDelete: (_id: string) => void;
}

function SpokeRow({
  article,
  isLast,
  onEdit,
  onPublish,
  onArchive,
  onPreview,
  onDelete,
}: ArticleRowProps) {
  return (
    <div className='relative flex items-center gap-3 pl-4 pr-4 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/20 transition-colors group'>
      {/* Tree connector */}
      <div className='absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-slate-700' />
      <div
        className={`absolute left-0 top-1/2 w-3 h-px bg-gray-200 dark:bg-slate-700 ${isLast ? '' : ''}`}
      />

      <DocumentTextIcon className='w-4 h-4 text-gray-300 dark:text-slate-600 flex-shrink-0' />

      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-gray-800 dark:text-gray-200 truncate'>
          {article.title}
        </p>
        <p className='text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate'>
          /{article.slug}
        </p>
      </div>

      <div className='flex items-center gap-2.5 flex-shrink-0'>
        {article.readTime > 0 && (
          <span className='text-[11px] text-gray-400 hidden sm:block'>
            {article.readTime} min
          </span>
        )}
        <StatusBadge status={article.status} />
        <div className='flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
          <button
            onClick={() => onPreview(article)}
            title='Preview'
            className='p-1.5 text-gray-400 hover:text-purple-500 rounded-md transition-colors'
          >
            <EyeIcon className='w-3.5 h-3.5' />
          </button>
          <button
            onClick={() => onEdit(article)}
            title='Edit'
            className='p-1.5 text-gray-400 hover:text-blue-500 rounded-md transition-colors'
          >
            <PencilIcon className='w-3.5 h-3.5' />
          </button>
          {article.status === 'DRAFT' && (
            <button
              onClick={() => onPublish(article.id)}
              title='Publish'
              className='p-1.5 text-gray-400 hover:text-emerald-500 rounded-md transition-colors'
            >
              <CheckCircleIcon className='w-3.5 h-3.5' />
            </button>
          )}
          {article.status !== 'ARCHIVED' && (
            <button
              onClick={() => onArchive(article.id)}
              title='Archive'
              className='p-1.5 text-gray-400 hover:text-amber-500 rounded-md transition-colors'
            >
              <ArchiveBoxIcon className='w-3.5 h-3.5' />
            </button>
          )}
          <button
            onClick={() => onDelete(article.id)}
            title='Delete'
            className='p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors'
          >
            <TrashIcon className='w-3.5 h-3.5' />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pillar row ────────────────────────────────────────────────────────────────

function PillarRow({
  article,
  onEdit,
  onPublish,
  onArchive,
  onPreview,
  onDelete,
}: Omit<ArticleRowProps, 'isLast'>) {
  return (
    <div className='flex items-center gap-3 px-4 py-3 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/70 dark:border-amber-800/40 rounded-xl group'>
      <StarSolid className='w-4 h-4 text-amber-400 flex-shrink-0' />

      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
          {article.title}
        </p>
        <p className='text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate'>
          /{article.slug}
        </p>
      </div>

      <div className='flex items-center gap-2.5 flex-shrink-0'>
        {article.readTime > 0 && (
          <span className='text-[11px] text-gray-400 hidden sm:block'>
            {article.readTime} min
          </span>
        )}
        <StatusBadge status={article.status} />
        <div className='flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
          <button
            onClick={() => onPreview(article)}
            title='Preview'
            className='p-1.5 text-gray-400 hover:text-purple-500 rounded-md transition-colors'
          >
            <EyeIcon className='w-3.5 h-3.5' />
          </button>
          <button
            onClick={() => onEdit(article)}
            title='Edit'
            className='p-1.5 text-gray-400 hover:text-blue-500 rounded-md transition-colors'
          >
            <PencilIcon className='w-3.5 h-3.5' />
          </button>
          {article.status === 'DRAFT' && (
            <button
              onClick={() => onPublish(article.id)}
              title='Publish'
              className='p-1.5 text-gray-400 hover:text-emerald-500 rounded-md transition-colors'
            >
              <CheckCircleIcon className='w-3.5 h-3.5' />
            </button>
          )}
          {article.status !== 'ARCHIVED' && (
            <button
              onClick={() => onArchive(article.id)}
              title='Archive'
              className='p-1.5 text-gray-400 hover:text-amber-500 rounded-md transition-colors'
            >
              <ArchiveBoxIcon className='w-3.5 h-3.5' />
            </button>
          )}
          <button
            onClick={() => onDelete(article.id)}
            title='Delete'
            className='p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors'
          >
            <TrashIcon className='w-3.5 h-3.5' />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cluster section ───────────────────────────────────────────────────────────

interface ClusterSectionProps {
  cluster: ClusterWithCount;
  pillar?: Article;
  spokes: Article[];
  onEditCluster: (_c: ArticleCluster) => void;
  onDeleteCluster: (_id: string) => void;
  onAddArticle: (_clusterId: string) => void;
  onEditArticle: (_a: Article) => void;
  onPublishArticle: (_id: string) => void;
  onArchiveArticle: (_id: string) => void;
  onPreviewArticle: (_a: Article) => void;
  onDeleteArticle: (_id: string) => void;
}

function ClusterSection({
  cluster,
  pillar,
  spokes,
  onEditCluster,
  onDeleteCluster,
  onAddArticle,
  onEditArticle,
  onPublishArticle,
  onArchiveArticle,
  onPreviewArticle,
  onDeleteArticle,
}: ClusterSectionProps) {
  const [open, setOpen] = useState(true);
  const total = (pillar ? 1 : 0) + spokes.length;

  return (
    <div className='bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden'>
      {/* Cluster header */}
      <div className='flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700'>
        <button
          onClick={() => setOpen(v => !v)}
          className='flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
        >
          {open ? (
            <ChevronDownIcon className='w-4 h-4' />
          ) : (
            <ChevronRightIcon className='w-4 h-4' />
          )}
        </button>

        <div className='w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0'>
          <FolderIcon className='w-4 h-4 text-blue-500 dark:text-blue-400' />
        </div>

        <button
          type='button'
          className='flex-1 min-w-0 text-left'
          onClick={() => setOpen(v => !v)}
        >
          <p className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
            {cluster.name}
          </p>
          {(cluster.audience || cluster.description) && (
            <p className='text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5'>
              {cluster.audience
                ? `For: ${cluster.audience}`
                : cluster.description}
            </p>
          )}
        </button>

        {/* Article count + keywords */}
        <div className='flex items-center gap-3 flex-shrink-0'>
          <span className='text-xs text-gray-400 dark:text-gray-500 tabular-nums'>
            {total} {total === 1 ? 'article' : 'articles'}
          </span>
          {pillar && (
            <span className='hidden sm:flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md'>
              <StarSolid className='w-2.5 h-2.5' /> Pillar set
            </span>
          )}
          <button
            onClick={() => onAddArticle(cluster.id)}
            title='Add article to this cluster'
            className='flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors'
          >
            <PlusIcon className='w-3.5 h-3.5' />
            <span className='hidden sm:inline'>Add</span>
          </button>
          <button
            onClick={() => onEditCluster(cluster)}
            title='Edit cluster'
            className='p-1.5 text-gray-400 hover:text-blue-500 rounded-md transition-colors'
          >
            <PencilIcon className='w-3.5 h-3.5' />
          </button>
          <button
            onClick={() => onDeleteCluster(cluster.id)}
            title='Delete cluster'
            className='p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors'
          >
            <TrashIcon className='w-3.5 h-3.5' />
          </button>
        </div>
      </div>

      {/* Articles */}
      {open && (
        <div className='px-4 py-3 space-y-1.5'>
          {total === 0 ? (
            <div className='flex flex-col items-center justify-center py-6 gap-2'>
              <p className='text-sm text-gray-400 dark:text-gray-500'>
                No articles in this cluster yet.
              </p>
              <button
                onClick={() => onAddArticle(cluster.id)}
                className='text-xs text-blue-500 hover:text-blue-600 font-medium'
              >
                + Add first article
              </button>
            </div>
          ) : (
            <>
              {/* Pillar article */}
              {pillar && (
                <PillarRow
                  article={pillar}
                  onEdit={onEditArticle}
                  onPublish={onPublishArticle}
                  onArchive={onArchiveArticle}
                  onPreview={onPreviewArticle}
                  onDelete={onDeleteArticle}
                />
              )}

              {/* Spoke articles — indented under pillar */}
              {spokes.length > 0 && (
                <div
                  className={`relative space-y-0.5 ${pillar ? 'ml-5 pl-3 border-l-2 border-gray-100 dark:border-slate-700' : ''}`}
                >
                  {spokes.map((spoke, i) => (
                    <SpokeRow
                      key={spoke.id}
                      article={spoke}
                      isLast={i === spokes.length - 1}
                      onEdit={onEditArticle}
                      onPublish={onPublishArticle}
                      onArchive={onArchiveArticle}
                      onPreview={onPreviewArticle}
                      onDelete={onDeleteArticle}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Unclustered section ───────────────────────────────────────────────────────

function UnclusteredSection({
  articles,
  onEdit,
  onPublish,
  onArchive,
  onPreview,
  onDelete,
}: {
  articles: Article[];
  onEdit: (_a: Article) => void;
  onPublish: (_id: string) => void;
  onArchive: (_id: string) => void;
  onPreview: (_a: Article) => void;
  onDelete: (_id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  if (articles.length === 0) return null;
  return (
    <div className='bg-white dark:bg-slate-800 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden'>
      <div className='flex items-center gap-3 px-5 py-4 border-b border-dashed border-gray-200 dark:border-slate-700'>
        <button
          onClick={() => setOpen(v => !v)}
          className='flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors'
        >
          {open ? (
            <ChevronDownIcon className='w-4 h-4' />
          ) : (
            <ChevronRightIcon className='w-4 h-4' />
          )}
        </button>
        <button
          type='button'
          className='flex-1 text-left text-sm font-semibold text-gray-400 dark:text-gray-500'
          onClick={() => setOpen(v => !v)}
        >
          Unclustered
        </button>
        <span className='text-xs text-gray-400 tabular-nums'>
          {articles.length} {articles.length === 1 ? 'article' : 'articles'}
        </span>
      </div>
      {open && (
        <div className='px-4 py-3 space-y-0.5'>
          {articles.map((article, i) => (
            <SpokeRow
              key={article.id}
              article={article}
              isLast={i === articles.length - 1}
              onEdit={onEdit}
              onPublish={onPublish}
              onArchive={onArchive}
              onPreview={onPreview}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Article Preview ───────────────────────────────────────────────────────────

function ArticlePreview({
  article,
  onClose,
  onEdit,
  onPublish,
}: {
  article: Article;
  onClose: () => void;
  onEdit: () => void;
  onPublish?: () => void;
}) {
  const ctaHeadline = article.ctaText || 'Understand your music income →';

  return (
    <div className='fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col overflow-hidden'>
      {/* Preview bar */}
      <div className='flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-slate-900 dark:bg-slate-950 text-white text-xs'>
        <div className='flex items-center gap-2'>
          <EyeIcon className='w-4 h-4 text-purple-400' />
          <span className='font-semibold text-purple-300'>Preview</span>
          <span className='text-slate-400'>—</span>
          <span className='text-slate-400 truncate max-w-xs'>
            {article.title}
          </span>
          <span className='px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 uppercase ml-1'>
            {article.status}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          {onPublish && (
            <button
              onClick={onPublish}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors'
            >
              <CheckCircleIcon className='w-3.5 h-3.5' />
              Publish
            </button>
          )}
          <button
            onClick={onEdit}
            className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors'
          >
            <PencilIcon className='w-3.5 h-3.5' />
            Edit
          </button>
          <button
            onClick={onClose}
            className='p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors'
          >
            <XMarkIcon className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Article content — mirrors public /articles/[slug] */}
      <div className='flex-1 overflow-y-auto'>
        <main className='min-h-screen bg-white dark:bg-slate-900'>
          {/* Cover Image */}
          {constructFileUrl(article.coverImageUrl) && (
            <div className='relative w-full h-64 md:h-80 overflow-hidden'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={constructFileUrl(article.coverImageUrl)}
                alt={article.title}
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
            </div>
          )}

          <div className='max-w-6xl mx-auto px-4 py-8'>
            {/* Header */}
            <div className='max-w-3xl mb-8'>
              {article.clusterRole === 'PILLAR' && (
                <span className='inline-block px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded uppercase tracking-wider mb-3'>
                  Pillar Guide
                </span>
              )}
              <h1 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4'>
                {article.title}
              </h1>
              {article.excerpt && (
                <p className='text-lg text-gray-500 dark:text-gray-400 mb-4 leading-relaxed'>
                  {article.excerpt}
                </p>
              )}
              <div className='flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400'>
                <span className='font-medium text-gray-700 dark:text-gray-300'>
                  Flemoji Editorial
                </span>
                <span>·</span>
                {article.readTime > 0 && (
                  <span>{article.readTime} min read</span>
                )}
                {article.primaryKeyword && (
                  <>
                    <span>·</span>
                    <span className='px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium'>
                      {article.primaryKeyword}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            <div className='flex flex-col lg:flex-row gap-8'>
              <article className='flex-1 min-w-0'>
                <div className='prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-xl'>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {article.body}
                  </ReactMarkdown>
                </div>

                {/* Interactive Tools */}
                {(() => {
                  const tools = (article.toolSlugs ?? [])
                    .map(slug => getToolBySlug(slug))
                    .filter(Boolean);
                  if (!tools.length) return null;
                  return (
                    <div className='mt-12 pt-8 border-t border-gray-100 dark:border-slate-800'>
                      <div className='flex items-center gap-2 mb-6'>
                        <div className='w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0'>
                          <svg
                            className='w-3 h-3 text-white'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2.5}
                              d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                            />
                          </svg>
                        </div>
                        <p className='text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
                          Interactive Tools
                        </p>
                      </div>
                      <div
                        className={`grid gap-5 ${tools.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 sm:grid-cols-2'}`}
                      >
                        {tools.map(tool => (
                          <ToolSummaryCard key={tool!.slug} tool={tool!} />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* CTA */}
                <div className='mt-12 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white'>
                  <p className='text-lg font-semibold mb-2'>{ctaHeadline}</p>
                  <p className='text-blue-100 mb-4'>
                    Discover and support South African artists on Flemoji.
                  </p>
                  <span className='inline-block px-5 py-2 bg-white text-blue-600 font-semibold rounded-lg'>
                    Explore Music
                  </span>
                </div>
              </article>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type ModalMode =
  | { type: 'none' }
  | { type: 'article-create'; prefillClusterId?: string; article?: Article }
  | { type: 'article-preview'; article: Article }
  | { type: 'cluster-create' }
  | { type: 'cluster-edit'; cluster: ArticleCluster };

export default function ArticleManagement() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [clusters, setClusters] = useState<ClusterWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>({ type: 'none' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    if (!saving) {
      setModal({ type: 'none' });
    }
  }, [saving]);

  // ── Fetch ───────────────────────────────────────────────────────────────

  const fetchArticles = useCallback(async () => {
    const res = await fetch('/api/admin/articles?limit=100');
    if (!res.ok) throw new Error('Failed to fetch articles');
    const data = await res.json();
    setArticles(data.articles ?? []);
  }, []);

  const fetchClusters = useCallback(async () => {
    const res = await fetch('/api/admin/clusters');
    if (!res.ok) throw new Error('Failed to fetch clusters');
    const data = await res.json();
    setClusters(data.clusters ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchArticles(), fetchClusters()])
      .catch(() => setError('Failed to load content'))
      .finally(() => setLoading(false));
  }, [fetchArticles, fetchClusters]);

  // ── Group articles by cluster ────────────────────────────────────────────

  const grouped = useMemo(() => {
    const byCluster = new Map<
      string,
      { pillar?: Article; spokes: Article[] }
    >();
    const unclustered: Article[] = [];

    articles.forEach(article => {
      if (!article.clusterId) {
        unclustered.push(article);
        return;
      }
      if (!byCluster.has(article.clusterId)) {
        byCluster.set(article.clusterId, { spokes: [] });
      }
      const group = byCluster.get(article.clusterId)!;
      if (article.clusterRole === 'PILLAR') {
        group.pillar = article;
      } else {
        group.spokes.push(article);
      }
    });

    return { byCluster, unclustered };
  }, [articles]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const handlePublishExisting = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${id}/publish`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to publish');
      }
      await fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    }
  };

  const handleArchiveArticle = async (id: string) => {
    if (!confirm('Archive this article?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to archive');
      await fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Permanently delete this article? This cannot be undone.'))
      return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: { 'x-hard-delete': '1' },
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleSaveCluster = async (data: CreateClusterInput) => {
    setSaving(true);
    setError(null);
    try {
      if (modal.type === 'cluster-edit') {
        const res = await fetch(`/api/admin/clusters/${modal.cluster.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update cluster');
      } else {
        const res = await fetch('/api/admin/clusters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create cluster');
      }
      await fetchClusters();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCluster = async (id: string) => {
    if (!confirm('Delete this cluster? Articles will become unclustered.'))
      return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/clusters/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      await Promise.all([fetchClusters(), fetchArticles()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // ── Modal meta ───────────────────────────────────────────────────────────

  const isClusterModal =
    modal.type === 'cluster-create' || modal.type === 'cluster-edit';

  const modalTitle =
    modal.type === 'cluster-create'
      ? 'New Cluster'
      : modal.type === 'cluster-edit'
        ? 'Edit Cluster'
        : '';

  const totalArticles = articles.length;
  const totalClusters = clusters.length;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className='space-y-4'>
      {/* Error */}
      {error && (
        <div className='flex items-center justify-between gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400'>
          {error}
          <button
            onClick={() => setError(null)}
            className='underline hover:no-underline flex-shrink-0'
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div>
            <span className='text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums'>
              {totalArticles}
            </span>
            <span className='text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1.5'>
              articles
            </span>
          </div>
          <div className='w-px h-5 bg-gray-200 dark:bg-slate-700' />
          <div>
            <span className='text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums'>
              {totalClusters}
            </span>
            <span className='text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1.5'>
              clusters
            </span>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => setModal({ type: 'cluster-create' })}
            className='flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors'
          >
            <FolderIcon className='w-4 h-4' />
            <span className='hidden sm:inline'>New Cluster</span>
          </button>
          <button
            onClick={() => setModal({ type: 'article-create' })}
            className='flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
          >
            <PlusIcon className='w-4 h-4' />
            <span className='hidden sm:inline'>New Article</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className='space-y-3'>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className='h-24 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl animate-pulse'
            />
          ))}
        </div>
      ) : totalArticles === 0 && totalClusters === 0 ? (
        <div className='flex flex-col items-center justify-center py-20 gap-3 text-center'>
          <div className='w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center'>
            <DocumentTextIcon className='w-6 h-6 text-blue-500' />
          </div>
          <p className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
            No content yet
          </p>
          <p className='text-xs text-gray-400 dark:text-gray-500 max-w-xs'>
            Start by creating a cluster to group related articles, then add
            articles inside it.
          </p>
          <button
            onClick={() => setModal({ type: 'cluster-create' })}
            className='mt-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors'
          >
            Create first cluster
          </button>
        </div>
      ) : (
        <div className='space-y-3'>
          {/* Clusters with their articles */}
          {clusters.map(cluster => {
            const group = grouped.byCluster.get(cluster.id) ?? {
              spokes: [],
            };
            return (
              <ClusterSection
                key={cluster.id}
                cluster={cluster}
                pillar={group.pillar}
                spokes={group.spokes}
                onEditCluster={c =>
                  setModal({ type: 'cluster-edit', cluster: c })
                }
                onDeleteCluster={handleDeleteCluster}
                onAddArticle={cid =>
                  setModal({ type: 'article-create', prefillClusterId: cid })
                }
                onEditArticle={a =>
                  setModal({ type: 'article-create', article: a })
                }
                onPublishArticle={handlePublishExisting}
                onArchiveArticle={handleArchiveArticle}
                onPreviewArticle={a =>
                  setModal({ type: 'article-preview', article: a })
                }
                onDeleteArticle={handleDeleteArticle}
              />
            );
          })}

          {/* Unclustered articles */}
          <UnclusteredSection
            articles={grouped.unclustered}
            onEdit={a => setModal({ type: 'article-create', article: a })}
            onPublish={handlePublishExisting}
            onArchive={handleArchiveArticle}
            onPreview={a => setModal({ type: 'article-preview', article: a })}
            onDelete={handleDeleteArticle}
          />
        </div>
      )}

      {/* Full-screen AI Article Creator / Editor — article-create */}
      {modal.type === 'article-create' && (
        <Suspense fallback={null}>
          <ArticleCreatorPage
            clusters={clusters}
            prefillClusterId={modal.prefillClusterId}
            initialArticle={modal.article}
            existingArticles={articles.map(a => ({
              title: a.title,
              slug: a.slug,
              excerpt: a.excerpt ?? undefined,
            }))}
            onClose={closeModal}
            onSaved={async () => {
              await Promise.all([fetchArticles(), fetchClusters()]);
              closeModal();
            }}
          />
        </Suspense>
      )}

      {/* Full-screen Article Preview */}
      {modal.type === 'article-preview' && (
        <ArticlePreview
          article={modal.article}
          onClose={closeModal}
          onEdit={() =>
            setModal({ type: 'article-create', article: modal.article })
          }
          onPublish={
            modal.article.status === 'DRAFT'
              ? () => handlePublishExisting(modal.article.id)
              : undefined
          }
        />
      )}

      {/* Modal — cluster forms */}
      {isClusterModal && (
        <div className='fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto'>
          <button
            type='button'
            aria-label='Close modal'
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={closeModal}
          />
          <div className='relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl my-8 border border-gray-200 dark:border-slate-700'>
            {/* Modal header */}
            <div className='flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-700'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center'>
                  <FolderIcon className='w-4 h-4 text-blue-500' />
                </div>
                <h2 className='text-base font-semibold text-gray-900 dark:text-white'>
                  {modalTitle}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors'
              >
                <XMarkIcon className='w-5 h-5' />
              </button>
            </div>

            {/* Modal body */}
            <div className='p-6 overflow-y-auto max-h-[80vh]'>
              <ClusterForm
                initial={
                  modal.type === 'cluster-edit' ? modal.cluster : undefined
                }
                onSave={handleSaveCluster}
                onCancel={closeModal}
                saving={saving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
