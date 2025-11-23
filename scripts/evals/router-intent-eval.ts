import { RouterAgent } from '@/lib/ai/agents/router-agent';

async function runEval() {
  const agent = new RouterAgent('azure-openai');
  const scenarios = [
    'Play my latest upload',
    'Recommend soulful women empowerment songs',
    'How do publishing splits work?',
    'Show me amapiano party tracks',
    'What is the weather in Cape Town?',
  ];

  for (const prompt of scenarios) {
    const decision = agent.getRoutingDecision(prompt);
    console.log(
      `[router-eval] "${prompt}" -> intent=${decision.intent}, agent=${decision.agent}, confidence=${decision.confidence.toFixed(
        2
      )}`
    );
  }
}

runEval();
