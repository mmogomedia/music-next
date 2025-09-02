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
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

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
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

### 3. Jest Setup File

#### `jest.setup.js`
```javascript
import '@testing-library/jest-dom'

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
    }
  },
}))

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
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: null,
      status: 'unauthenticated',
    }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.URL.createObjectURL = jest.fn(() => 'mocked-url')
global.URL.revokeObjectURL = jest.fn()
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
import { createMocks } from 'node-mocks-http'
import { POST } from '../register/route'
import { prisma } from '@/lib/db'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashed-password'),
}))

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a new user successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'USER',
      },
    })

    // Mock Prisma responses
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER',
    })

    await POST(req)

    expect(res._getStatusCode()).toBe(201)
    expect(JSON.parse(res._getData())).toMatchObject({
      message: 'User created successfully',
      user: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
      },
    })
  })

  it('returns error for existing email', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'USER',
      },
    })

    // Mock existing user
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'existing@example.com',
    })

    await POST(req)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toMatchObject({
      error: 'User with this email already exists',
    })
  })

  it('validates required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: '',
        email: 'invalid-email',
        password: '123',
      },
    })

    await POST(req)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBeDefined()
  })
})
```

### 6. Integration Tests

#### `src/__tests__/integration/auth-flow.test.ts`
```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('user can register and login', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Sign Up')
    await expect(page).toHaveURL('http://localhost:3000/register')

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.selectOption('select[name="role"]', 'USER')
    
    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to login
    await expect(page).toHaveURL('http://localhost:3000/login')

    // Login with new credentials
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Should be logged in and see dashboard
    await expect(page).toHaveText('Dashboard')
  })

  test('user can logout', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Click logout
    await page.click('text=Logout')

    // Should be logged out
    await expect(page).toHaveText('Login')
  })
})
```

### 7. E2E Tests with Playwright

#### `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test'

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
})
```

### 8. E2E Test for Music Upload

#### `src/__tests__/e2e/music-upload.test.ts`
```typescript
import { test, expect } from '@playwright/test'

test.describe('Music Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as artist
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'artist@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Navigate to upload page
    await page.goto('http://localhost:3000/artist/upload')
  })

  test('artist can upload music track', async ({ page }) => {
    // Fill track information
    await page.fill('input[name="title"]', 'Test Track')
    await page.selectOption('select[name="genre"]', 'Pop')
    await page.fill('input[name="album"]', 'Test Album')
    await page.fill('textarea[name="description"]', 'A test track for testing')

    // Upload audio file
    await page.setInputFiles('input[type="file"]', {
      name: 'test-track.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('fake audio data'),
    })

    // Submit form
    await page.click('button[type="submit"]')

    // Should show success message
    await expect(page).toHaveText('Track uploaded successfully')
  })

  test('validates required fields', async ({ page }) => {
    // Try to submit without required fields
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page).toHaveText('Title is required')
    await expect(page).toHaveText('Genre is required')
  })

  test('handles file validation', async ({ page }) => {
    // Fill required fields
    await page.fill('input[name="title"]', 'Test Track')
    await page.selectOption('select[name="genre"]', 'Pop')

    // Try to upload invalid file
    await page.setInputFiles('input[type="file"]', {
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not audio data'),
    })

    await page.click('button[type="submit"]')

    // Should show file type error
    await expect(page).toHaveText('Please upload a valid audio file')
  })
})
```

### 9. Performance Testing

#### `src/__tests__/performance/lighthouse.test.ts`
```typescript
import { test, expect } from '@playwright/test'
import lighthouse from 'lighthouse'
import { writeFileSync } from 'fs'

