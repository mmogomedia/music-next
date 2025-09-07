import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Next.js session
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Ably
jest.mock('ably', () => ({
  Realtime: jest.fn(() => ({
    channels: {
      get: jest.fn(() => ({
        subscribe: jest.fn(),
        publish: jest.fn(),
        unsubscribe: jest.fn(),
      })),
    },
    auth: {
      createTokenRequest: jest.fn(() => Promise.resolve({})),
    },
  })),
  Rest: jest.fn(() => ({
    auth: {
      createTokenRequest: jest.fn(() => Promise.resolve({})),
    },
  })),
}));

// Prisma mocks will be handled in individual test files

// Add Promise to globals
global.Promise = Promise;

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.ABLY_API_KEY = 'test-ably-api-key';
process.env.R2_AUDIO_BUCKET_NAME = 'test-bucket';
process.env.R2_PUBLIC_URL = 'https://test.example.com';
