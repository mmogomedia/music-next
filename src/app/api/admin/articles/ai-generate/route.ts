import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AzureOpenAI } from 'openai';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Azure OpenAI client ────────────────────────────────────────────────────────

function createClient(): AzureOpenAI {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint =
    process.env.AZURE_OPENAI_ENDPOINT ||
    (process.env.AZURE_OPENAI_API_INSTANCE_NAME
      ? `https://${process.env.AZURE_OPENAI_API_INSTANCE_NAME}.openai.azure.com`
      : undefined);
  const deployment = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview';

  if (!apiKey || !endpoint || !deployment) {
    throw new Error(
      'Azure OpenAI not configured. Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT (or AZURE_OPENAI_API_INSTANCE_NAME), and AZURE_OPENAI_API_DEPLOYMENT_NAME.'
    );
  }

  return new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion });
}

const DEPLOYMENT = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-5-mini';

// ── System prompt ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert SEO content writer and editor for Flemoji, South Africa's leading music discovery and artist promotion platform.

Your job is to help create high-quality, SEO-optimised articles that educate independent South African artists about the music industry — royalties, streaming, promotion, distribution, publishing, and business.

## PLATFORM CONTEXT
- Flemoji connects fans with South African artists across genres like Afrobeats, Amapiano, Hip-Hop, Jazz, Gospel, and more
- Articles are grouped into "clusters": a PILLAR article (comprehensive guide, 2,000–3,000 words) supported by SPOKE articles (focused topics, 1,000–1,500 words)
- All articles target independent South African artists and music professionals
- Content must be factually accurate, practical, and immediately actionable

## WRITING STYLE
- Second person ("you", "your") — speak directly to the artist
- Plain, clear language — avoid jargon without explanation
- Use real numbers, examples, and step-by-step guidance
- South African context where relevant (SAMRO, CAPASSO, local distributors, rand amounts)

## SEO RULES
- Primary keyword: must appear in the title, first 100 words, and at least one ## heading
- SEO title: 55–60 characters, primary keyword near the start
- Meta description: 150–160 characters, include primary keyword + a clear benefit
- Excerpt: 1–2 sentences, max 160 characters
- Secondary keywords: used naturally in the body, not stuffed

