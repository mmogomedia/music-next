# Flemoji Rules Archive (Chunk 5)

## 14-testing-qa.md

# Phase 14: Testing & QA

## 🎯 Objective

Implement a comprehensive testing and quality assurance system that ensures the platform's reliability, performance, and user experience through automated testing, manual testing procedures, and continuous quality monitoring.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, & 13 completed successfully
- All platform features functional
- Development environment stable
- Testing frameworks and tools configured

## 🚀 Step-by-Step Implementation

### 1. Install Testing Dependencies

```bash
# Testing frameworks
yarn add -D jest @types/jest
yarn add -D @testing-library/react @testing-library/jest-dom
yarn add -D @testing-library/user-event
yarn add -D jest-environment-jsdom

# E2E testing
yarn add -D playwright
yarn add -D @playwright/test

# Performance testing
yarn add -D lighthouse
yarn add -D @next/bundle-analyzer

# Code quality
yarn add -D eslint-plugin-testing-library
yarn add -D eslint-plugin-jest
yarn add -D prettier
yarn add -D husky lint-staged
```

### 2. Jest Configuration

#### `jest.config.js`

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
```

### 3. Jest Setup File

#### `jest.setup.js`

```javascript
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js navigation
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

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: null,
      status: 'unauthenticated',
    };
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();
```

### 4. Unit Tests for Components

#### `src/components/__tests__/Header.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import Header from '../layout/Header'

// Mock NextAuth
jest.mock('next-auth/react')

describe('Header Component', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
  })

  it('renders header with navigation links', () => {
    render(<Header />)

    expect(screen.getByText('Flemoji')).toBeInTheDocument()
    expect(screen.getByText('Browse')).toBeInTheDocument()
    expect(screen.getByText('Artists')).toBeInTheDocument()
  })

  it('shows login button when user is not authenticated', () => {
    render(<Header />)

    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('shows dashboard link when user is authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'USER',
        },
      },
      status: 'authenticated',
    })

    render(<Header />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Login')).not.toBeInTheDocument()
  })

  it('shows artist dashboard for artist users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test Artist',
          email: 'artist@example.com',
          role: 'ARTIST',
        },
      },
      status: 'authenticated',
    })

    render(<Header />)

    expect(screen.getByText('Artist Dashboard')).toBeInTheDocument()
  })
})
```

### 5. Unit Tests for API Routes

#### `src/app/api/__tests__/auth/register.test.ts`

```typescript
import { createMocks } from 'node-mocks-http';
import { POST } from '../register/route';
import { prisma } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashed-password'),
}));

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new user successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'USER',
      },
    });

    // Mock Prisma responses
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER',
    });

    await POST(req);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toMatchObject({
      message: 'User created successfully',
      user: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
      },
    });
  });

  it('returns error for existing email', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'USER',
      },
    });

    // Mock existing user
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'existing@example.com',
    });

    await POST(req);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toMatchObject({
      error: 'User with this email already exists',
    });
  });

  it('validates required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: '',
        email: 'invalid-email',
        password: '123',
      },
    });

    await POST(req);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBeDefined();
  });
});
```

### 6. Integration Tests

#### `src/__tests__/integration/auth-flow.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('user can register and login', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Sign Up');
    await expect(page).toHaveURL('http://localhost:3000/register');

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.selectOption('select[name="role"]', 'USER');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to login
    await expect(page).toHaveURL('http://localhost:3000/login');

    // Login with new credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should be logged in and see dashboard
    await expect(page).toHaveText('Dashboard');
  });

  test('user can logout', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Click logout
    await page.click('text=Logout');

    // Should be logged out
    await expect(page).toHaveText('Login');
  });
});
```

### 7. E2E Tests with Playwright

#### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 8. E2E Test for Music Upload

#### `src/__tests__/e2e/music-upload.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Music Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as artist
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'artist@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to upload page
    await page.goto('http://localhost:3000/artist/upload');
  });

  test('artist can upload music track', async ({ page }) => {
    // Fill track information
    await page.fill('input[name="title"]', 'Test Track');
    await page.selectOption('select[name="genre"]', 'Pop');
    await page.fill('input[name="album"]', 'Test Album');
    await page.fill('textarea[name="description"]', 'A test track for testing');

    // Upload audio file
    await page.setInputFiles('input[type="file"]', {
      name: 'test-track.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('fake audio data'),
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page).toHaveText('Track uploaded successfully');
  });

  test('validates required fields', async ({ page }) => {
    // Try to submit without required fields
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page).toHaveText('Title is required');
    await expect(page).toHaveText('Genre is required');
  });

  test('handles file validation', async ({ page }) => {
    // Fill required fields
    await page.fill('input[name="title"]', 'Test Track');
    await page.selectOption('select[name="genre"]', 'Pop');

    // Try to upload invalid file
    await page.setInputFiles('input[type="file"]', {
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not audio data'),
    });

    await page.click('button[type="submit"]');

    // Should show file type error
    await expect(page).toHaveText('Please upload a valid audio file');
  });
});
```

### 9. Performance Testing

#### `src/__tests__/performance/lighthouse.test.ts`

```typescript
import { test, expect } from '@playwright/test';
import lighthouse from 'lighthouse';
import { writeFileSync } from 'fs';

test.describe('Performance Tests', () => {
  test('homepage meets performance standards', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Run Lighthouse audit
    const { lhr } = await lighthouse(page.url(), {
      port: 9222,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });

    // Performance score should be above 90
    expect(lhr.categories.performance.score).toBeGreaterThan(0.9);

    // Accessibility score should be above 95
    expect(lhr.categories.accessibility.score).toBeGreaterThan(0.95);

    // Best practices score should be above 90
    expect(lhr.categories['best-practices'].score).toBeGreaterThan(0.9);

    // SEO score should be above 90
    expect(lhr.categories.seo.score).toBeGreaterThan(0.9);

    // Save detailed report
    writeFileSync('lighthouse-report.json', JSON.stringify(lhr, null, 2));
  });

  test('music streaming performance', async ({ page }) => {
    await page.goto('http://localhost:3000/browse');

    // Measure time to interactive
    const tti = await page.evaluate(() => {
      return new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve(performance.now());
        } else {
          window.addEventListener('load', () => resolve(performance.now()));
        }
      });
    });

    expect(tti).toBeLessThan(3000); // Should load in under 3 seconds
  });
});
```

### 10. Database Testing

#### `src/__tests__/database/db-operations.test.ts`

```typescript
import { prisma } from '@/lib/db';
import {
  createTrack,
  getTrackById,
  updateTrack,
  deleteTrack,
} from '@/lib/db-operations';

