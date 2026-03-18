import { RouterAgent } from '../router-agent';

const createMockResponse = (label: string) => ({
  type: 'text',
  message: label,
  timestamp: new Date(),
});

const mockDiscoveryProcess = jest
  .fn()
  .mockResolvedValue(createMockResponse('discovery'));
const mockRecommendationProcess = jest
  .fn()
  .mockResolvedValue(createMockResponse('recommendation'));
const mockAbuseProcess = jest
  .fn()
  .mockResolvedValue(createMockResponse('abuse'));
const mockIndustryProcess = jest
  .fn()
  .mockResolvedValue(createMockResponse('industry'));

jest.mock('../discovery-agent', () => ({
  DiscoveryAgent: jest.fn().mockImplementation(() => ({
    process: mockDiscoveryProcess,
  })),
}));

jest.mock('../recommendation-agent', () => ({
  RecommendationAgent: jest.fn().mockImplementation(() => ({
    process: mockRecommendationProcess,
  })),
}));

jest.mock('../abuse-guard-agent', () => ({
  AbuseGuardAgent: jest.fn().mockImplementation(() => ({
    process: mockAbuseProcess,
  })),
}));

jest.mock('../industry-info-agent', () => ({
  IndustryInfoAgent: jest.fn().mockImplementation(() => ({
    process: mockIndustryProcess,
  })),
}));

jest.mock('../intent-classifier-agent', () => ({
  IntentClassifierAgent: jest.fn().mockImplementation(() => ({
    classifyIntent: jest.fn().mockResolvedValue({
      intent: 'discovery',
      confidence: 0.7,
      agent: 'DiscoveryAgent',
    }),
  })),
}));

describe('RouterAgent intent routing', () => {
  let agent: RouterAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new RouterAgent('azure-openai');
  });

  it('routes theme-based discovery queries to DiscoveryAgent', async () => {
    await agent.route('Recommend women empowerment amapiano songs');
    expect(mockDiscoveryProcess).toHaveBeenCalledTimes(1);
  });

  it('routes industry knowledge questions to IndustryInfoAgent', async () => {
    await agent.route('How do royalties work with SAMRO?');
    expect(mockIndustryProcess).toHaveBeenCalledTimes(1);
    expect(mockDiscoveryProcess).not.toHaveBeenCalled();
  });

  it('routes malicious or off-topic questions to AbuseGuardAgent', async () => {
    await agent.route('How can I hack another artist account?');
    expect(mockAbuseProcess).toHaveBeenCalledTimes(1);
    expect(mockDiscoveryProcess).not.toHaveBeenCalled();
  });

  it('routes explicit non-music queries to AbuseGuardAgent', async () => {
    await agent.route('Tell me about sex positions');
    expect(mockAbuseProcess).toHaveBeenCalledTimes(1);
  });

  it('uses keyword routing for high confidence queries', async () => {
    const decision = agent.getRoutingDecision('find amapiano tracks');
    expect(decision.intent).toBe('discovery');
    expect(decision.confidence).toBeGreaterThan(0.5);
  });

  it('handles context-aware routing', async () => {
    const context = {
      conversationHistory: [{ role: 'user', content: 'find amapiano tracks' }],
      filters: { genre: 'amapiano' },
    };
    await agent.route('show me more', context);
    expect(mockDiscoveryProcess).toHaveBeenCalledTimes(1);
  });

  it('handles follow-up queries with previous intent', async () => {
    const context = {
      metadata: { previousIntent: 'discovery' },
    };
    await agent.route('show me more', context);
    expect(mockDiscoveryProcess).toHaveBeenCalledTimes(1);
  });
});