When generating articles, always call the update_article_fields function with the complete content.
For outlines or partial requests, still call the function with whatever you have — populate as many fields as possible.`;

// ── Tool definitions (OpenAI format) ──────────────────────────────────────────

const ARTICLE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'update_article_fields',
    description:
      'Populate the article form with generated content. Call this whenever article content is ready — even for partial drafts or outlines.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description:
            'Clear, keyword-rich article title. Under 70 characters.',
        },
        excerpt: {
          type: 'string',
          description:
            '1–2 sentence summary shown in previews. Max 160 characters.',
        },
        seo_title: {
          type: 'string',
          description:
            'SEO page title for Google. 55–60 characters. Primary keyword near the start.',
        },
        meta_description: {
          type: 'string',
          description:
            'Google snippet. 150–160 characters. Include primary keyword and a benefit.',
        },
        primary_keyword: {
          type: 'string',
          description: 'Single main keyword, e.g. "spotify pay per stream".',
        },
        secondary_keywords: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Supporting long-tail keywords used naturally in the body.',
        },
        cluster_role: {
          type: 'string',
          enum: ['PILLAR', 'SPOKE'],
          description:
            'PILLAR = comprehensive guide (2,000–3,000 words). SPOKE = focused topic (1,000–1,500 words).',
        },
        cta_text: {
          type: 'string',
          description: 'Optional custom call-to-action headline.',
        },
        cta_link: {
          type: 'string',
          description: 'Optional URL the CTA button links to.',
        },
        body: {
          type: 'string',
          description:
            'Full article body in Markdown. Use ## for H2, ### for H3. Include intro and summary.',
        },
      },
      required: ['title', 'body'],
    },
  },
};

const LINK_SUGGESTIONS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'suggest_internal_links',
    description:
      'Suggest internal links for the article. Anchor text must appear verbatim in the article body.',
    parameters: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              anchor: {
                type: 'string',
                description:
                  'Exact text from the article body to use as anchor',
              },
              slug: {
                type: 'string',
                description: 'Slug of the existing article to link to',
              },
              title: {
                type: 'string',
                description: 'Title of the article being linked',
              },
              reason: {
                type: 'string',
                description:
                  'One sentence explaining why this link is relevant',
              },
            },
            required: ['anchor', 'slug', 'title'],
          },
          description: '3–5 high-quality internal link suggestions',
        },
      },
      required: ['suggestions'],
    },
  },
};

// ── Action types ───────────────────────────────────────────────────────────────

type Action =
  | 'generate'
  | 'fill_seo'
  | 'generate_outline'
  | 'improve_readability'
  | 'suggest_links';

interface ArticleState {
  title?: string;
  body?: string;
  primaryKeyword?: string;
  excerpt?: string;
  seoTitle?: string;
  metaDescription?: string;
  secondaryKeywords?: string[];
  clusterRole?: 'PILLAR' | 'SPOKE';
}

interface ExistingArticle {
  title: string;
  slug: string;
  excerpt?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerateRequest {
  // Legacy chat / freeform mode
  message?: string;
  conversationHistory?: ChatMessage[];
  // Toolkit action mode
  action?: Action;
  generateTopic?: string;
  articleState?: ArticleState;
  existingArticles?: ExistingArticle[];
  // Shared cluster context
  context?: {
    clusterName?: string;
    clusterDescription?: string;
    clusterGoal?: string;
    clusterKeywords?: string[];
  };
}

function buildActionMessage(action: Action, req: GenerateRequest): string {
  const s = req.articleState ?? {};
  const role = s.clusterRole ?? 'SPOKE';
  const kw = s.primaryKeyword ?? '';

  switch (action) {
    case 'generate': {
      const topic =
        req.generateTopic || s.title || 'independent music in South Africa';
      return `Write a complete ${role} article about: "${topic}".${kw ? ` Primary keyword: "${kw}".` : ''} Populate all fields using update_article_fields.`;
    }
    case 'fill_seo': {
      return `Analyze this article and call update_article_fields with ONLY these SEO fields: excerpt, seo_title, meta_description, primary_keyword, secondary_keywords. Do NOT include title or body in the function call.\n\nTitle: ${s.title || '(untitled)'}\n\nBody:\n${s.body || '(empty)'}`;
    }
    case 'generate_outline': {
      const topic =
        s.title || req.generateTopic || 'music industry in South Africa';
      return `Create a detailed article outline for a ${role} article about: "${topic}".${kw ? ` Primary keyword: "${kw}".` : ''}\n\nCall update_article_fields with: title, primary_keyword, secondary_keywords, cluster_role, seo_title, meta_description, excerpt, and a body that is the full outline. Use ## for H2 sections and ### for H3 subsections. Each section should have 2–3 bullet points describing what to cover. Write [WRITE HERE] as a placeholder instead of actual prose.`;
    }
    case 'improve_readability': {
      return `Improve the readability of this article body:\n- Rewrite passive voice → active voice\n- Split sentences over 25 words into shorter ones\n- Replace unexplained jargon with plain English\n- Keep all headings, facts, examples, and structure intact\n\nCall update_article_fields with only the improved body field.\n\nTitle: ${s.title || '(untitled)'}\n\nBody:\n${s.body || '(empty)'}`;
    }
    case 'suggest_links': {
      const articleList = (req.existingArticles ?? [])
        .map(
          a =>
            `- "${a.title}" → slug: ${a.slug}${a.excerpt ? ` | ${a.excerpt.slice(0, 80)}` : ''}`
        )
        .join('\n');
      return `Find 3–5 places in this article body where a link to an existing Flemoji article would genuinely help the reader. The anchor text must appear verbatim in the article body. Call suggest_internal_links with your suggestions.\n\nArticle title: ${s.title || '(untitled)'}\nBody:\n${s.body || '(empty)'}\n\nExisting articles:\n${articleList || '(none available)'}`;
    }
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
    });
  }

  let client: AzureOpenAI;
  try {
    client = createClient();
  } catch (err) {
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error ? err.message : 'Azure OpenAI not configured',
      }),
      { status: 503 }
    );
  }

  const { message, conversationHistory = [], context, action } = body;

  // Build system prompt with optional cluster context
  let systemPrompt = SYSTEM_PROMPT;
  if (context?.clusterName) {
    systemPrompt += `\n\n## ACTIVE CLUSTER\nCluster: "${context.clusterName}"`;
    if (context.clusterDescription)
      systemPrompt += `\nDescription: ${context.clusterDescription}`;
    if (context.clusterGoal) systemPrompt += `\nGoal: ${context.clusterGoal}`;
    if (context.clusterKeywords?.length)
      systemPrompt += `\nTarget keywords: ${context.clusterKeywords.join(', ')}`;
  }

  const userMessage = action
    ? buildActionMessage(action, body)
    : (message ?? '');
  const tools: ChatCompletionTool[] =
    action === 'suggest_links' ? [LINK_SUGGESTIONS_TOOL] : [ARTICLE_TOOL];

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* stream already closed */
        }
      };

      try {
        const completion = await client.chat.completions.create({
          model: DEPLOYMENT,
          messages,
          tools,
          tool_choice: 'auto',
          stream: true,
        });

        // Accumulate streamed tool call arguments per index
        const toolCalls: Record<number, { name: string; arguments: string }> =
          {};

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          // Stream text tokens
          if (delta.content) {
            send({ type: 'text', content: delta.content });
          }

          // Accumulate tool call deltas
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCalls[idx]) {
                toolCalls[idx] = {
                  name: tc.function?.name ?? '',
                  arguments: '',
                };
              }
              if (tc.function?.name) toolCalls[idx].name = tc.function.name;
              if (tc.function?.arguments)
                toolCalls[idx].arguments += tc.function.arguments;
            }
          }

          // When finish_reason = tool_calls, all arguments are accumulated
          const finishReason = chunk.choices[0]?.finish_reason;
          if (finishReason === 'tool_calls') {
            for (const tc of Object.values(toolCalls)) {
              try {
                const args = JSON.parse(tc.arguments);
                if (tc.name === 'update_article_fields') {
                  send({ type: 'article_fields', data: args });
                } else if (tc.name === 'suggest_internal_links') {
                  send({
                    type: 'link_suggestions',
                    data: args.suggestions ?? [],
                  });
                }
              } catch {
                /* ignore malformed JSON */
              }
            }
          }
        }

        send({ type: 'done' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed';
        send({ type: 'error', message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
