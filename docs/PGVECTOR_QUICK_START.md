# pgvector Quick Start

## 🚀 Enable pgvector on Vercel Postgres

### For Local Database:

```bash
yarn enable-pgvector:local
```

### For Production Database:

```bash
# Option 1: Using Vercel CLI (recommended)
vercel env pull .env.vercel
yarn enable-pgvector:prod

# Option 2: With explicit DATABASE_URL
DATABASE_URL="postgresql://..." yarn enable-pgvector:prod
```

## ✅ Verify Installation

The script will automatically verify and show:

- ✅ Extension status
- 📌 pgvector version
- ✨ Success message

## 📝 What Happens

1. Script connects to your database
2. Checks if pgvector is already enabled
3. If not, runs `CREATE EXTENSION IF NOT EXISTS vector;`
4. Verifies installation
5. Shows version information

## 🔄 Using Prisma Migration

Alternatively, pgvector will be enabled automatically when you run:

```bash
# Local
yarn prisma:migrate

# Production
yarn migrate:prod
```

The migration file `20260203191124_enable_pgvector` will enable the extension.

## 🛠️ Troubleshooting

**Can't find DATABASE_URL?**

- Local: Check `.env.local` has `DATABASE_URL`
- Production: Run `vercel env pull .env.vercel` first

**Permission denied?**

- Vercel Postgres should have permissions by default
- Contact Vercel support if issue persists

**Extension not found?**

- Vercel Postgres supports pgvector (PostgreSQL 14+)
- Check PostgreSQL version if needed

## 📚 Next Steps

After enabling pgvector:

1. Add vector columns to Prisma schema
2. Run migrations
3. Install `@langchain/openai` for embeddings
4. Implement memory system

See [PGVECTOR_SETUP.md](./PGVECTOR_SETUP.md) for detailed guide.