test.describe('Performance Tests', () => {
  test('homepage meets performance standards', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Run Lighthouse audit
    const { lhr } = await lighthouse(page.url(), {
      port: 9222,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    })

    // Performance score should be above 90
    expect(lhr.categories.performance.score).toBeGreaterThan(0.9)
    
    // Accessibility score should be above 95
    expect(lhr.categories.accessibility.score).toBeGreaterThan(0.95)
    
    // Best practices score should be above 90
    expect(lhr.categories['best-practices'].score).toBeGreaterThan(0.9)
    
    // SEO score should be above 90
    expect(lhr.categories.seo.score).toBeGreaterThan(0.9)

    // Save detailed report
    writeFileSync(
      'lighthouse-report.json',
      JSON.stringify(lhr, null, 2)
    )
  })

  test('music streaming performance', async ({ page }) => {
    await page.goto('http://localhost:3000/browse')
    
    // Measure time to interactive
    const tti = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve(performance.now())
        } else {
          window.addEventListener('load', () => resolve(performance.now()))
        }
      })
    })

    expect(tti).toBeLessThan(3000) // Should load in under 3 seconds
  })
})
```

### 10. Database Testing

#### `src/__tests__/database/db-operations.test.ts`
```typescript
import { prisma } from '@/lib/db'
import { 
  createTrack, 
  getTrackById, 
  updateTrack, 
  deleteTrack 
} from '@/lib/db-operations'

describe('Database Operations', () => {
  let testTrackId: string

  beforeAll(async () => {
    // Clean up test data
    await prisma.track.deleteMany({
      where: {
        title: 'Test Track for Testing',
      },
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.track.deleteMany({
      where: {
        title: 'Test Track for Testing',
      },
    })
    await prisma.$disconnect()
  })

  describe('Track Operations', () => {
    it('creates a track successfully', async () => {
      const trackData = {
        title: 'Test Track for Testing',
        genre: 'Pop',
        duration: 180,
        artistId: 'test-artist-id',
        fileUrl: 'https://example.com/test.mp3',
        coverImageUrl: 'https://example.com/cover.jpg',
      }

      const track = await createTrack(trackData)
      
      expect(track).toBeDefined()
      expect(track.title).toBe(trackData.title)
      expect(track.genre).toBe(trackData.genre)
      
      testTrackId = track.id
    })

    it('retrieves a track by ID', async () => {
      const track = await getTrackById(testTrackId)
      
      expect(track).toBeDefined()
      expect(track.id).toBe(testTrackId)
      expect(track.title).toBe('Test Track for Testing')
    })

    it('updates a track successfully', async () => {
      const updateData = {
        title: 'Updated Test Track',
        genre: 'Rock',
      }

      const updatedTrack = await updateTrack(testTrackId, updateData)
      
      expect(updatedTrack.title).toBe(updateData.title)
      expect(updatedTrack.genre).toBe(updateData.genre)
    })

    it('deletes a track successfully', async () => {
      await deleteTrack(testTrackId)
      
      const deletedTrack = await getTrackById(testTrackId)
      expect(deletedTrack).toBeNull()
    })
  })
})
```

### 11. API Testing

#### `src/__tests__/api/api-endpoints.test.ts`
```typescript
import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  test('health check endpoint', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data.status).toBe('ok')
  })

  test('authentication endpoints', async ({ request }) => {
    // Test registration
    const registerResponse = await request.post('/api/auth/register', {
      data: {
        name: 'API Test User',
        email: 'apitest@example.com',
        password: 'password123',
        role: 'USER',
      },
    })
    
    expect(registerResponse.ok()).toBeTruthy()
    
    // Test login
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'apitest@example.com',
        password: 'password123',
      },
    })
    
    expect(loginResponse.ok()).toBeTruthy()
  })

  test('protected endpoints require authentication', async ({ request }) => {
    // Try to access protected endpoint without auth
    const response = await request.get('/api/users/profile')
    expect(response.status()).toBe(401)
  })

  test('music upload endpoint', async ({ request }) => {
    // This would require authentication and file upload testing
    // Implementation depends on your file upload setup
  })
})
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
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

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
