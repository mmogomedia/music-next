/**
 * MCP change-webhook emitter (Flemoji → Picasite).
 *
 * On article create/update/publish/delete, POST an HMAC-signed change event to
 * every registered, non-revoked `McpClient` that has a `webhookUrl`. The body
 * shape is the contract's `WebhookPayloadSchema`; the signature is computed over
 * the EXACT raw JSON string sent on the wire so the receiver can re-verify it.
 *
 * Webhook delivery is best-effort: per-client failures are caught and logged so
 * a failing endpoint never breaks the underlying article operation.
 */

import { prisma } from '@/lib/db';
import { hmacSign } from './crypto';
import {
  WebhookPayloadSchema,
  ClusterWebhookPayloadSchema,
  type WebhookEvent,
  type WebhookPayload,
  type ClusterWebhookEvent,
  type ClusterWebhookPayload,
} from './contract';

/** Header carrying the HMAC-SHA256 signature of the raw request body. */
const SIGNATURE_HEADER = 'X-Flemoji-Signature';

/** Arguments describing the article change that triggered the event. */
export interface EmitArticleEventArgs {
  articleId: string;
  slug: string;
  contentHash: string;
  changedFields?: string[];
}

/**
 * Emit an `article.*` change event to all registered webhook clients.
 *
 * For every non-revoked `McpClient` with a `webhookUrl`, builds the contract
 * payload, signs the raw body with that client's `webhookSecret`, and POSTs it.
 * Errors are swallowed per-client; this function never throws.
 */
export async function emitArticleEvent(
  event: WebhookEvent,
  args: EmitArticleEventArgs
): Promise<void> {
  let clients: Array<{
    webhookUrl: string | null;
    webhookSecret: string | null;
  }>;
  try {
    clients = await prisma.mcpClient.findMany({
      where: { revokedAt: null, webhookUrl: { not: null } },
      select: { webhookUrl: true, webhookSecret: true },
    });
  } catch (error) {
    console.error('[MCP webhook] failed to load clients:', error);
    return;
  }

  if (clients.length === 0) return;

  const payload: WebhookPayload = WebhookPayloadSchema.parse({
    siteId: process.env.MCP_SITE_ID ?? 'flemoji',
    event,
    articleId: args.articleId,
    slug: args.slug,
    contentHash: args.contentHash,
    changedFields: args.changedFields ?? [],
    at: new Date().toISOString(),
  });

  // Serialize ONCE so the signature is computed over the exact bytes we send.
  const rawBody = JSON.stringify(payload);

  await Promise.all(
    clients.map(async client => {
      if (!client.webhookUrl) return;
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (client.webhookSecret) {
          headers[SIGNATURE_HEADER] = hmacSign(client.webhookSecret, rawBody);
        }
        await fetch(client.webhookUrl, {
          method: 'POST',
          headers,
          body: rawBody,
        });
      } catch (error) {
        // Best-effort: a failing endpoint must not break the article op.
        console.error(
          `[MCP webhook] delivery failed for ${client.webhookUrl}:`,
          error
        );
      }
    })
  );
}

/** Arguments describing the cluster change that triggered the event. */
export interface EmitClusterEventArgs {
  clusterId: string;
  slug: string;
  contentHash: string;
  changedFields?: string[];
}

/**
 * Emit a `cluster.*` change event to all registered webhook clients.
 *
 * Mirrors `emitArticleEvent`: for every non-revoked `McpClient` with a
 * `webhookUrl`, builds the contract's `ClusterWebhookPayload`, signs the raw
 * body with that client's `webhookSecret`, and POSTs it. Errors are swallowed
 * per-client; this function never throws.
 */
export async function emitClusterEvent(
  event: ClusterWebhookEvent,
  args: EmitClusterEventArgs
): Promise<void> {
  let clients: Array<{
    webhookUrl: string | null;
    webhookSecret: string | null;
  }>;
  try {
    clients = await prisma.mcpClient.findMany({
      where: { revokedAt: null, webhookUrl: { not: null } },
      select: { webhookUrl: true, webhookSecret: true },
    });
  } catch (error) {
    console.error('[MCP webhook] failed to load clients:', error);
    return;
  }

  if (clients.length === 0) return;

  const payload: ClusterWebhookPayload = ClusterWebhookPayloadSchema.parse({
    siteId: process.env.MCP_SITE_ID ?? 'flemoji',
    event,
    clusterId: args.clusterId,
    slug: args.slug,
    contentHash: args.contentHash,
    changedFields: args.changedFields ?? [],
    at: new Date().toISOString(),
  });

  // Serialize ONCE so the signature is computed over the exact bytes we send.
  const rawBody = JSON.stringify(payload);

  await Promise.all(
    clients.map(async client => {
      if (!client.webhookUrl) return;
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (client.webhookSecret) {
          headers[SIGNATURE_HEADER] = hmacSign(client.webhookSecret, rawBody);
        }
        await fetch(client.webhookUrl, {
          method: 'POST',
          headers,
          body: rawBody,
        });
      } catch (error) {
        // Best-effort: a failing endpoint must not break the cluster op.
        console.error(
          `[MCP webhook] delivery failed for ${client.webhookUrl}:`,
          error
        );
      }
    })
  );
}
