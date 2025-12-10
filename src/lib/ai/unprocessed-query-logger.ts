import { prisma } from '@/lib/db';

export type UnprocessedReason =
  | 'malicious'
  | 'non_music'
  | 'knowledge_feature_not_ready'
  | 'unsupported_query'
  | 'other';

interface LogParams {
  userId?: string;
  message: string;
  response: string;
  agent: string;
  reason: UnprocessedReason;
}

export async function logUnprocessedQuery({
  userId,
  message,
  response,
  agent,
  reason,
}: LogParams): Promise<void> {
  try {
    await prisma.unprocessedQueryLog.create({
      data: {
        userId: userId || null,
        message,
        response,
        agent,
        reason,
      },
    });
  } catch (error) {
    console.error('Failed to log unprocessed query:', error);
  }
}