describe('Database Operations', () => {
  let testTrackId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.track.deleteMany({
      where: {
        title: 'Test Track for Testing',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.track.deleteMany({
      where: {
        title: 'Test Track for Testing',
      },
    });
    await prisma.$disconnect();
  });

  describe('Track Operations', () => {
    it('creates a track successfully', async () => {
      const trackData = {
        title: 'Test Track for Testing',
        genre: 'Pop',
        duration: 180,
        artistId: 'test-artist-id',
        fileUrl: 'https://example.com/test.mp3',
        coverImageUrl: 'https://example.com/cover.jpg',
      };

      const track = await createTrack(trackData);

      expect(track).toBeDefined();
      expect(track.title).toBe(trackData.title);
      expect(track.genre).toBe(trackData.genre);

      testTrackId = track.id;
    });

    it('retrieves a track by ID', async () => {
      const track = await getTrackById(testTrackId);

      expect(track).toBeDefined();
      expect(track.id).toBe(testTrackId);
      expect(track.title).toBe('Test Track for Testing');
    });

    it('updates a track successfully', async () => {
      const updateData = {
        title: 'Updated Test Track',
        genre: 'Rock',
      };

      const updatedTrack = await updateTrack(testTrackId, updateData);

      expect(updatedTrack.title).toBe(updateData.title);
      expect(updatedTrack.genre).toBe(updateData.genre);
    });

    it('deletes a track successfully', async () => {
      await deleteTrack(testTrackId);

      const deletedTrack = await getTrackById(testTrackId);
      expect(deletedTrack).toBeNull();
    });
  });
});
```

### 11. API Testing

#### `src/__tests__/api/api-endpoints.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('authentication endpoints', async ({ request }) => {
    // Test registration
    const registerResponse = await request.post('/api/auth/register', {
      data: {
        name: 'API Test User',
        email: 'apitest@example.com',
        password: 'password123',
        role: 'USER',
      },
    });

    expect(registerResponse.ok()).toBeTruthy();

    // Test login
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'apitest@example.com',
        password: 'password123',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
  });

  test('protected endpoints require authentication', async ({ request }) => {
    // Try to access protected endpoint without auth
    const response = await request.get('/api/users/profile');
    expect(response.status()).toBe(401);
  });

  test('music upload endpoint', async ({ request }) => {
    // This would require authentication and file upload testing
    // Implementation depends on your file upload setup
  });
});
```

### 12. Test Scripts in Package.json

#### `package.json` (testing scripts)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:performance": "playwright test --grep 'Performance Tests'",
    "test:api": "playwright test --grep 'API Endpoints'",
    "test:db": "jest --testPathPattern=database",
    "test:components": "jest --testPathPattern=components",
    "test:integration": "jest --testPathPattern=integration",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky install"
  }
}
```

### 13. GitHub Actions CI/CD

#### `.github/workflows/test.yml`

```yaml
name: Test and Quality Assurance

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Setup environment
        run: |
          cp .env.example .env.local
          echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db" >> .env.local
          echo "NEXTAUTH_SECRET=test-secret" >> .env.local
          echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local

      - name: Run database migrations
        run: yarn prisma migrate deploy

      - name: Run type check
        run: yarn type-check

      - name: Run linting
        run: yarn lint

      - name: Run unit tests
        run: yarn test:ci

      - name: Run E2E tests
        run: yarn test:e2e

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  performance:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Start application
        run: yarn build && yarn start &
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: test-secret
          NEXTAUTH_URL: http://localhost:3000

      - name: Wait for app to start
        run: npx wait-on http://localhost:3000

      - name: Run performance tests
        run: yarn test:performance

      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: lighthouse-report.json
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Unit tests pass** - All component and utility tests succeed
2. **Integration tests work** - API and database integration tests pass
3. **E2E tests functional** - Complete user journey tests succeed
4. **Performance benchmarks met** - Lighthouse scores above thresholds
5. **Code coverage adequate** - Minimum 70% coverage achieved
6. **CI/CD pipeline working** - Automated testing on all commits

### Test Commands:

```bash
# Run all tests
yarn test:ci

# Run specific test types
yarn test:components
yarn test:api
yarn test:e2e

# Check code quality
yarn lint
yarn type-check
yarn format:check

# Performance testing
yarn test:performance
```

## 🚨 Common Issues & Solutions

### Issue: Tests failing in CI

**Solution**: Check environment variables, database setup, and test isolation

### Issue: E2E tests flaky

**Solution**: Add proper wait conditions, improve test stability, use test data

### Issue: Performance tests failing

**Solution**: Optimize application, check test environment, validate thresholds

### Issue: Coverage below threshold

**Solution**: Add missing tests, improve test coverage, adjust thresholds

## 📝 Notes

- Implement test data factories for consistent test data
- Use test containers for database testing
- Add visual regression testing for UI components
- Implement load testing for critical endpoints
- Consider accessibility testing with axe-core

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 15: Deployment](./15-deployment.md)

---

## 15-deployment.md

# Phase 15: Deployment

## 🎯 Objective

Implement production-ready deployment infrastructure including Docker containerization, cloud deployment (AWS/Vercel), monitoring, logging, and production optimizations to ensure the platform is scalable, secure, and maintainable in production.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, & 14 completed successfully
- All tests passing
- Code quality standards met
- Production environment configured

## 🚀 Step-by-Step Implementation

### 1. Production Environment Configuration

#### `.env.production`

```bash
# Database
DATABASE_URL="postgresql://username:password@production-host:5432/flemoji_prod"
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# NextAuth
NEXTAUTH_SECRET="your-production-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="flemoji-production-bucket"

# Stripe
STRIPE_SECRET_KEY="sk_live_your-production-stripe-key"
STRIPE_PUBLISHABLE_KEY="pk_live_your-production-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
STRIPE_PREMIUM_PRICE_ID="price_your-premium-price-id"
STRIPE_ARTIST_PRO_PRICE_ID="price_your-artist-pro-price-id"

# Redis (for caching)
REDIS_URL="redis://your-redis-host:6379"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
DATADOG_API_KEY="your-datadog-api-key"

# CDN
NEXT_PUBLIC_CDN_URL="https://your-cdn-domain.com"

# Security
CORS_ORIGIN="https://yourdomain.com"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

### 2. Docker Configuration

#### `Dockerfile`

