# pgvector Setup Guide for Vercel Postgres

This guide explains how to enable pgvector on your Vercel Postgres database for both local and production environments.

## 🎯 What is pgvector?

pgvector is a PostgreSQL extension that enables vector similarity search. It's essential for the AI memory system to:

- Store conversation embeddings
- Perform semantic search on past conversations
- Find relevant memories based on user queries

## 📋 Prerequisites

- Vercel Postgres database (local and/or production)
- Vercel CLI installed (for production setup)
- Node.js and yarn installed

## 🚀 Quick Start

### Option 1: Using Scripts (Recommended)

#### For Local Database:

```bash
yarn enable-pgvector:local
```

This uses your `.env.local` DATABASE_URL.

#### For Production Database:

```bash
# First, pull environment variables from Vercel
vercel env pull .env.vercel

# Then enable pgvector
yarn enable-pgvector:prod
```

Or if you have DATABASE_URL set:

```bash
DATABASE_URL="your-production-url" yarn enable-pgvector:prod
```

### Option 2: Using Prisma Migration

The migration will automatically enable pgvector when you run migrations:

```bash
# Local
yarn prisma:migrate

# Production
yarn migrate:prod
```

## 🔍 Verification

After enabling, verify pgvector is installed:

```bash
# Using the script
yarn enable-pgvector:local  # Will show if already enabled

# Or manually with psql
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

You should see output showing the vector extension is installed.

## 📝 Manual Setup (Alternative)

If the scripts don't work, you can enable pgvector manually:

### Using psql:

```bash
# Local
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Production (get URL from Vercel dashboard)
psql "your-production-database-url" -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Using Vercel CLI:

```bash
# Get database connection string
vercel env pull .env.vercel

# Connect and enable
psql $(grep DATABASE_URL .env.vercel | cut -d '=' -f2) -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

## 🛠️ Troubleshooting

### Error: "permission denied to create extension"

**Solution**: Vercel Postgres should have permissions by default. If you see this:

1. Check you're using the correct database URL
2. Ensure you're connected to the right database
3. Contact Vercel support if issue persists

### Error: "extension 'vector' does not exist"

**Solution**: This means pgvector isn't available on your PostgreSQL version:

1. Vercel Postgres should support it (uses PostgreSQL 14+)
2. Check your PostgreSQL version: `SELECT version();`
3. Contact Vercel support if needed

### Script can't find DATABASE_URL

**Solution**:

1. For local: Ensure `.env.local` has `DATABASE_URL`
2. For production: Run `vercel env pull .env.vercel` first
3. Or set `DATABASE_URL` environment variable directly

## ✅ Next Steps

After enabling pgvector:

1. **Update Prisma Schema**: Add vector columns to your models

   ```prisma
   model ConversationEmbedding {
     embedding Unsupported("vector(1536)")
   }
   ```

2. **Run Migrations**: Create tables with vector columns

   ```bash
   yarn prisma:migrate
   ```

3. **Install Dependencies**: Add embedding generation library

   ```bash
   yarn add @langchain/openai
   ```

4. **Implement Memory System**: Follow the memory implementation guide

## 📚 Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Memory Implementation Guide](./MEMORY_IMPLEMENTATION_GUIDE.md)

## 🔐 Security Notes

- Never commit `.env.vercel` or `.env.local` files
- Database URLs contain sensitive credentials
- Use environment variables in production
- The script masks passwords in output for security
