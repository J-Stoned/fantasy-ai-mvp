import '@testing-library/jest-dom';

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/fantasy_ai_test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    league: {
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    team: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    player: {
      upsert: jest.fn(),
    },
    roster: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userSubscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    subscriptionUsage: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

// Mock OpenAI
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                // PlayerAnalysis format
                projectedPoints: 18.5,
                confidence: 0.85,
                narrativeInsights: ['Mock insight 1', 'Mock insight 2'],
                riskFactors: ['Mock risk factor'],
                opportunities: ['Mock opportunity'],
                matchupAnalysis: 'Mock matchup analysis',
                // LineupNarrative format
                overallStory: 'Mock overall story',
                keyPlayers: [{ name: 'Mock Player', narrative: 'Mock narrative', impact: 'positive' }],
                gameScripts: { 'Team1 vs Team2': 'Mock game script' },
                riskAssessment: 'Mock risk assessment',
                confidenceLevel: 0.75,
                // TradeAnalysis format
                recommendation: 'accept',
                reasoning: ['Mock reasoning'],
                valueAssessment: 'Mock value assessment',
                alternativeOptions: ['Mock alternative'],
                confidenceScore: 0.8,
                // VoiceResponse format
                response: 'Mock voice response',
                actions: [{ type: 'mock_action', data: {} }],
                followUp: ['Mock follow-up']
              })
            }
          }]
        })
      }
    }
  }))
}));

// Mock Stripe
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test123',
          url: 'https://checkout.stripe.com/test'
        }),
      },
    },
    subscriptions: {
      cancel: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          url: 'https://billing.stripe.com/test'
        }),
      },
    },
    accounts: {
      retrieve: jest.fn().mockResolvedValue({ id: 'acct_test' }),
    },
  })),
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
  })
) as jest.Mock;