```dockerfile
# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### `Dockerfile.dev`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["yarn", "dev"]
```

#### `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://flemoji:password@db:5432/flemoji_prod
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - flemoji-network

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=flemoji_prod
      - POSTGRES_USER=flemoji
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./prisma/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - '5432:5432'
    restart: unless-stopped
    networks:
      - flemoji-network

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - flemoji-network

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - flemoji-network

volumes:
  postgres_data:
  redis_data:

networks:
  flemoji-network:
    driver: bridge
```

### 3. Nginx Configuration

#### `nginx/nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    upstream flemoji_app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header Strict-Transport-Security "max-age=63072000" always;

        # Client max body size for file uploads
        client_max_body_size 100M;

        # Static file caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://flemoji_app;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://flemoji_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Login rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://flemoji_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Main application
        location / {
            proxy_pass http://flemoji_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support for real-time features
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### 4. Production Next.js Configuration

#### `next.config.js` (Production)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    domains: ['your-s3-bucket.s3.amazonaws.com', 'your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Bundle analyzer (only in production builds)
  ...(process.env.ANALYZE === 'true' && {
    webpack: config => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
      return config;
    },
  }),

  // Output standalone for Docker
  output: 'standalone',

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ];
  },

  // Rewrites
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health-check',
      },
    ];
  },
};

module.exports = nextConfig;
```

### 5. Health Check API

#### `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection (if using Redis)
    // const redis = new Redis(process.env.REDIS_URL!)
    // await redis.ping()

    // Check S3 connection (if using S3)
    // const s3 = new AWS.S3()
    // await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET! }).promise()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'healthy',
        redis: 'healthy',
        s3: 'healthy',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          database: 'unhealthy',
          redis: 'unhealthy',
          s3: 'unhealthy',
        },
      },
      { status: 503 }
    );
  }
}
```

### 6. Monitoring and Logging

#### `src/lib/monitoring.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

export const initMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', 'yourdomain.com'],
        }),
      ],
    });
  }
};

export const captureException = (error: Error, context?: any) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  console.error('Error:', error, context);
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info'
) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, level);
  }
  console.log(`[${level.toUpperCase()}]:`, message);
};

export const startTransaction = (name: string, operation: string) => {
  if (process.env.NODE_ENV === 'production') {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }
  return null;
};
```

#### `src/lib/logger.ts`

```typescript
import winston from 'winston';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
];

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels: logLevels,
  format,
  transports,
});

export const logRequest = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });

  next();
};
```

### 7. AWS Deployment Scripts

#### `scripts/deploy-aws.sh`

```bash
#!/bin/bash

# AWS Deployment Script
set -e

# Configuration
APP_NAME="flemoji"
REGION="us-east-1"
CLUSTER_NAME="flemoji-cluster"
SERVICE_NAME="flemoji-service"
TASK_DEFINITION="flemoji-task"

echo "🚀 Starting AWS deployment..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t $APP_NAME:latest .

# Tag image for ECR
ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$APP_NAME"
docker tag $APP_NAME:latest $ECR_REPO:latest

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO

# Push image to ECR
echo "⬆️ Pushing image to ECR..."
docker push $ECR_REPO:latest

# Update ECS task definition
echo "🔄 Updating ECS task definition..."
aws ecs register-task-definition \
  --family $TASK_DEFINITION \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --execution-role-arn arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole \
  --task-role-arn arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskRole \
  --container-definitions '[
    {
      "name": "'$APP_NAME'",
      "image": "'$ECR_REPO:latest'",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "'$DATABASE_URL'"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/'$APP_NAME'",
          "awslogs-region": "'$REGION'",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]'

# Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $TASK_DEFINITION \
  --region $REGION

# Wait for service to stabilize
echo "⏳ Waiting for service to stabilize..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: https://yourdomain.com"
```

### 8. Vercel Deployment Configuration

#### `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 9. GitHub Actions Deployment

#### `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run tests
        run: yarn test:ci

      - name: Run E2E tests
        run: yarn test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: flemoji
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster flemoji-cluster \
            --service flemoji-service \
            --force-new-deployment

      - name: Wait for deployment to complete
        run: |
          aws ecs wait services-stable \
            --cluster flemoji-cluster \
            --services flemoji-service

  deploy-vercel:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 10. Production Monitoring Dashboard

#### `src/app/admin/monitoring/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MonitoringDashboard from '@/components/admin/MonitoringDashboard'

export default async function MonitoringPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Production Monitoring
          </h1>
          <p className="mt-2 text-gray-600">
            Real-time monitoring of system performance and health
          </p>
        </div>

        <MonitoringDashboard />
      </div>
    </div>
  )
}
```

## ✅ Deployment Requirements

### Before Going Live:

1. **All tests passing** - Unit, integration, and E2E tests succeed
2. **Performance benchmarks met** - Lighthouse scores above 90
3. **Security audit passed** - No critical vulnerabilities
4. **Monitoring configured** - Logging, error tracking, and health checks
5. **Backup strategy** - Database and file backups configured
6. **SSL certificates** - HTTPS properly configured
7. **CDN setup** - Static assets served via CDN
8. **Rate limiting** - API protection implemented

### Deployment Commands:

```bash
# Docker deployment
docker-compose up -d

# AWS ECS deployment
./scripts/deploy-aws.sh

# Vercel deployment
vercel --prod

