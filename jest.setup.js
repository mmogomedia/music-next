import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Simple Request/Response mocks for API route tests
// These are minimal implementations that work with Next.js API routes
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Map();
      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
      this._body = init.body || null;
    }

    async json() {
      if (this._body) {
        return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
      }
      return {};
    }

    async text() {
      return this._body || '';
    }
  };

  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Map();
      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
  };
}

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
