# Flemoji Music Streaming Platform

This repository contains the development rules and guidelines for building the Flemoji music streaming platform using Next.js and TypeScript.

- Start with the rules index: `rules/README.md`
- Each phase has its own detailed guide in `rules/`

Quick links:

- Design System: `rules/00-ui-design-system.md`
- Project Setup: `rules/01-project-setup.md`
- Auth Setup: `rules/02-authentication-setup.md`
- Admin Dashboard: `rules/12-admin-dashboard.md`
- Dashboard System: `rules/07-dashboard-system.md`
- API Client & Utilities: `rules/25-api-client-and-utilities.md`

## 🔐 NextAuth Secret Key Setup

Before running the application, you need to set up a secure NextAuth secret key for authentication.

### Quick Setup

1. **Generate a secure key:**

   ```bash
   openssl rand -base64 32
   ```

2. **Create or update your `.env.local` file:**

   ```bash
   # NextAuth Configuration
   NEXTAUTH_SECRET="your-generated-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # Database
   DATABASE_URL="your-database-url-here"
   ```

3. **Alternative key generation methods:**

   ```bash
   # Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

   # Using Python
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

### Security Best Practices

- ✅ **Never commit secrets to version control** - `.env.local` should be in `.gitignore`
- ✅ **Use different secrets for different environments** (dev, staging, production)
- ✅ **Rotate secrets regularly** if compromised
- ✅ **Use strong, random secrets** (at least 32 characters)

### Production Deployment

For production, set these environment variables in your deployment platform:

- `NEXTAUTH_URL` should be your actual domain (e.g., `https://yourdomain.com`)
- Use a different, secure secret for production
- Store secrets securely in your deployment platform's environment variables

Notes:

- This repo currently documents the system; application code is not included yet.
- Follow the phases sequentially as outlined in `rules/README.md`.

## 👤 Admin Login & Role-Based Redirects

The platform features an intelligent role-based redirect system that automatically directs users to the appropriate dashboard based on their role.

### Admin Users

- **Credentials**: `dev@dev.com` / `dev` (development only)
- **Login Flow**: Automatic redirect to `/admin/dashboard`
- **No Profile Creation**: Skip profile selection screen entirely
- **Access**: Full admin panel with user management, content moderation, and system analytics

### Regular Users & Artists

- **Login Flow**: Continue to normal dashboard flow
- **Profile Creation**: Create appropriate profile type if needed
- **Access**: Role-appropriate dashboard features

### Quick Admin Setup

```bash
# Create admin account
yarn create-admin

# Or use the seed script
yarn db:seed
```

For detailed information, see [Admin Dashboard Rules](./rules/12-admin-dashboard.md) and [Authentication Setup](./rules/02-authentication-setup.md).

## 🚀 Centralized API Client

The platform features a centralized API client system that eliminates code duplication and provides consistent API communication:

### **Key Features**

- **Single API Client**: Centralized HTTP methods with automatic authentication
- **Error Handling**: Custom error types with consistent error responses
- **Image Upload Utility**: Centralized image upload to Cloudflare R2
- **TypeScript Support**: Fully typed API calls and responses
- **Timeout & Retry**: Built-in request timeout and error handling

### **Usage Examples**

```typescript
import { api } from '@/lib/api-client';

// Simple API calls
const playlists = await api.playlists.getTopTen();
const newPlaylist = await api.admin.createPlaylist(data);

// Image upload
import { uploadImageToR2 } from '@/lib/image-upload';
const imageKey = await uploadImageToR2(file);
```

### **Benefits**

- ✅ **Eliminated 150+ lines** of duplicate code
- ✅ **Consistent error handling** across all components
- ✅ **Automatic authentication** using NextAuth.js
- ✅ **Better maintainability** with single source of truth

For detailed documentation, see [API Client & Utilities](./rules/25-api-client-and-utilities.md).