# Health check
curl https://yourdomain.com/api/health
```

## 🚨 Common Issues & Solutions

### Issue: Docker build failing

**Solution**: Check Dockerfile syntax, verify dependencies, check build context

### Issue: Database connection failing

**Solution**: Verify connection strings, check network access, validate credentials

### Issue: SSL certificate errors

**Solution**: Check certificate validity, verify domain configuration, test SSL setup

### Issue: Performance degradation

**Solution**: Enable caching, optimize database queries, implement CDN

## 📝 Notes

- Implement blue-green deployment for zero-downtime updates
- Set up automated backups and disaster recovery
- Configure alerting for critical system issues
- Implement A/B testing infrastructure
- Consider multi-region deployment for global users

## 🎉 **Project Complete!**

Congratulations! You have successfully completed all 15 phases of building your Next.js music streaming platform. Your platform now includes:

### **Complete Feature Set**

- ✅ User authentication and management
- ✅ Music upload and streaming
- ✅ Artist dashboard and analytics
- ✅ Smart links and cross-platform sharing
- ✅ Subscription system with Stripe
- ✅ Premium features and analytics
- ✅ Admin dashboard and moderation
- ✅ Comprehensive testing suite
- ✅ Production deployment infrastructure

### **Production Ready**

- 🚀 Scalable architecture
- 🔒 Security best practices
- 📊 Monitoring and logging
- 🐳 Containerized deployment
- ☁️ Cloud-ready infrastructure
- 📱 Responsive design
- ⚡ Performance optimized

### **Next Steps**

1. **Deploy to production** using the provided configurations
2. **Monitor performance** and user feedback
3. **Iterate and improve** based on real-world usage
4. **Scale infrastructure** as user base grows
5. **Add new features** based on user needs

Your platform is now ready to compete with commercial music streaming services and provide artists and listeners with a powerful, feature-rich experience!

---

## 16-artist-profile-system.md

# Artist Profile System

## Overview

A comprehensive artist profile system that allows users to create and manage their artist identity, customize their profiles, and integrate with social media and streaming platforms.

## Core Features

### 1. Single Artist Profile

- **One Profile Per User**: Each user has one artist profile that represents their musical identity
- **Profile Management**: Create, edit, and update artist profile information
- **Profile Ownership**: Profile is directly tied to user account with proper permissions
- **Profile Activation**: Users can activate/deactivate their artist profile

### 2. Artist Profile Information

- **Core Details**:
  - Artist Name (unique, display name for music)
  - Bio/Description (rich text support)
  - Profile Image (avatar)
  - Cover Image (banner/header)
  - Location (city, country)
  - Website URL
  - Genre/Style tags

- **Profile Settings**:
  - Public/Private visibility
  - Verification status
  - Active/Inactive status
  - Custom URL slug

### 3. Social Media Integration

- **Supported Platforms**:
  - Instagram (username, URL, followers, verification)
  - Twitter/X (username, URL, followers, verification)
  - TikTok (username, URL, followers, verification)
  - YouTube (channel name, URL, subscribers, verification)
  - Facebook (page name, URL, followers)
  - SoundCloud (username, URL, followers)
  - Bandcamp (artist name, URL, followers)

- **Social Links Features**:
  - Platform-specific validation
  - Follower count tracking
  - Verification badge display
  - Custom link ordering
  - Link preview generation

### 4. Streaming Platform Integration

- **Supported Platforms**:
  - Spotify (artist ID, URL, monthly listeners)
  - Apple Music (artist ID, URL, monthly listeners)
  - YouTube Music (channel ID, URL, subscribers)
  - Amazon Music (artist ID, URL)
  - Deezer (artist ID, URL)
  - Tidal (artist ID, URL)

- **Streaming Features**:
  - Platform-specific validation
  - Listener count tracking
  - Verified artist status
  - Direct link to artist pages

### 5. Analytics & Statistics

- **Profile Analytics**:
  - Total plays across all tracks
  - Total likes received
  - Total followers
  - Profile views
  - Social media engagement
  - Streaming platform performance

- **Track Analytics**:
  - Individual track performance
  - Play count by platform
  - Geographic distribution
  - Time-based analytics

## Database Schema

### ArtistProfile Model

```prisma
model ArtistProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Core Profile Information
  artistName      String    @unique
  bio             String?   @db.Text
  profileImage    String?
  coverImage      String?
  location        String?
  website         String?
  genre           String?
  slug            String?   @unique

  // Social Media & Streaming Platforms
  socialLinks     Json?
  streamingLinks  Json?

  // Profile Settings
  isPublic        Boolean   @default(true)
  isVerified      Boolean   @default(false)
  isActive        Boolean   @default(true)

  // Analytics & Stats
  totalPlays      Int       @default(0)
  totalLikes      Int       @default(0)
  totalFollowers  Int       @default(0)
  profileViews    Int       @default(0)

  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relationships
  tracks          Track[]
}
```

### Updated Track Model

```prisma
model Track {
  id              String    @id @default(cuid())
  title           String
  filePath        String
  coverImageUrl   String?
  genre           String?
  album           String?
  description     String?   @db.Text
  duration        Int?
  playCount       Int       @default(0)
  likeCount       Int       @default(0)

  // Link to artist profile
  artistProfileId String
  artistProfile   ArtistProfile @relation(fields: [artistProfileId], references: [id], onDelete: Cascade)

  // Keep user relationship for ownership
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

## API Endpoints

### Artist Profile Management

- `GET /api/artist-profile` - Get user's artist profile
- `POST /api/artist-profile` - Create artist profile
- `PUT /api/artist-profile` - Update profile
- `DELETE /api/artist-profile` - Delete profile
- `GET /api/artist-profile/[slug]` - Get public profile by slug

### Social Links Management

- `PUT /api/artist-profile/social-links` - Update social media links
- `PUT /api/artist-profile/streaming-links` - Update streaming platform links
- `GET /api/artist-profile/social-links` - Get social links
- `GET /api/artist-profile/streaming-links` - Get streaming links

### Profile Analytics

- `GET /api/artist-profile/analytics` - Get profile analytics
- `GET /api/artist-profile/stats` - Get profile statistics
- `POST /api/artist-profile/view` - Track profile view

## UI Components

### Profile Management

- `ArtistProfileForm` - Create/edit profile form
- `ArtistProfileCard` - Display profile card
- `ArtistProfileHeader` - Profile header with cover image
- `ProfileImageUpload` - Profile image upload component
- `CoverImageUpload` - Cover image upload component

### Social Links

- `SocialLinksEditor` - Edit social media links
- `StreamingLinksEditor` - Edit streaming platform links
- `SocialLinksList` - Display social links
- `StreamingLinksList` - Display streaming links
- `PlatformLinkInput` - Individual platform link input

### Profile Display

- `ArtistProfileView` - Public profile view
- `ArtistProfilePreview` - Profile preview component
- `ProfileStats` - Display profile statistics
- `ProfileAnalytics` - Analytics dashboard

## Data Structures

### Social Links JSON

```typescript
interface SocialLinks {
  instagram?: {
    username: string;
    url: string;
    followers?: number;
    verified?: boolean;
  };
  twitter?: {
    username: string;
    url: string;
    followers?: number;
    verified?: boolean;
  };
  tiktok?: {
    username: string;
    url: string;
    followers?: number;
    verified?: boolean;
  };
  youtube?: {
    channelName: string;
    url: string;
    subscribers?: number;
    verified?: boolean;
  };
  facebook?: {
    pageName: string;
    url: string;
    followers?: number;
  };
  soundcloud?: {
    username: string;
    url: string;
    followers?: number;
  };
  bandcamp?: {
    artistName: string;
    url: string;
    followers?: number;
  };
}
```

### Streaming Links JSON

```typescript
interface StreamingLinks {
  spotify?: {
    artistId: string;
    url: string;
    monthlyListeners?: number;
    verified?: boolean;
  };
  appleMusic?: {
    artistId: string;
    url: string;
    monthlyListeners?: number;
  };
  youtubeMusic?: {
    channelId: string;
    url: string;
    subscribers?: number;
  };
  amazonMusic?: {
    artistId: string;
    url: string;
  };
  deezer?: {
    artistId: string;
    url: string;
  };
  tidal?: {
    artistId: string;
    url: string;
  };
}
```

## Implementation Phases

### Phase 1: Core Profile System

1. Database schema migration
2. Basic profile CRUD operations
3. Profile creation/editing UI
4. Profile image uploads
5. Basic profile display

### Phase 2: Social Media Integration

1. Social links data structure
2. Social links editor UI
3. Platform validation
4. Social links display
5. Link preview generation

### Phase 3: Streaming Platform Integration

1. Streaming links data structure
2. Streaming links editor UI
3. Platform validation
4. Streaming links display
5. Analytics integration

### Phase 4: Advanced Features

1. Profile analytics dashboard
2. Social media sync
3. Profile verification system
4. Profile templates
5. Advanced customization options

## Future Improvements

### 1. Enhanced Social Integration

- **Auto-sync Social Stats**: Automatically update follower counts from APIs
- **Social Media Posting**: Post new releases to social platforms
- **Cross-platform Analytics**: Unified analytics across all platforms
- **Social Media Scheduling**: Schedule posts across platforms
- **Hashtag Suggestions**: AI-powered hashtag recommendations

### 2. Advanced Profile Features

- **Profile Templates**: Pre-designed profile layouts
- **Custom Themes**: User-defined color schemes and layouts
- **Profile Widgets**: Customizable profile sections
- **Profile Stories**: Instagram-style stories for artists
- **Profile Events**: Event calendar integration

### 3. Collaboration Features

- **Multi-Artist Tracks**: Support for collaborative tracks
- **Artist Networks**: Connect with other artists
- **Collaboration Requests**: Send/receive collaboration invites
- **Artist Groups**: Create artist collectives
- **Guest Features**: Invite other artists to feature on tracks

### 4. Monetization Features

- **Artist Merchandise**: Integrated merchandise store
- **Fan Subscriptions**: Monthly fan subscriptions
- **Tip Jar**: Direct fan tipping system
- **Exclusive Content**: Premium content for subscribers
- **Revenue Analytics**: Detailed revenue tracking

### 5. Discovery & Promotion

- **Artist Discovery**: Algorithm-based artist recommendations
- **Playlist Placement**: Submit tracks to playlists
- **Promotional Tools**: Marketing campaign tools
- **Fan Engagement**: Direct fan communication tools
- **Awards & Recognition**: Artist achievement system

### 6. Advanced Analytics

- **Real-time Analytics**: Live performance metrics
- **Predictive Analytics**: AI-powered insights
- **Geographic Analytics**: Location-based performance data
- **Demographic Analytics**: Fan demographic insights
- **Competitive Analysis**: Compare with other artists

### 7. Integration Enhancements

- **Music Distribution**: Direct distribution to streaming platforms
- **Sync Licensing**: Music licensing for media
- **Live Performance**: Concert and event management
- **Fan Clubs**: Exclusive fan community features
- **Newsletter Integration**: Email marketing tools

### 8. Mobile Features

- **Mobile App**: Dedicated mobile application
- **Push Notifications**: Real-time updates and alerts
- **Offline Mode**: Offline profile viewing
- **Mobile Analytics**: Mobile-specific analytics
- **QR Code Profiles**: Shareable profile QR codes

### 9. AI & Machine Learning

- **AI Profile Optimization**: AI-powered profile suggestions
- **Content Recommendations**: AI-driven content suggestions
- **Fan Behavior Analysis**: ML-powered fan insights
- **Automated Marketing**: AI-driven marketing campaigns
- **Voice Recognition**: Voice-controlled profile management

### 10. Enterprise Features

- **Label Integration**: Record label management tools
- **Team Management**: Multi-user profile management
- **White-label Solutions**: Customizable platform branding
- **API Access**: Third-party integration capabilities
- **Custom Analytics**: Tailored analytics solutions

## Technical Considerations

### Performance

- **Image Optimization**: Automatic image compression and resizing
- **Caching Strategy**: Redis caching for profile data
- **CDN Integration**: Global content delivery
- **Database Indexing**: Optimized database queries
- **Lazy Loading**: Progressive profile loading

### Security

- **Profile Verification**: Secure verification process
- **Data Validation**: Comprehensive input validation
- **Rate Limiting**: API rate limiting
- **Privacy Controls**: Granular privacy settings
- **Audit Logging**: Complete action logging

### Scalability

- **Microservices**: Modular service architecture
- **Database Sharding**: Horizontal database scaling
- **Load Balancing**: Distributed request handling
- **Caching Layers**: Multi-level caching
- **Queue Systems**: Asynchronous processing

### Monitoring

- **Performance Metrics**: Real-time performance monitoring
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: User behavior tracking
- **System Health**: Infrastructure monitoring
- **Alert Systems**: Proactive issue detection

## Success Metrics

### User Engagement

- Profile creation rate
- Profile completion rate
- Social link addition rate
- Profile view frequency
- User retention rate

### Platform Integration

- Social media link clicks
- Streaming platform redirects
- Cross-platform engagement
- Link validation success rate
- Platform API usage

### Business Impact

- User acquisition cost
- Revenue per user
- Feature adoption rate
- Customer satisfaction score
- Platform growth rate

## Conclusion

The Artist Profile System is a comprehensive solution that transforms Flemoji from a simple music upload platform into a full-featured artist management and promotion system. By providing artists with powerful tools to manage their online presence, connect with fans, and track their success, we create a platform that artists will want to use and fans will want to engage with.

The modular design allows for incremental implementation while the extensive future improvements roadmap ensures long-term platform growth and user satisfaction.

---

## 17-artist-profile-user-journeys.md

# 17-artist-profile-user-journeys.md - Artist Profile User Journeys

## 🎯 Overview

Complete user journey documentation for artist profile creation, management, and sharing within the Flemoji music platform.

## 🚀 User Journey 1: Creating an Artist Profile

### **Entry Points:**

1. **Artist Dashboard** → "Profile" tab → "Create Artist Profile" button
2. **Artist Dashboard** → Overview → "Manage Profile" quick action card
3. **Direct URL** → `/artist-profile` (redirects to dashboard if not authenticated)

### **Step-by-Step Flow:**

#### **Step 1: Access Profile Creation**

- User navigates to Artist Dashboard
- Clicks "Profile" tab or "Manage Profile" quick action
- Sees "Create Your Artist Profile" card with call-to-action

#### **Step 2: Fill Profile Information**

- **Artist Name** (required): Unique display name for music
- **Bio**: Optional description of music style and story
- **Profile Image URL**: Optional profile picture
- **Cover Image URL**: Optional banner/cover image
- **Location**: Optional city, country
- **Website**: Optional personal website
- **Genre**: Optional primary music genre
- **Custom URL Slug**: Optional custom URL (e.g., `flemoji.com/artist/my-custom-name`)

#### **Step 3: Form Validation**

- Real-time validation for required fields
- URL validation for website and image URLs
- Slug validation (letters, numbers, hyphens only)
- Duplicate name/slug checking

#### **Step 4: Profile Creation**

- API call to `POST /api/artist-profile`
- Success: Profile created and user redirected to overview
- Error: Display specific error message with retry option

#### **Step 5: Post-Creation Actions**

- Profile overview displayed with stats
- Quick action buttons for editing, social links, streaming platforms
- Option to add social media and streaming platform links

---

## 🎯 User Journey 2: Editing an Artist Profile

### **Entry Points:**

1. **Profile Overview** → "Edit Profile" button
2. **Profile Overview** → "Edit Profile" quick action
3. **Artist Dashboard** → Profile tab → "Edit Profile" button

### **Step-by-Step Flow:**

#### **Step 1: Access Profile Editing**

- User clicks "Edit Profile" from any entry point
- Form pre-populated with existing profile data
- All fields editable with current values

#### **Step 2: Modify Profile Information**

- Update any profile field (same as creation form)
- Real-time validation and error handling
- Slug generation from artist name if needed

#### **Step 3: Save Changes**

- API call to `PUT /api/artist-profile`
- Success: Updated profile displayed
- Error: Specific error message with retry option

#### **Step 4: Confirmation**

- Success message or automatic redirect to overview
- Updated profile information visible immediately

---

## 🎯 User Journey 3: Managing Social Media Links

### **Entry Points:**

1. **Profile Overview** → "Social Links" button
2. **Profile Overview** → "Social Links" quick action
3. **Artist Dashboard** → Profile tab → "Social Links" button

### **Step-by-Step Flow:**

#### **Step 1: Access Social Links Editor**

- User clicks "Social Links" from profile overview
- Social links editor opens with current links (if any)

#### **Step 2: Add/Edit Social Platforms**

- **Supported Platforms:**
  - Instagram (@username, URL, followers, verified status)
  - Twitter/X (@username, URL, followers, verified status)
  - TikTok (@username, URL, followers, verified status)
  - YouTube (Channel name, URL, subscribers, verified status)
  - Facebook (Page name, URL, followers)
  - SoundCloud (@username, URL, followers)
  - Bandcamp (Artist name, URL, followers)

#### **Step 3: Platform Management**

- Click "Add [Platform]" to add new platform
- Fill in username/name, URL, follower count, verification status
- Auto-generate username from URL for supported platforms
- Remove platforms with "Remove" button

#### **Step 4: Save Social Links**

- API call to `PUT /api/artist-profile/social-links`
- Success: Updated links displayed in profile
- Error: Specific error message with retry option

---

## 🎯 User Journey 4: Managing Streaming Platform Links

### **Entry Points:**

1. **Profile Overview** → "Streaming Platforms" button
2. **Profile Overview** → "Streaming Platforms" quick action
3. **Artist Dashboard** → Profile tab → "Streaming Platforms" button

### **Step-by-Step Flow:**

#### **Step 1: Access Streaming Links Editor**

- User clicks "Streaming Platforms" from profile overview
- Streaming links editor opens with current links (if any)

#### **Step 2: Add/Edit Streaming Platforms**

- **Supported Platforms:**
  - Spotify (Artist ID, URL, monthly listeners, verified status)
  - Apple Music (Artist ID, URL, monthly listeners)
  - YouTube Music (Channel ID, URL, subscribers)
  - Amazon Music (Artist ID, URL)
  - Deezer (Artist ID, URL)
  - Tidal (Artist ID, URL)

#### **Step 3: Platform Management**

- Click "Add [Platform]" to add new platform
- Fill in artist/channel ID, URL, listener count, verification status
- Auto-extract ID from URL for supported platforms
- Remove platforms with "Remove" button

#### **Step 4: Save Streaming Links**

- API call to `PUT /api/artist-profile/streaming-links`
- Success: Updated links displayed in profile
- Error: Specific error message with retry option

---

## 🎯 User Journey 5: Viewing Public Artist Profile

### **Entry Points:**

1. **Direct URL** → `flemoji.com/artist/[slug]`
2. **Shared Link** → From social media, messaging, etc.
3. **Search Results** → Future search functionality

### **Step-by-Step Flow:**

#### **Step 1: Access Public Profile**

- User visits public profile URL
- Profile loads with artist information and stats

#### **Step 2: View Profile Information**

- **Profile Header**: Artist name, profile image, bio
- **Stats Display**: Total plays, likes, followers, profile views
- **Social Links**: Clickable social media platform links
- **Streaming Links**: Clickable streaming platform links
- **Recent Tracks**: List of artist's recent uploads

#### **Step 3: Interact with Profile**

- **Play All**: Play all artist tracks (future functionality)
- **Follow**: Follow the artist (future functionality)
- **Share**: Share profile URL via native sharing or copy to clipboard

#### **Step 4: Navigation**

- **Go Back**: Return to previous page
- **Artist Dashboard**: If viewing own profile, link to dashboard

---

## 🎯 User Journey 6: Profile Analytics and Stats

### **Entry Points:**

1. **Profile Overview** → "View Analytics" button
2. **Artist Dashboard** → Analytics tab (future)

### **Step-by-Step Flow:**

#### **Step 1: Access Analytics**

- User clicks "View Analytics" from profile overview
- Analytics dashboard loads with profile performance data

#### **Step 2: View Profile Metrics**

- **Profile Stats**: Total plays, likes, followers, profile views
- **Track Performance**: Individual track statistics
- **Monthly Trends**: Play count trends over time
- **Top Tracks**: Best performing tracks

#### **Step 3: Analyze Performance**

- Review growth trends and engagement metrics
- Identify top-performing content
- Track follower and view growth

---

## 🔧 Technical Implementation Details

### **API Endpoints Used:**

- `GET /api/artist-profile` - Fetch user's profile
- `POST /api/artist-profile` - Create new profile
- `PUT /api/artist-profile` - Update existing profile
- `DELETE /api/artist-profile` - Delete profile
- `PUT /api/artist-profile/social-links` - Update social links
- `PUT /api/artist-profile/streaming-links` - Update streaming links
- `GET /api/artist-profile/[slug]` - Fetch public profile by slug

### **State Management:**

- **`useArtistProfile` Hook**: Centralized profile state management
- **Local State**: Form data, loading states, error handling
- **Real-time Updates**: Profile changes reflected immediately

### **Error Handling:**

- **Network Errors**: Retry mechanisms and user-friendly messages
- **Validation Errors**: Real-time form validation with specific error messages
- **Permission Errors**: Clear messaging for unauthorized actions

### **User Experience Features:**

- **Loading States**: Spinners and skeleton screens during data fetching
- **Success Feedback**: Confirmation messages for successful actions
- **Error Recovery**: Clear error messages with retry options
- **Form Persistence**: Form data preserved during navigation
- **Auto-save**: Optional auto-save functionality for long forms

---

## 🎨 UI/UX Considerations

### **Responsive Design:**

- **Mobile**: Stacked layout with touch-friendly buttons
- **Tablet**: Two-column layout with optimized spacing
- **Desktop**: Full three-column layout with sidebar

### **Accessibility:**

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant color schemes
- **Focus Management**: Clear focus indicators and logical tab order

### **Performance:**

- **Lazy Loading**: Images and non-critical content loaded on demand
- **Caching**: Profile data cached for faster subsequent loads
- **Optimistic Updates**: UI updates immediately with rollback on error

---

## 🚀 Future Enhancements

### **Phase 2 Features:**

- **Profile Verification**: Artist verification system
- **Advanced Analytics**: Detailed charts and insights
- **Profile Customization**: Themes, layouts, and widgets
- **Social Integration**: Auto-sync with social media APIs
- **Collaboration**: Multi-artist profile management

### **Phase 3 Features:**

- **Profile Stories**: Instagram-style stories for artists
- **Live Streaming**: Integration with live streaming platforms
- **Merchandise**: Integrated merchandise store
- **Fan Subscriptions**: Monthly fan subscription system
- **Event Management**: Concert and event calendar

---

## 📱 Mobile-Specific Considerations

### **Touch Interactions:**

- **Swipe Gestures**: Swipe between profile sections
- **Touch Targets**: Minimum 44px touch targets for all buttons
- **Pull to Refresh**: Refresh profile data with pull gesture

### **Mobile Navigation:**

- **Bottom Tab Bar**: Easy access to main profile sections
- **Floating Action Button**: Quick access to edit profile
- **Swipe Navigation**: Swipe between profile tabs

### **Performance:**

- **Image Optimization**: Compressed images for mobile
- **Lazy Loading**: Progressive loading of profile content
- **Offline Support**: Basic profile viewing when offline

---

## ✅ Success Metrics

### **User Engagement:**

- **Profile Creation Rate**: % of users who create profiles
- **Profile Completion Rate**: % of users who complete all profile fields
- **Social Link Addition**: % of users who add social media links
- **Profile View Duration**: Average time spent viewing profiles

### **Technical Performance:**

- **Page Load Time**: < 2 seconds for profile pages
- **API Response Time**: < 500ms for profile operations
- **Error Rate**: < 1% for profile-related operations
- **Mobile Performance**: 90+ Lighthouse score on mobile

This comprehensive user journey documentation ensures a smooth, intuitive experience for artists managing their profiles on the Flemoji platform.

---

## 18-playlist-management-system.md

# Phase 18: Playlist Management System

## 🎯 Objective

Implement a comprehensive playlist management system that allows admins to create, curate, and manage playlists while enabling artists to submit tracks for consideration. The system will power the main landing page with featured content and provide a robust content curation platform.

## 📋 Prerequisites

- Phase 1-17 completed successfully
- Admin dashboard functional
- Artist dashboard functional
- Music upload and streaming system working
- User authentication and role management in place

## 🚀 System Overview

### **Playlist Types & Limits**

#### **Genre Playlists**

- **Limit**: Unlimited
- **Max Tracks**: Configurable (10, 15, 20, 50, 100)
- **Purpose**: Curate music by specific genres
- **Examples**: "Amapiano Hits", "Gqom Essentials", "Afro House Vibes"

#### **Featured Playlists**

- **Limit**: 1 active
- **Max Tracks**: 3-5 tracks
- **Purpose**: Highlight premium content on landing page
- **Display**: Carousel format on main page
- **Examples**: "Editor's Choice", "This Week's Favorites"

#### **Top Ten Playlists**

- **Limit**: 1 active
- **Max Tracks**: 10 tracks
- **Purpose**: Showcase trending/popular content
- **Display**: Grid format on main page
- **Examples**: "Top 10 This Week", "Most Played"

#### **Province Playlists**

- **Limit**: 9 active (one per province)
- **Max Tracks**: Configurable (10, 15, 20, 50, 100)
- **Purpose**: Geographic-based music curation
- **Provinces**: Western Cape, Eastern Cape, Northern Cape, Free State, KwaZulu-Natal, North West, Gauteng, Mpumalanga, Limpopo
- **Examples**: "Cape Town Sounds", "Joburg Beats", "Durban Vibes"

### **Playlist States**

#### **Active/Inactive**

- **Active**: Visible on landing page and available for submissions
- **Inactive**: Hidden from public view, not accepting submissions

#### **Submission Status**

- **Open**: Accepting artist submissions
- **Closed**: Not accepting submissions (admin can still add tracks manually)

### **Track Submission Limits**

- **Per Artist**: Configurable (e.g., 1-5 tracks per playlist)
- **Per Playlist**: Based on playlist max tracks setting
- **Submission Window**: When playlist is open for submissions

## 🎵 Playlist Features

### **Required Fields**

- **Name**: Playlist title
- **Description**: Brief description of playlist content
- **Type**: Genre, Featured, Top Ten, or Province
- **Cover Image**: Visual representation (required)
- **Max Tracks**: 10, 15, 20, 50, or 100
- **Status**: Active/Inactive
- **Submission Status**: Open/Closed
- **Max Submissions per Artist**: 1-5 tracks
- **Province** (if applicable): For province playlists

### **Admin Controls**

- **Create/Edit/Delete**: Full playlist management
- **Toggle Active Status**: Show/hide from landing page
- **Toggle Submission Status**: Open/close for submissions
- **Review Submissions**: Accept/Reject/Shortlist with comments
- **Manual Track Addition**: Add tracks directly to playlists
- **Reorder Tracks**: Change track order within playlists
- **Analytics View**: Track playlist performance

### **Artist Submission Process**

1. **Browse Available Playlists**: View open playlists for submission
2. **Select Tracks**: Choose tracks to submit (within limits)
3. **Submit**: Send tracks for admin review
4. **Track Status**: Monitor submission status
5. **Resubmit**: Submit different tracks if rejected

## 🏗️ Technical Architecture

### **Database Schema**

```typescript
// Playlist Types
enum PlaylistType {
  GENRE = 'genre',
  FEATURED = 'featured',
  TOP_TEN = 'top_ten',
  PROVINCE = 'province',
}

// Playlist Status
enum PlaylistStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// Submission Status
enum SubmissionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

// Track Submission Status
enum TrackSubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SHORTLISTED = 'shortlisted',
}

// Main Playlist Model
interface Playlist {
  id: string;
  name: string;
  description: string;
  type: PlaylistType;
  coverImage: string; // R2 URL
  maxTracks: number; // 10, 15, 20, 50, 100
  currentTracks: number;
  status: PlaylistStatus;
  submissionStatus: SubmissionStatus;
  maxSubmissionsPerArtist: number; // 1-5
  province?: string; // For province playlists
  createdBy: string; // Admin ID
  createdAt: Date;
  updatedAt: Date;
  order: number; // For display ordering
}

// Track Submission Model
interface PlaylistSubmission {
  id: string;
  playlistId: string;
  trackId: string;
  artistId: string;
  status: TrackSubmissionStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin ID
  adminComment?: string;
  artistComment?: string; // Optional artist note
}

// Playlist Track Model (approved tracks)
interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  order: number; // Position in playlist
  addedAt: Date;
  addedBy: string; // Admin ID or 'submission'
  submissionId?: string; // If added via submission
}

// Playlist Analytics Model
interface PlaylistAnalytics {
  id: string;
  playlistId: string;
  date: Date;
  views: number;
  plays: number;
  likes: number;
  shares: number;
  uniqueListeners: number;
}
```

### **API Endpoints**

#### **Admin Playlist Management**

```
GET    /api/admin/playlists              # List all playlists
POST   /api/admin/playlists              # Create playlist
GET    /api/admin/playlists/[id]         # Get playlist details
PUT    /api/admin/playlists/[id]         # Update playlist
DELETE /api/admin/playlists/[id]         # Delete playlist
POST   /api/admin/playlists/[id]/tracks  # Add track manually
DELETE /api/admin/playlists/[id]/tracks/[trackId] # Remove track
PUT    /api/admin/playlists/[id]/tracks/reorder # Reorder tracks
```

#### **Submission Management**

```
GET    /api/admin/playlists/[id]/submissions     # Get submissions
PUT    /api/admin/submissions/[id]/review        # Review submission
GET    /api/admin/submissions                    # All pending submissions
```

#### **Artist Submission**

```
GET    /api/playlists/available          # Get open playlists
POST   /api/playlists/[id]/submit        # Submit tracks
GET    /api/playlists/submissions        # Get artist's submissions
```

#### **Public Playlist Access**

```
GET    /api/playlists/featured           # Featured playlists
GET    /api/playlists/top-ten            # Top ten playlist
GET    /api/playlists/province/[province] # Province playlists
GET    /api/playlists/genre/[genre]      # Genre playlists
GET    /api/playlists/[id]               # Get playlist details
```

### **Landing Page Integration**

#### **Display Order**

1. **Featured Playlist**: Carousel (3-5 tracks)
2. **Top Ten Playlist**: Grid format (10 tracks)
3. **Province Playlists**: Grid of 9 province playlists
4. **Genre Playlists**: Grid of genre playlists

#### **Component Structure**

```
LandingPage
├── FeaturedPlaylistCarousel
├── TopTenPlaylist
├── ProvincePlaylistsGrid
└── GenrePlaylistsGrid
```

## 🔧 Implementation Phases

### **Phase 18.1: Database & API Setup**

- Create playlist database schema
- Implement playlist CRUD APIs
- Set up submission system APIs

### **Phase 18.2: Admin Dashboard Integration**

- Add playlist management to admin dashboard
- Implement submission review interface
- Add playlist analytics dashboard

### **Phase 18.3: Artist Submission System**

- Add submission interface to artist dashboard
- Implement track selection and submission flow
- Add submission status tracking

### **Phase 18.4: Landing Page Integration**

- Create playlist display components
- Implement carousel and grid layouts
- Add playlist navigation and filtering

### **Phase 18.5: Analytics & Optimization**

- Implement playlist analytics tracking
- Add performance monitoring
- Optimize playlist loading and caching

## 📊 Analytics & Monitoring

### **Playlist Metrics**

- **Views**: How many times playlist was viewed
- **Plays**: Total track plays from playlist
- **Likes**: Playlist likes and track likes
- **Shares**: Playlist sharing activity
- **Unique Listeners**: Distinct users who listened
- **Completion Rate**: How many tracks were played fully

### **Submission Metrics**

- **Submission Volume**: Tracks submitted per playlist
- **Approval Rate**: Percentage of approved submissions
- **Review Time**: Average time to review submissions
- **Artist Engagement**: Most active submitting artists

## 🔒 Security & Permissions

### **Admin Permissions**

- Full playlist management access
- Submission review and approval
- Analytics and reporting access
- System configuration access

### **Artist Permissions**

- Submit to open playlists
- View own submission status
- Limited playlist browsing (public playlists only)

### **Public Access**

- View active playlists
- Play tracks from playlists
- Like and share playlists
- No submission or management access

## 📝 Notes

- All playlists require cover images for visual appeal
- Province playlists are limited to 9 (one per South African province)
- Featured playlists are limited to 1 active at a time
- Top ten playlists are limited to 1 active at a time
- Genre playlists have no limit but should be curated for quality
- All playlist changes are logged for audit purposes
- Playlist analytics are tracked daily for performance monitoring

## 🔗 Next Phase

Once this phase is complete, proceed to [Phase 19: Admin Playlist Curation Interface](./19-admin-playlist-curation.md)

---
