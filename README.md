# Flemoji Music Streaming Platform

This repository contains the development rules and guidelines for building the Flemoji music streaming platform using Next.js and TypeScript.

- Start with the rules index: `rules/README.md`
- Each phase has its own detailed guide in `rules/`

Quick links:

- Design System: `rules/00-ui-design-system.md`
- Project Setup: `rules/01-project-setup.md`
- Auth Setup: `rules/02-authentication-setup.md`

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
