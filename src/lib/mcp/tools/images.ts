/**
 * MCP image tool — `ingest_image`.
 *
 * Accepts base64-encoded bytes OR a remote URL (which is fetched), enforces the
 * same ≤5MB image limit as the existing upload route, and stores the bytes into
 * Cloudflare R2 under `image/mcp/{uuid}.{ext}`. Returns `{ key, url }` matching
 * `IngestImageOutputSchema`.
 *
 * The R2 client/bucket/env config and public-URL construction are reused from
 * the existing image-upload route (`src/app/api/upload/image/route.ts`) and
 * `src/lib/url-utils.ts` — no S3 client is re-initialised differently here.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { McpError } from '../auth';
import { IngestImageInputSchema, type IngestImageOutput } from '../contract';
import { constructFileUrl } from '@/lib/url-utils';
import { wrapTool, type ToolRegistrar } from './types';

/** Max image size, mirroring the existing upload route (5MB). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * S3 client targeting Cloudflare R2 — identical config to the existing
 * `src/app/api/upload/image/route.ts` route (same env vars).
 */
const s3Client = new S3Client({
  region: process.env.R2_REGION!,
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/** Map a content-type to a sensible file extension. */
function extensionForContentType(contentType: string): string {
  const normalized = contentType.split(';')[0].trim().toLowerCase();
  switch (normalized) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/svg+xml':
      return 'svg';
    case 'image/avif':
      return 'avif';
    default:
      return '';
  }
}

interface ResolvedImage {
  buffer: Buffer;
  contentType: string;
}

/** Decode base64 bytes into a buffer, validating size + that it's an image. */
function resolveFromBase64(bytesBase64: string): ResolvedImage {
  let buffer: Buffer;
  try {
    buffer = Buffer.from(bytesBase64, 'base64');
  } catch {
    throw new McpError('bad_request', 'Invalid base64 image data', 400);
  }
  if (buffer.length === 0) {
    throw new McpError('bad_request', 'Decoded image is empty', 400);
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new McpError(
      'bad_request',
      'Image too large. Maximum size is 5MB.',
      400
    );
  }
  // Base64 path carries no content-type; default to PNG (binary-safe).
  return { buffer, contentType: 'image/png' };
}

/** Fetch a remote URL into a buffer, validating it's a sized image. */
async function resolveFromUrl(url: string): Promise<ResolvedImage> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new McpError('bad_request', `Failed to fetch image URL: ${url}`, 400);
  }
  if (!response.ok) {
    throw new McpError(
      'bad_request',
      `Failed to fetch image URL (status ${response.status})`,
      400
    );
  }

  const contentType =
    response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ??
    '';
  if (!contentType.startsWith('image/')) {
    throw new McpError(
      'bad_request',
      `URL did not return an image (content-type: ${contentType || 'unknown'})`,
      400
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length === 0) {
    throw new McpError('bad_request', 'Fetched image is empty', 400);
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new McpError(
      'bad_request',
      'Image too large. Maximum size is 5MB.',
      400
    );
  }
  return { buffer, contentType };
}

/**
 * Registrar for the `ingest_image` tool (scope `articles:write`).
 */
export const registerImageTools: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'ingest_image',
    {
      description:
        'Ingest an image (base64 bytes or a remote URL) into R2 storage and ' +
        'return its stored key + public URL. Used for article hero/social images.',
      inputSchema: IngestImageInputSchema.shape,
    },
    wrapTool(
      { name: 'ingest_image', scopes: ['articles:write'], ctx },
      async (rawArgs): Promise<IngestImageOutput> => {
        const parsed = IngestImageInputSchema.safeParse(rawArgs);
        if (!parsed.success) {
          throw new McpError(
            'bad_request',
            parsed.error.issues[0]?.message ?? 'Invalid ingest_image input',
            400
          );
        }
        const { bytesBase64, url } = parsed.data;

        const resolved = bytesBase64
          ? resolveFromBase64(bytesBase64)
          : await resolveFromUrl(url as string);

        const ext = extensionForContentType(resolved.contentType) || 'png';
        const key = `image/mcp/${uuidv4()}.${ext}`;

        const bucket = process.env.R2_BUCKET_NAME;
        if (!bucket) {
          throw new McpError(
            'internal',
            'R2_BUCKET_NAME is not configured',
            500
          );
        }

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: resolved.buffer,
            ContentType: resolved.contentType,
          })
        );

        return { key, url: constructFileUrl(key) };
      }
    )
  );
};
