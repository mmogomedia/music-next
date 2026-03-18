'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  PencilSquareIcon,
  LinkIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  StopCircleIcon,
} from '@heroicons/react/24/outline';
import type {
  Article,
  ArticleCluster,
  CreateArticleInput,
} from '@/types/articles';
import { getAllTools } from '@/lib/tools/registry';
import { parseArticleMd } from '@/lib/utils/parse-article-md';
import { slugify } from '@/lib/services/article-service';
import { useImageUpload } from '@/lib/image-upload';
import { constructFileUrl } from '@/lib/url-utils';

const ArticleEditor = lazy(() => import('@/components/articles/ArticleEditor'));

// ── Shared styles ──────────────────────────────────────────────────────────────

const INPUT =
  'w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

const LABEL =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5';

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
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
  placeholder,
}: {
  keywords: string[];
  onChange: (_kw: string[]) => void;
  placeholder?: string;
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
        placeholder={
          keywords.length === 0 ? (placeholder ?? 'Type + Enter') : ''
        }
      />
    </div>
  );
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
            className='w-full h-40 object-cover'
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
          className='w-full h-28 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors bg-gray-50 dark:bg-slate-800/40'
        >
          {isUploading ? (
            <span className='text-sm'>Uploading…</span>
          ) : (
            <>
              <svg
                className='w-6 h-6'
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
              <span className='text-[11px] text-gray-400'>
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

// ── SEO score ─────────────────────────────────────────────────────────────────

interface SeoCheck {
  label: string;
  hint: string;
  pass: boolean;
  weight: number;
}

function computeSeoScore(fields: ArticleFields): {
  score: number;
  checks: SeoCheck[];
} {
  const checks: SeoCheck[] = [];
  const wordCount = fields.body.trim().split(/\s+/).filter(Boolean).length;
  const targetWords = fields.clusterRole === 'PILLAR' ? 2000 : 1000;
  const kw = fields.primaryKeyword.toLowerCase().trim();

  checks.push({
    label: 'Title',
    hint: 'Enter a title for this article',
    pass: !!fields.title.trim(),
    weight: 10,
  });
  checks.push({
    label: 'Cover image',
    hint: 'Upload a cover image above',
    pass: !!fields.coverImageUrl,
    weight: 10,
  });
  checks.push({
    label: 'Excerpt',
    hint: 'Write a 1–2 sentence excerpt',
    pass: !!fields.excerpt.trim(),
    weight: 5,
  });
  checks.push({
    label: 'Primary keyword',
    hint: 'Set a primary keyword in the SEO section',
    pass: !!kw,
    weight: 5,
  });

  if (kw) {
    const inTitle = fields.title.toLowerCase().includes(kw);
    checks.push({
      label: 'Keyword in title',
      hint: `Add "${kw}" to your title`,
      pass: inTitle,
      weight: 15,
    });
    const opening = fields.body
      .split('\n\n')
      .slice(0, 2)
      .join(' ')
      .toLowerCase();
    checks.push({
      label: 'Keyword in opening paragraph',
      hint: `Mention "${kw}" in your first paragraph`,
      pass: opening.includes(kw),
      weight: 15,
    });
  }

  const seoLen = fields.seoTitle.length;
  checks.push({
    label: `SEO title (${seoLen || 0}/60 chars)`,
    hint:
      seoLen === 0
        ? 'Fill in the SEO title field (55–60 chars)'
        : seoLen < 55
          ? `Too short — add ${55 - seoLen} more characters`
          : `Too long — trim by ${seoLen - 60} characters`,
    pass: seoLen >= 55 && seoLen <= 60,
    weight: 10,
  });

  const metaLen = fields.metaDescription.length;
  checks.push({
    label: `Meta description (${metaLen || 0}/160 chars)`,
    hint:
      metaLen === 0
        ? 'Fill in the meta description (150–160 chars)'
        : metaLen < 150
          ? `Too short — add ${150 - metaLen} more characters`
          : 'At the 160 char limit — good',
    pass: metaLen >= 150 && metaLen <= 160,
    weight: 15,
  });

  const gap = targetWords - wordCount;
  checks.push({
    label: `Word count (${wordCount.toLocaleString()} / ${targetWords.toLocaleString()})`,
    hint:
      wordCount === 0
        ? 'Start writing in the body editor'
        : gap > 0
          ? `${gap.toLocaleString()} more words needed`
          : 'Word count target met',
    pass: wordCount >= targetWords,
    weight: 15,
  });

  const total = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter(c => c.pass).reduce((s, c) => s + c.weight, 0);
  return { score: Math.round((earned / total) * 100), checks };
}

// ── Link suggestion type ───────────────────────────────────────────────────────

interface LinkSuggestion {
  anchor: string;
  slug: string;
  title: string;
  reason?: string;
}

// ── Article fields ─────────────────────────────────────────────────────────────

interface ArticleFields {
  title: string;
  slug: string;
  slugEdited: boolean;
  excerpt: string;
  coverImageUrl: string;
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  clusterRole: 'PILLAR' | 'SPOKE';
  ctaText: string;
  ctaLink: string;
  clusterId: string;
  toolSlugs: string[];
  body: string;
}

const EMPTY_FIELDS: ArticleFields = {
  title: '',
  slug: '',
  slugEdited: false,
  excerpt: '',
  coverImageUrl: '',
  seoTitle: '',
  metaDescription: '',
  primaryKeyword: '',
  secondaryKeywords: [],
  clusterRole: 'SPOKE',
  ctaText: '',
  ctaLink: '',
  clusterId: '',
  toolSlugs: [],
  body: '',
};

// ── Props ──────────────────────────────────────────────────────────────────────

interface ExistingArticle {
  title: string;
  slug: string;
  excerpt?: string | null;
}

interface ArticleCreatorPageProps {
  clusters: ArticleCluster[];
  prefillClusterId?: string;
  initialArticle?: Article;
  existingArticles?: ExistingArticle[];
  onClose: () => void;
  onSaved: () => void;
}

// ── Toolkit action types ───────────────────────────────────────────────────────

type ToolkitAction =
  | 'generate'
  | 'fill_seo'
  | 'generate_outline'
  | 'improve_readability'
  | 'suggest_links';

type AiStatus = 'idle' | 'running' | 'done' | 'error';

const ACTION_LABELS: Record<ToolkitAction, string> = {
  generate: 'Generating article…',
  fill_seo: 'Filling SEO fields…',
  generate_outline: 'Generating outline…',
  improve_readability: 'Improving readability…',
  suggest_links: 'Finding internal links…',
};

const ACTION_SUCCESS: Record<ToolkitAction, string> = {
  generate: 'Article generated and fields populated.',
  fill_seo: 'SEO fields filled — review and adjust as needed.',
  generate_outline:
    'Outline created — expand each section to write the full article.',
  improve_readability: 'Body updated with improved readability.',
  suggest_links: 'Links suggested below — click Insert to add them.',
};

// ── Linked Content Panel ───────────────────────────────────────────────────────

function LinkedContentPanel({
  articleId,
  toolSlugs,
  onChange,
}: {
  articleId?: string;
  toolSlugs: string[];
  onChange: (_slugs: string[]) => void;
}) {
  const allTools = getAllTools();
  const [linkIds, setLinkIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // For existing articles: load current ContentLinks to get link IDs for deletion
  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    fetch(
      `/api/graph?fromType=ARTICLE&fromId=${articleId}&toType=TOOL&linkType=REFERENCES`
    )
      .then(r => r.json())
      .then(d => {
        const links: Array<{ id: string; toId: string }> = d.links ?? [];
        const ids: Record<string, string> = {};
        const slugs: string[] = [];
        for (const link of links) {
          ids[link.toId] = link.id;
          slugs.push(link.toId);
        }
        setLinkIds(ids);
        // Sync form state with ContentLink (source of truth for existing articles)
        onChange(slugs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // onChange intentionally excluded — only run on articleId change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const toggle = async (slug: string) => {
    const checked = toolSlugs.includes(slug);

    if (!articleId) {
      // New article: update form state only, written on save
      onChange(
        checked ? toolSlugs.filter(s => s !== slug) : [...toolSlugs, slug]
      );
      return;
    }

    // Existing article: write to ContentLink immediately
    setToggling(slug);
    try {
      if (checked) {
        const linkId = linkIds[slug];
        if (linkId) {
          const res = await fetch(`/api/graph/link/${linkId}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            setLinkIds(prev => {
              const next = { ...prev };
              delete next[slug];
              return next;
            });
            onChange(toolSlugs.filter(s => s !== slug));
          }
        }
      } else {
        const res = await fetch('/api/graph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromType: 'ARTICLE',
            fromId: articleId,
            toType: 'TOOL',
            toId: slug,
            linkType: 'REFERENCES',
            order: toolSlugs.length,
          }),
        });
        const data = await res.json();
        if (data.link) {
          setLinkIds(prev => ({ ...prev, [slug]: data.link.id }));
          onChange([...toolSlugs, slug]);
        }
      }
    } catch {
      // silently ignore — UI stays consistent
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className='space-y-3 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700'>
      <div className='flex items-center justify-between'>
        <p className='text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
          Linked Content
        </p>
        {toolSlugs.length > 0 && (
          <span className='text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full'>
            {toolSlugs.length} linked
          </span>
        )}
      </div>
      <p className='text-[11px] text-gray-400 dark:text-gray-500'>
        Link tools to this article. They appear below the article body and in
        the content graph.
        {articleId && (
          <span className='text-purple-500 dark:text-purple-400'>
            {' '}
            Changes save instantly.
          </span>
        )}
      </p>
      {loading ? (
        <div className='animate-pulse space-y-2'>
          {allTools.map(t => (
            <div
              key={t.slug}
              className='h-12 bg-gray-200 dark:bg-slate-700 rounded-xl'
            />
          ))}
        </div>
      ) : (
        <div className='space-y-2'>
          {allTools.map(tool => {
            const checked = toolSlugs.includes(tool.slug);
            const isToggling = toggling === tool.slug;
            return (
              <label
                key={tool.slug}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  checked
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-purple-200 dark:hover:border-purple-700'
                } ${isToggling ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <input
                  type='checkbox'
                  checked={checked}
                  onChange={() => toggle(tool.slug)}
                  className='w-4 h-4 rounded accent-purple-600 flex-shrink-0'
                />
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center flex-shrink-0`}
                >
                  <span className='text-sm'>
                    {tool.category === 'royalties'
                      ? '⚖️'
                      : tool.category === 'finance'
                        ? '📊'
                        : '🔧'}
                  </span>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-semibold text-gray-900 dark:text-white truncate'>
                    {tool.name}
                  </p>
                  <p className='text-[10px] text-gray-400 truncate'>
                    {tool.tagline}
                  </p>
                </div>
                {isToggling ? (
                  <svg
                    className='w-3.5 h-3.5 text-purple-400 animate-spin flex-shrink-0'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8v8H4z'
                    />
                  </svg>
                ) : checked && articleId ? (
                  <span className='flex-shrink-0 w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center'>
                    <svg
                      className='w-2.5 h-2.5 text-purple-600 dark:text-purple-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={3}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Score ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width='42' height='42' viewBox='0 0 42 42' className='flex-shrink-0'>
      <circle
        cx='21'
        cy='21'
        r={r}
        fill='none'
        stroke='currentColor'
        strokeWidth='4'
        className='text-gray-200 dark:text-slate-700'
      />
      <circle
        cx='21'
        cy='21'
        r={r}
        fill='none'
        stroke={color}
        strokeWidth='4'
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap='round'
        transform='rotate(-90 21 21)'
      />
      <text
        x='21'
        y='21'
        textAnchor='middle'
        dominantBaseline='central'
        fontSize='9'
        fontWeight='700'
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ArticleCreatorPage({
  clusters,
  prefillClusterId,
  initialArticle,
  existingArticles = [],
  onClose,
  onSaved,
}: ArticleCreatorPageProps) {
  const [fields, setFields] = useState<ArticleFields>(
    initialArticle
      ? {
          title: initialArticle.title,
          slug: initialArticle.slug,
          slugEdited: true,
          excerpt: initialArticle.excerpt ?? '',
          coverImageUrl: initialArticle.coverImageUrl ?? '',
          seoTitle: initialArticle.seoTitle ?? '',
          metaDescription: initialArticle.metaDescription ?? '',
          primaryKeyword: initialArticle.primaryKeyword ?? '',
          secondaryKeywords: initialArticle.targetKeywords ?? [],
          clusterRole: initialArticle.clusterRole,
          ctaText: initialArticle.ctaText ?? '',
          ctaLink: initialArticle.ctaLink ?? '',
          clusterId: initialArticle.clusterId ?? '',
          toolSlugs: initialArticle.toolSlugs ?? [],
          body: initialArticle.body,
        }
      : {
          ...EMPTY_FIELDS,
          clusterId: prefillClusterId ?? '',
        }
  );
  const [editorKey, setEditorKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  // AI Toolkit state
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');
  const [aiAction, setAiAction] = useState<ToolkitAction | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([]);
  const [generateTopic, setGenerateTopic] = useState('');
  const [seoOpen, setSeoOpen] = useState(true);

  const mdFileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-slug from title
  useEffect(() => {
    if (!fields.slugEdited && fields.title) {
      setFields(f => ({ ...f, slug: slugify(f.title) }));
    }
  }, [fields.title, fields.slugEdited]);

  // SEO score (memoised — recomputes when relevant fields change)
  const seo = useMemo(
    () => computeSeoScore(fields),
    [
      fields.title,
      fields.body,
      fields.primaryKeyword,
      fields.seoTitle,
      fields.metaDescription,
      fields.excerpt,
      fields.coverImageUrl,
      fields.clusterRole,
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ]
  );

  // ── Field helpers ──────────────────────────────────────────────────────────

  const set = useCallback(
    <K extends keyof ArticleFields>(key: K, value: ArticleFields[K]) => {
      setFields(f => ({ ...f, [key]: value }));
    },
    []
  );

  const applyArticleData = useCallback((data: Record<string, unknown>) => {
    setFields(prev => {
      const next = { ...prev };
      if (typeof data.title === 'string') {
        next.title = data.title;
        if (!prev.slugEdited) next.slug = slugify(data.title);
      }
      if (typeof data.excerpt === 'string') next.excerpt = data.excerpt;
      if (typeof data.seo_title === 'string') next.seoTitle = data.seo_title;
      if (typeof data.meta_description === 'string')
        next.metaDescription = data.meta_description;
      if (typeof data.primary_keyword === 'string')
        next.primaryKeyword = data.primary_keyword;
      if (Array.isArray(data.secondary_keywords))
        next.secondaryKeywords = data.secondary_keywords as string[];
      if (data.cluster_role === 'PILLAR' || data.cluster_role === 'SPOKE')
        next.clusterRole = data.cluster_role;
      if (typeof data.cta_text === 'string') next.ctaText = data.cta_text;
      if (typeof data.cta_link === 'string') next.ctaLink = data.cta_link;
      if (typeof data.body === 'string') next.body = data.body;
      return next;
    });
    if (typeof data.body === 'string') {
      setEditorKey(k => k + 1);
    }
  }, []);

  // ── .md import ────────────────────────────────────────────────────────────

  const handleMdUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const text = (ev.target?.result as string) ?? '';
        const parsed = parseArticleMd(text);
        const data: Record<string, unknown> = {
          title: parsed.title,
          excerpt: parsed.excerpt,
          seo_title: parsed.seoTitle,
          meta_description: parsed.metaDescription,
          primary_keyword: parsed.primaryKeyword,
          secondary_keywords: parsed.targetKeywords ?? [],
          cluster_role: parsed.clusterRole,
          cta_text: parsed.ctaText,
          cta_link: parsed.ctaLink,
          body: parsed.body,
        };
        applyArticleData(data);
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [applyArticleData]
  );

  // ── AI Toolkit ────────────────────────────────────────────────────────────

  const runAction = useCallback(
    async (action: ToolkitAction) => {
      if (aiStatus === 'running') return;

      setAiStatus('running');
      setAiAction(action);
      setAiMessage('');
      setLinkSuggestions([]);

      abortRef.current = new AbortController();

      const cluster = clusters.find(c => c.id === fields.clusterId);
      const context = cluster
        ? {
            clusterName: cluster.name,
            clusterDescription: cluster.description ?? undefined,
            clusterKeywords: cluster.targetKeywords ?? [],
          }
        : undefined;

      try {
        const response = await fetch('/api/admin/articles/ai-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            generateTopic: action === 'generate' ? generateTopic : undefined,
            context,
            articleState: {
              title: fields.title,
              body: fields.body,
              primaryKeyword: fields.primaryKeyword,
              excerpt: fields.excerpt,
              seoTitle: fields.seoTitle,
              metaDescription: fields.metaDescription,
              secondaryKeywords: fields.secondaryKeywords,
              clusterRole: fields.clusterRole,
            },
            existingArticles: existingArticles.map(a => ({
              title: a.title,
              slug: a.slug,
              excerpt: a.excerpt ?? undefined,
            })),
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error(`Server error ${response.status}`);

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'article_fields') {
                applyArticleData(event.data);
              } else if (event.type === 'link_suggestions') {
                setLinkSuggestions(event.data ?? []);
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch (parseErr) {
              if ((parseErr as Error).message?.startsWith('Server'))
                throw parseErr;
              /* ignore malformed SSE line */
            }
          }
        }

        setAiStatus('done');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setAiStatus('error');
          setAiMessage((err as Error).message || 'Something went wrong.');
        } else {
          setAiStatus('idle');
        }
      } finally {
        setAiAction(null);
      }
    },
    [
      aiStatus,
      fields,
      clusters,
      generateTopic,
      existingArticles,
      applyArticleData,
    ]
  );

  const cancelAction = useCallback(() => {
    abortRef.current?.abort();
    setAiStatus('idle');
    setAiAction(null);
  }, []);

  const insertLink = useCallback(
    (suggestion: LinkSuggestion) => {
      const linked = `[${suggestion.anchor}](/articles/${suggestion.slug})`;
      const newBody = fields.body.replace(suggestion.anchor, linked);
      if (newBody !== fields.body) {
        set('body', newBody);
        setEditorKey(k => k + 1);
      }
      setLinkSuggestions(prev => prev.filter(s => s.slug !== suggestion.slug));
    },
    [fields.body, set]
  );

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!fields.title || !fields.body) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload: CreateArticleInput = {
        title: fields.title,
        slug: fields.slug || undefined,
        body: fields.body,
        excerpt: fields.excerpt || undefined,
        coverImageUrl: fields.coverImageUrl || undefined,
        seoTitle: fields.seoTitle || undefined,
        metaDescription: fields.metaDescription || undefined,
        targetKeywords: fields.secondaryKeywords,
        primaryKeyword: fields.primaryKeyword || undefined,
        ctaText: fields.ctaText || undefined,
        ctaLink: fields.ctaLink || undefined,
        clusterId: fields.clusterId || undefined,
        clusterRole: fields.clusterRole,
        toolSlugs: fields.toolSlugs,
      };

      const url = initialArticle
        ? `/api/admin/articles/${initialArticle.id}`
        : '/api/admin/articles';
      const res = await fetch(url, {
        method: initialArticle ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save article');
      }

      setSavedOk(true);
      setTimeout(() => {
        onSaved();
      }, 800);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [fields, initialArticle, onSaved]);

  const canSave = !!fields.title && !!fields.body && !saving;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className='fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col'>
      {/* ── Header ── */}
      <header className='flex-shrink-0 flex items-center justify-between gap-4 px-5 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <SparklesIcon className='w-5 h-5 text-blue-500' />
            <h1 className='text-base font-bold text-gray-900 dark:text-white'>
              {initialArticle ? 'Edit Article' : 'Article Creator'}
            </h1>
          </div>

          {/* Cluster selector */}
          <div className='relative'>
            <select
              value={fields.clusterId}
              onChange={e => set('clusterId', e.target.value)}
              className='text-xs px-3 py-1.5 pr-7 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>No cluster</option>
              {clusters.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <svg
              className='w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {/* Download template */}
          <a
            href='/flemoji-article-template.md'
            download='flemoji-article-template.md'
            className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg border border-gray-200 dark:border-slate-600 transition-colors'
            title='Download the article template for ChatGPT / Claude'
          >
            <ArrowDownTrayIcon className='w-3.5 h-3.5' />
            Download Template
          </a>

          {/* Import .md */}
          <button
            type='button'
            onClick={() => mdFileRef.current?.click()}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg border border-gray-200 dark:border-slate-600 transition-colors'
            title='Import a completed .md file to populate all fields'
          >
            <ArrowUpTrayIcon className='w-3.5 h-3.5' />
            Import .md
          </button>
          <input
            ref={mdFileRef}
            type='file'
            accept='.md,text/markdown'
            className='hidden'
            onChange={handleMdUpload}
          />

          {/* Save */}
          <button
            type='button'
            onClick={handleSave}
            disabled={!canSave}
            className='px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40'
          >
            {savedOk ? '✓ Saved' : saving ? 'Saving…' : 'Save Draft'}
          </button>
          {saveError && (
            <p className='text-xs text-red-500 max-w-[180px] truncate'>
              {saveError}
            </p>
          )}

          {/* Close */}
          <button
            type='button'
            onClick={onClose}
            className='p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors'
          >
            <XMarkIcon className='w-5 h-5' />
          </button>
        </div>
      </header>

      {/* ── Published warning banner ── */}
      {initialArticle?.status === 'PUBLISHED' && (
        <div className='flex-shrink-0 flex items-center gap-2.5 px-5 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/50'>
          <svg
            className='w-4 h-4 text-amber-500 flex-shrink-0'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
            />
          </svg>
          <p className='text-xs font-semibold text-amber-700 dark:text-amber-400'>
            This article is live. Changes will go public immediately when you
            save.
          </p>
        </div>
      )}

      {/* ── Body ── */}
      <div className='flex-1 flex overflow-hidden'>
        {/* Left: Article Form ────────────────────────────────────────────────── */}
        <div className='flex-1 overflow-y-auto'>
          <div className='max-w-3xl mx-auto px-6 py-6 space-y-6'>
            {/* Title + Slug */}
            <div className='grid grid-cols-1 gap-4'>
              <Field label='Title' required>
                <input
                  type='text'
                  value={fields.title}
                  onChange={e => set('title', e.target.value)}
                  className={INPUT}
                  placeholder='Article title'
                />
              </Field>
              <Field label='Slug'>
                <input
                  type='text'
                  value={fields.slug}
                  onChange={e => {
                    set('slug', e.target.value);
                    set('slugEdited', true);
                  }}
                  className={`${INPUT} font-mono text-xs`}
                  placeholder='auto-generated-from-title'
                />
              </Field>
            </div>

            {/* Role */}
            <div className='flex items-center gap-3'>
              <p className={`${LABEL} mb-0 whitespace-nowrap`}>Cluster Role</p>
              <div className='flex gap-2'>
                {(['SPOKE', 'PILLAR'] as const).map(role => (
                  <button
                    key={role}
                    type='button'
                    onClick={() => set('clusterRole', role)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      fields.clusterRole === role
                        ? role === 'PILLAR'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <span className='text-xs text-gray-400'>
                {fields.clusterRole === 'PILLAR'
                  ? '2,000–3,000 words'
                  : '1,000–1,500 words'}
              </span>
            </div>

            {/* Excerpt + Cover */}
            <div className='grid grid-cols-1 gap-4'>
              <Field label='Excerpt' hint='Shown in previews — max 160 chars'>
                <textarea
                  value={fields.excerpt}
                  onChange={e => set('excerpt', e.target.value)}
                  rows={2}
                  className={INPUT}
                  placeholder='1–2 sentence summary of the article'
                />
                {fields.excerpt.length > 0 && (
                  <p
                    className={`text-[10px] mt-1 ${fields.excerpt.length > 160 ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    {fields.excerpt.length}/160
                  </p>
                )}
              </Field>
              <Field label='Cover Image'>
                <CoverImageField
                  value={fields.coverImageUrl}
                  onChange={v => set('coverImageUrl', v)}
                />
              </Field>
            </div>

            {/* SEO */}
            <div className='space-y-4 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700'>
              <p className='text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
                SEO
              </p>
              <Field
                label='Primary Keyword'
                hint='Single most important keyword'
              >
                <input
                  type='text'
                  value={fields.primaryKeyword}
                  onChange={e => set('primaryKeyword', e.target.value)}
                  className={INPUT}
                  placeholder='e.g. spotify pay per stream'
                />
              </Field>
              <Field label='Secondary Keywords' hint='Long-tail variations'>
                <KeywordInput
                  keywords={fields.secondaryKeywords}
                  onChange={v => set('secondaryKeywords', v)}
                />
              </Field>
              <Field label='SEO Title' hint='55–60 chars'>
                <input
                  type='text'
                  value={fields.seoTitle}
                  onChange={e => set('seoTitle', e.target.value)}
                  className={INPUT}
                  placeholder='Defaults to article title'
                />
                {fields.seoTitle.length > 0 && (
                  <p
                    className={`text-[10px] mt-1 ${fields.seoTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    {fields.seoTitle.length}/60
                  </p>
                )}
              </Field>
              <Field label='Meta Description' hint='150–160 chars'>
                <textarea
                  value={fields.metaDescription}
                  onChange={e =>
                    set('metaDescription', e.target.value.slice(0, 160))
                  }
                  rows={2}
                  className={INPUT}
                  placeholder='Google search snippet'
                />
                {fields.metaDescription.length > 0 && (
                  <p
                    className={`text-[10px] mt-1 ${fields.metaDescription.length < 150 ? 'text-amber-500' : 'text-gray-400'}`}
                  >
                    {fields.metaDescription.length}/160
                  </p>
                )}
              </Field>
            </div>

            {/* CTA */}
            <div className='grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700'>
              <p className='col-span-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
                Call to Action
              </p>
              <Field label='CTA Headline' hint='Leave blank for default'>
                <input
                  type='text'
                  value={fields.ctaText}
                  onChange={e => set('ctaText', e.target.value)}
                  className={INPUT}
                  placeholder='e.g. Start distributing your music'
                />
              </Field>
              <Field label='CTA Link' hint='Defaults to /'>
                <input
                  type='url'
                  value={fields.ctaLink}
                  onChange={e => set('ctaLink', e.target.value)}
                  className={INPUT}
                  placeholder='https://flemoji.com/...'
                />
              </Field>
            </div>

            {/* Linked Content */}
            <LinkedContentPanel
              articleId={initialArticle?.id}
              toolSlugs={fields.toolSlugs}
              onChange={slugs => set('toolSlugs', slugs)}
            />

            {/* Body */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <p className={LABEL}>
                  Body <span className='text-red-500 ml-0.5'>*</span>
                </p>
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
                  initialMarkdown={fields.body}
                  onChange={v => set('body', v)}
                />
              </Suspense>
            </div>

            {/* Bottom save */}
            <div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleSave}
                disabled={!canSave}
                className='px-5 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40'
              >
                {savedOk ? '✓ Saved' : saving ? 'Saving…' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Toolkit ────────────────────────────────────────────────── */}
        <div className='w-[340px] xl:w-[380px] flex-shrink-0 border-l border-gray-200 dark:border-slate-700 flex flex-col bg-gray-50 dark:bg-slate-800/50'>
          {/* Header */}
          <div className='px-4 py-3 border-b border-gray-200 dark:border-slate-700'>
            <div className='flex items-center gap-2'>
              <SparklesIcon className='w-4 h-4 text-blue-500' />
              <p className='text-xs font-bold text-gray-700 dark:text-gray-200'>
                AI Toolkit
              </p>
            </div>
            <p className='text-[11px] text-gray-400 dark:text-gray-500 mt-0.5'>
              One-click tools to write, optimise, and improve your article.
            </p>
          </div>

          {/* Action cards */}
          <div className='flex-1 overflow-y-auto px-4 py-4 space-y-3'>
            {/* ── Generate Article ─────────────────────────────────────── */}
            <div className='bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 space-y-2.5'>
              <div className='flex items-start gap-2.5'>
                <div className='w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0'>
                  <SparklesIcon className='w-4 h-4 text-blue-500' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-semibold text-gray-900 dark:text-white'>
                    Generate Article
                  </p>
                  <p className='text-[11px] text-gray-400 leading-relaxed mt-0.5'>
                    Write a full article from a topic — populates all fields.
                  </p>
                </div>
              </div>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={generateTopic}
                  onChange={e => setGenerateTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runAction('generate')}
                  placeholder={fields.title || 'e.g. how Spotify pays artists'}
                  disabled={aiStatus === 'running'}
                  className='flex-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
                />
                <RunButton
                  onClick={() => runAction('generate')}
                  loading={aiStatus === 'running' && aiAction === 'generate'}
                  disabled={aiStatus === 'running'}
                />
              </div>
            </div>

            {/* ── Fill SEO Fields ──────────────────────────────────────── */}
            <ToolCard
              icon={<MagnifyingGlassIcon className='w-4 h-4 text-purple-500' />}
              iconBg='bg-purple-50 dark:bg-purple-900/20'
              title='Fill SEO Fields'
              description='Auto-generate excerpt, SEO title, meta description, and keywords from your body.'
              onRun={() => runAction('fill_seo')}
              loading={aiStatus === 'running' && aiAction === 'fill_seo'}
              disabled={aiStatus === 'running' || !fields.body}
              disabledReason={
                !fields.body ? 'Add body content first' : undefined
              }
            />

            {/* ── Generate Outline ─────────────────────────────────────── */}
            <ToolCard
              icon={<ListBulletIcon className='w-4 h-4 text-amber-500' />}
              iconBg='bg-amber-50 dark:bg-amber-900/20'
              title='Generate Outline'
              description='Create an H2/H3 outline with section briefs before you write.'
              onRun={() => runAction('generate_outline')}
              loading={
                aiStatus === 'running' && aiAction === 'generate_outline'
              }
              disabled={aiStatus === 'running'}
            />

            {/* ── Improve Readability ──────────────────────────────────── */}
            <ToolCard
              icon={<PencilSquareIcon className='w-4 h-4 text-green-500' />}
              iconBg='bg-green-50 dark:bg-green-900/20'
              title='Improve Readability'
              description='Fix passive voice, shorten long sentences, remove jargon.'
              onRun={() => runAction('improve_readability')}
              loading={
                aiStatus === 'running' && aiAction === 'improve_readability'
              }
              disabled={aiStatus === 'running' || !fields.body}
              disabledReason={
                !fields.body ? 'Add body content first' : undefined
              }
            />

            {/* ── Suggest Internal Links ───────────────────────────────── */}
            <ToolCard
              icon={<LinkIcon className='w-4 h-4 text-rose-500' />}
              iconBg='bg-rose-50 dark:bg-rose-900/20'
              title='Suggest Internal Links'
              description='Find existing Flemoji articles to link from this one.'
              onRun={() => runAction('suggest_links')}
              loading={aiStatus === 'running' && aiAction === 'suggest_links'}
              disabled={aiStatus === 'running' || !fields.body}
              disabledReason={
                !fields.body
                  ? 'Add body content first'
                  : existingArticles.length === 0
                    ? 'No other articles to link to yet'
                    : undefined
              }
            />

            {/* ── Status / output ──────────────────────────────────────── */}
            {aiStatus !== 'idle' && (
              <div className='bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 space-y-3'>
                {aiStatus === 'running' && (
                  <div className='flex items-center justify-between gap-2'>
                    <div className='flex items-center gap-2 text-blue-600 dark:text-blue-400'>
                      <svg
                        className='w-4 h-4 animate-spin'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                        />
                      </svg>
                      <span className='text-xs font-medium'>
                        {aiAction ? ACTION_LABELS[aiAction] : 'Running…'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={cancelAction}
                      className='flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors'
                    >
                      <StopCircleIcon className='w-3.5 h-3.5' />
                      Cancel
                    </button>
                  </div>
                )}

                {aiStatus === 'done' && (
                  <div className='flex items-start gap-2 text-green-600 dark:text-green-400'>
                    <CheckCircleIcon className='w-4 h-4 flex-shrink-0 mt-0.5' />
                    <p className='text-xs'>
                      {aiAction ? ACTION_SUCCESS[aiAction] : 'Done.'}
                    </p>
                  </div>
                )}

                {aiStatus === 'error' && (
                  <div className='flex items-start gap-2 text-red-500'>
                    <ExclamationCircleIcon className='w-4 h-4 flex-shrink-0 mt-0.5' />
                    <p className='text-xs'>
                      {aiMessage || 'Something went wrong.'}
                    </p>
                  </div>
                )}

                {/* Link suggestions */}
                {linkSuggestions.length > 0 && (
                  <div className='space-y-2 pt-1 border-t border-gray-100 dark:border-slate-700'>
                    {linkSuggestions.map(s => (
                      <div
                        key={s.slug}
                        className='flex items-start justify-between gap-2 p-2 bg-gray-50 dark:bg-slate-700/60 rounded-lg'
                      >
                        <div className='flex-1 min-w-0'>
                          <p className='text-[11px] font-semibold text-gray-800 dark:text-gray-200 leading-snug truncate'>
                            {s.title}
                          </p>
                          <p className='text-[10px] text-gray-400 mt-0.5 font-mono truncate'>
                            &ldquo;{s.anchor}&rdquo;
                          </p>
                          {s.reason && (
                            <p className='text-[10px] text-gray-400 mt-0.5 leading-relaxed'>
                              {s.reason}
                            </p>
                          )}
                        </div>
                        <button
                          type='button'
                          onClick={() => insertLink(s)}
                          className='flex-shrink-0 px-2 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                        >
                          Insert
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SEO Score strip ──────────────────────────────────────────── */}
          <div className='flex-shrink-0 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'>
            <button
              type='button'
              onClick={() => setSeoOpen(v => !v)}
              className='w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors'
            >
              <div className='flex items-center gap-3'>
                <ScoreRing score={seo.score} />
                <div className='text-left'>
                  <p className='text-xs font-semibold text-gray-900 dark:text-white'>
                    SEO Score
                  </p>
                  <p className='text-[11px] text-gray-400'>
                    {seo.score >= 80
                      ? 'Looking good'
                      : seo.score >= 50
                        ? 'Needs work'
                        : 'Missing key fields'}
                  </p>
                </div>
              </div>
              <ChevronUpIcon
                className={`w-4 h-4 text-gray-400 transition-transform ${seoOpen ? '' : 'rotate-180'}`}
              />
            </button>

            {seoOpen && (
              <div className='px-4 pb-4 space-y-2'>
                {seo.checks.map(c => (
                  <div key={c.label} className='flex items-start gap-2'>
                    <span
                      className={`text-sm flex-shrink-0 leading-none mt-0.5 ${c.pass ? 'text-green-500' : 'text-red-400'}`}
                    >
                      {c.pass ? '✓' : '✗'}
                    </span>
                    <div>
                      <p
                        className={`text-[11px] font-medium leading-snug ${c.pass ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}
                      >
                        {c.label}
                      </p>
                      {!c.pass && (
                        <p className='text-[10px] text-amber-500 dark:text-amber-400 mt-0.5'>
                          {c.hint}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RunButton({
  onClick,
  loading,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className='flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors'
    >
      {loading ? (
        <svg
          className='w-3.5 h-3.5 animate-spin'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
          />
        </svg>
      ) : (
        <svg
          className='w-3.5 h-3.5'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M13 10V3L4 14h7v7l9-11h-7z'
          />
        </svg>
      )}
    </button>
  );
}

function ToolCard({
  icon,
  iconBg,
  title,
  description,
  onRun,
  loading,
  disabled,
  disabledReason,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  onRun: () => void;
  loading: boolean;
  disabled: boolean;
  disabledReason?: string;
}) {
  return (
    <div className='bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3'>
      <div className='flex items-start gap-2.5'>
        <div
          className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-xs font-semibold text-gray-900 dark:text-white'>
            {title}
          </p>
          <p className='text-[11px] text-gray-400 leading-relaxed mt-0.5'>
            {description}
          </p>
          {disabledReason && (
            <p className='text-[10px] text-amber-500 mt-1'>{disabledReason}</p>
          )}
        </div>
        <RunButton onClick={onRun} loading={loading} disabled={disabled} />
      </div>
    </div>
  );
}
