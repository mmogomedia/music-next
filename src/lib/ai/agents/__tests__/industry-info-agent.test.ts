import { IndustryInfoAgent } from '../industry-info-agent';
import { logUnprocessedQuery } from '@/lib/ai/unprocessed-query-logger';

jest.mock('@/lib/ai/unprocessed-query-logger', () => ({
  logUnprocessedQuery: jest.fn(),
}));

describe('IndustryInfoAgent', () => {
  const agent = new IndustryInfoAgent();

  beforeEach(() => {
    (logUnprocessedQuery as jest.Mock).mockClear();
  });

  it('logs placeholder response for industry questions', async () => {
    const response = await agent.process('Tell me about publishing splits');
    expect(response).toMatchObject({ type: 'text' });
    expect(logUnprocessedQuery).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'knowledge_feature_not_ready' })
    );
  });
});
