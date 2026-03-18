# Authentication Tests

This directory contains comprehensive tests for all authentication processes in the Flemoji application.

## Test Files

### 1. Registration Tests (`register/__tests__/route.test.ts`)

Tests for user registration API endpoint:

- ✅ Successful registration with valid data
- ✅ Optional name field handling
- ✅ Validation errors (invalid email, weak password, mismatched passwords, terms not accepted)
- ✅ Duplicate email detection
- ✅ Rate limiting (429 when exceeded)
- ✅ Error handling (database errors, email service failures)

**Coverage:** 10 test cases

### 2. Email Verification Tests (`verify-email/__tests__/route.test.ts`)

Tests for email verification endpoint:

- ✅ Successful email verification
- ✅ Already verified email handling
- ✅ Invalid token handling
- ✅ Expired token handling
- ✅ Error handling

**Coverage:** 5 test cases

### 3. Forgot Password Tests (`forgot-password/__tests__/route.test.ts`)

Tests for password reset request endpoint:

- ✅ Successful password reset email sending
- ✅ Security: returns success even for non-existent users (prevents email enumeration)
- ✅ Validation errors (invalid email, missing email)
- ✅ Rate limiting
- ✅ Error handling

**Coverage:** 5 test cases

### 4. Reset Password Tests (`reset-password/__tests__/route.test.ts`)

Tests for password reset completion endpoint:

- ✅ Successful password reset
- ✅ Validation errors (weak password, mismatched passwords, missing token)
- ✅ Invalid token handling
- ✅ Expired token handling
- ✅ User not found handling
- ✅ Rate limiting
- ✅ Error handling

**Coverage:** 8 test cases

### 5. Authentication Logic Tests (`../../lib/__tests__/auth.test.ts`)

Tests for NextAuth credentials provider logic:

- ✅ Successful login with email
- ✅ Successful login with username
- ✅ Failed login attempts tracking
- ✅ Account lockout after max failed attempts
- ✅ Inactive account rejection
- ✅ Locked account rejection
- ✅ Login after lockout period expires
- ✅ User not found handling
- ✅ User without password handling

**Coverage:** 9 test cases

## Running Tests

Run all authentication tests:

```bash
yarn test --testPathPatterns="auth"
```

Run specific test file:

```bash
yarn test src/app/api/auth/register/__tests__/route.test.ts
```

Run with coverage:

```bash
yarn test --testPathPatterns="auth" --coverage
```

## Test Coverage

**Total: 41 test cases** covering:

- User registration flow
- Email verification flow
- Password reset flow
- Authentication/authorization logic
- Rate limiting
- Error handling
- Security best practices

## Key Testing Patterns

1. **Mocking Strategy:**
   - Prisma client is mocked for all database operations
   - Email service is mocked to prevent actual email sending
   - Rate limiting is mocked for predictable test behavior
   - NextResponse is mocked for API route testing

2. **Request/Response Handling:**
   - Custom Request/Response mocks in `jest.setup.js` for API route testing
   - TextEncoder/TextDecoder polyfills for Web API compatibility

3. **Security Testing:**
   - Tests verify that password hashes are never returned in responses
   - Tests verify email enumeration prevention
   - Tests verify account lockout mechanisms

## Notes

- All tests use Jest with React Testing Library patterns
- Tests are isolated and don't require a running database
- Email sending failures don't fail registration (tested)
- Rate limiting is tested to prevent abuse
