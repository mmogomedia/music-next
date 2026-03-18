# How to Verify pgvector in Your Database

## Quick Checks

### 1. Check if pgvector Extension is Installed

```sql
-- Check if extension exists
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Expected Result:**

```
 oid  | extname | extowner | extnamespace | extrelocatable | extversion | extconfig | extcondition
------+---------+----------+--------------+----------------+------------+-----------+--------------
 352256 | vector  | 16387   | 2200        | t              | 0.8.0      |           |
```

### 2. Check Extension Version

```sql
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

**Expected Result:**

```
 extname | extversion
---------+------------
 vector  | 0.8.0
```

### 3. List All Installed Extensions

```sql
SELECT extname, extversion FROM pg_extension ORDER BY extname;
```

This shows all extensions, including `vector` if it's installed.

### 4. Check Available Vector Functions

```sql
-- List all functions related to vector
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE '%vector%'
ORDER BY proname;
```

**Expected Functions:**

- `vector_cosine_ops`
- `vector_l2_ops`
- `vector_inner_product_ops`
- `vector_<=>` (cosine distance operator)
- `vector<->` (L2 distance operator)
- `vector<#>` (inner product operator)

### 5. Test Vector Operations (Once You Have Vector Columns)

```sql
-- Test creating a vector (if you have vector columns)
-- This is just to verify the extension works
SELECT '[1,2,3]'::vector(3);
```

**Expected Result:**

```
  vector
----------
 [1,2,3]
```

### 6. Check for Vector Columns in Your Schema

```sql
-- Find all columns with vector type
SELECT
  table_schema,
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE udt_name = 'vector'
ORDER BY table_schema, table_name, column_name;
```

**Note:** This will be empty until you add vector columns to your Prisma schema and run migrations.

### 7. Check for Vector Indexes

```sql
-- Find indexes using vector operators
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexdef LIKE '%vector%'
ORDER BY schemaname, tablename;
```

**Note:** This will be empty until you create indexes on vector columns.

## Using psql Command Line

### Local Database:

```bash
psql -d flemoji -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
```

### Production Database:

```bash
# Get DATABASE_URL from .env.production
DATABASE_URL=$(grep "^DATABASE_URL=" .env.production | cut -d'=' -f2 | tr -d '"')
psql "$DATABASE_URL" -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
```

## Using Prisma Studio

1. Run `yarn db:studio`
2. Open the database
3. You won't see the extension directly, but you can verify it works by:
   - Creating a table with a vector column
   - Running a migration that uses vector types

## What to Look For

### ✅ Success Indicators:

- Extension appears in `pg_extension` table
- Version shows `0.8.0` (or similar)
- Vector functions are available
- You can create vector columns without errors

### ❌ Problem Indicators:

- Extension not in `pg_extension` table
- Error when trying to use `vector` type
- "extension does not exist" errors

## Next Steps After Verification

Once pgvector is confirmed:

1. **Add vector columns to Prisma schema:**

   ```prisma
   model ConversationEmbedding {
     embedding Unsupported("vector(1536)")
   }
   ```

2. **Run migrations:**

   ```bash
   yarn prisma:migrate
   ```

3. **Verify vector columns exist:**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'conversation_embeddings'
   AND column_name = 'embedding';
   ```

## Quick Verification Script

Run this to get a complete status:

```sql
-- Complete pgvector status check
SELECT
  'Extension Status' as check_type,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
    THEN '✅ Installed'
    ELSE '❌ Not Installed'
  END as status,
  (SELECT extversion FROM pg_extension WHERE extname = 'vector') as details
UNION ALL
SELECT
  'Vector Functions' as check_type,
  COUNT(*)::text as status,
  'Available' as details
FROM pg_proc
WHERE proname LIKE '%vector%'
UNION ALL
SELECT
  'Vector Columns' as check_type,
  COUNT(*)::text as status,
  'In database' as details
FROM information_schema.columns
WHERE udt_name = 'vector';
```
