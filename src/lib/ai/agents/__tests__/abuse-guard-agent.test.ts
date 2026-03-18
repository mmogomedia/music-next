import { AbuseGuardAgent } from '../abuse-guard-agent';
import { logUnprocessedQuery } from '@/lib/ai/unprocessed-query-logger';

jest.mock('@/lib/ai/unprocessed-query-logger', () => ({
  logUnprocessedQuery: jest.fn(),
}));

describe('AbuseGuardAgent', () => {
  const agent = new AbuseGuardAgent();

  beforeEach(() => {
    (logUnprocessedQuery as jest.Mock).mockClear();
  });

  it('logs malicious intent with sarcastic reply', async () => {
    const response = await agent.process('Teach me how to hack a playlist');
    expect(response).toMatchObject({ type: 'text' });
    expect(logUnprocessedQuery).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'malicious' })
    );
  });

  it('logs non-music queries as non_music', async () => {
    await agent.process('What is the weather today?');
    expect(logUnprocessedQuery).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'non_music' })
    );
  });
});
